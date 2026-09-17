import { greatestCommonDivisor } from '../core/integerMatrix.ts';

import type { Mat3 } from './mat3.ts';
import {
  IDENTITY_MATRIX,
  INVERSION_MATRIX,
  matrixDeterminant,
  matrixDistance,
  matrixTrace,
  scaleMatrix,
} from './mat3.ts';
import type { Vec3 } from './vec3.ts';
import { normalizeVector, vectorNorm } from './vec3.ts';

/** What a 3×3 orthogonal matrix turns out to be. */
export interface MatrixGeometry {
  /** `true` when `det = +1`: a rotation. `false` for a reflection, an inversion or an Sₙ. */
  readonly proper: boolean;
  /**
   * The rotation angle in radians, in `[0, 2π)`. For an improper matrix this is
   * the angle α of `Sₙ = σ_h · R(α)`: 0 is a mirror plane and π is the inversion.
   */
  readonly angle: number;
  /** The rotation axis, or the plane normal for a mirror. `null` for E and i. */
  readonly axis: Vec3 | null;
}

/**
 * The axis and angle a symmetry operation matrix stands for.
 *
 * An improper matrix M is read as `i · R`, because `i · R(n̂, φ) = S(n̂, φ + π)`:
 * the improper angle is the proper angle of `−M` plus π, about the same axis.
 * That makes `−I` the inversion and `φ = π` a mirror plane, with no special case.
 *
 * @throws When the matrix is not orthogonal to `tolerance`.
 */
export function matrixGeometry(matrix: Mat3, tolerance = 1e-6): MatrixGeometry {
  const determinant = matrixDeterminant(matrix);
  if (Math.abs(Math.abs(determinant) - 1) > tolerance) {
    throw new RangeError(
      `a symmetry operation has determinant ±1, not ${determinant.toFixed(6)}`,
    );
  }
  const proper = determinant > 0;
  const rotation = proper ? matrix : scaleMatrix(matrix, -1);
  const angle = rotationAngle(rotation);
  const improperAngle = angle + Math.PI;
  return {
    proper,
    angle: proper ? angle : improperAngle % (2 * Math.PI),
    axis: rotationAxis(rotation, angle, tolerance),
  };
}

/**
 * The angle of a proper rotation matrix, in `[0, π]`.
 *
 * From `atan2(sin θ, cos θ)`, with `2 cos θ = tr R − 1` and `2 sin θ` the length
 * of the antisymmetric part — never from `acos` alone. `acos` loses half its
 * digits near 0 and π, which puts a half turn out by about 5·10⁻⁷ radians, and
 * that is enough for the rational-angle fit to reject a perfectly good `C₂`.
 *
 * The sign of the angle is not recoverable on its own: it belongs to the choice
 * of axis sense, which {@link rotationAxis} fixes.
 */
export function rotationAngle(rotation: Mat3): number {
  const cosine = (matrixTrace(rotation) - 1) / 2;
  const sine =
    Math.hypot(
      rotation[2][1] - rotation[1][2],
      rotation[0][2] - rotation[2][0],
      rotation[1][0] - rotation[0][1],
    ) / 2;
  return Math.atan2(sine, cosine);
}

/**
 * The axis of a proper rotation, oriented so that the rotation by `+angle` about
 * it is the matrix. `null` for the identity, which has no axis.
 */
export function rotationAxis(
  rotation: Mat3,
  angle: number,
  tolerance = 1e-6,
): Vec3 | null {
  if (angle < tolerance) return null;
  const antisymmetric: Vec3 = [
    rotation[2][1] - rotation[1][2],
    rotation[0][2] - rotation[2][0],
    rotation[1][0] - rotation[0][1],
  ];
  if (vectorNorm(antisymmetric) > tolerance) {
    return normalizeVector(antisymmetric);
  }
  // A half turn: R + I = 2 n̂ n̂ᵀ, so the largest diagonal names the best column.
  const diagonal: Vec3 = [rotation[0][0], rotation[1][1], rotation[2][2]];
  let best: 0 | 1 | 2 = 0;
  if (diagonal[1] > diagonal[best]) best = 1;
  if (diagonal[2] > diagonal[best]) best = 2;
  const column: Vec3 = [
    rotation[0][best] + (best === 0 ? 1 : 0),
    rotation[1][best] + (best === 1 ? 1 : 0),
    rotation[2][best] + (best === 2 ? 1 : 0),
  ];
  return normalizeVector(column);
}

/**
 * The angle `2πp/q` closest to `angle`, in lowest terms, or `null` when no
 * denominator up to `maxOrder` fits it to `tolerance`.
 */
export function rationalAngle(
  angle: number,
  maxOrder: number,
  tolerance = 1e-6,
): { readonly order: number; readonly power: number } | null {
  const turns = angle / (2 * Math.PI);
  for (let order = 1; order <= maxOrder; order++) {
    const power = Math.round(turns * order);
    if (Math.abs(turns - power / order) > tolerance) continue;
    if (greatestCommonDivisor(Math.abs(power), order) !== 1) continue;
    return { order, power: ((power % order) + order) % order };
  }
  return null;
}

/** Whether the matrix is the identity to `tolerance`. */
export function isIdentityMatrix(matrix: Mat3, tolerance = 1e-6): boolean {
  return matrixDistance(matrix, IDENTITY_MATRIX) <= tolerance;
}

/** Whether the matrix is the inversion to `tolerance`. */
export function isInversionMatrix(matrix: Mat3, tolerance = 1e-6): boolean {
  return matrixDistance(matrix, INVERSION_MATRIX) <= tolerance;
}

/**
 * The sense of an axis, fixed so that the same axis always comes back the same
 * way: the first component that is not zero is positive.
 */
export function canonicalSense(axis: Vec3, tolerance = 1e-9): Vec3 {
  for (let i = 0; i < 3; i++) {
    const component = axis[i] as number;
    if (Math.abs(component) <= tolerance) continue;
    return component > 0 ? axis : [-axis[0], -axis[1], -axis[2]];
  }
  return axis;
}

/**
 * `Sₙᵏ` is written with an odd k, because an even one is a proper rotation. So
 * a reduced `p/q` with an odd q takes `k = p + q` when p is even: the improper
 * rotation by 240° is `S₃⁵`, never `S₃²`, which is `C₃²`.
 */
export function improperSymbol(
  rational: { readonly order: number; readonly power: number },
  proper: boolean,
): { readonly order: number; readonly power: number } {
  if (proper || rational.order % 2 === 0 || rational.power % 2 === 1) {
    return rational;
  }
  return { order: rational.order, power: rational.power + rational.order };
}
