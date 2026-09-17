import {
  canonicalSense,
  improperSymbol,
  isIdentityMatrix,
  isInversionMatrix,
  matrixGeometry,
  rationalAngle,
} from './classify.ts';
import type { Mat3 } from './mat3.ts';
import {
  IDENTITY_MATRIX,
  INVERSION_MATRIX,
  multiplyMatrices,
  reflectionMatrix,
  rotationMatrix,
  transposeMatrix,
} from './mat3.ts';
import type { Vec3 } from './vec3.ts';
import { normalizeVector } from './vec3.ts';

/** The five kinds of operation a molecular point group is made of. */
export type PointOperationKind = 'E' | 'Cn' | 'sigma' | 'i' | 'Sn';

/**
 * One operation of a molecular point group.
 *
 * Cartesian and floating point, because the axes of a molecule are not lattice
 * directions: a `Cₙ` of a molecule may point anywhere. The crystallographic
 * counterpart, which is exact, is `CrystalOperation` in `src/symmetry/core`.
 */
export interface PointOperation {
  readonly kind: PointOperationKind;
  /** The 3×3 Cartesian matrix, about the fixed point at the origin. */
  readonly matrix: Mat3;
  /** n of `Cₙ` and `Sₙ`. 1 for E, i and a plane. */
  readonly order: number;
  /** k of `Cₙᵏ` and `Sₙᵏ`. 0 for E, 1 for i and a plane. */
  readonly power: number;
  /** The unit axis, or the unit normal of a plane. `null` for E and i. */
  readonly axis: Vec3 | null;
  /** How a chemist writes it: `E`, `C3`, `C3^2`, `σ`, `S4^3`, `i`. */
  readonly label: string;
}

/** The identity, which every group contains. */
export function identityOperation(): PointOperation {
  return {
    kind: 'E',
    matrix: IDENTITY_MATRIX,
    order: 1,
    power: 0,
    axis: null,
    label: 'E',
  };
}

/** The inversion through the origin, `i = S₂`. */
export function inversionOperation(): PointOperation {
  return {
    kind: 'i',
    matrix: INVERSION_MATRIX,
    order: 1,
    power: 1,
    axis: null,
    label: 'i',
  };
}

/** The rotation `Cₙᵏ` about `axis`, right-handed. */
export function rotationOperation(
  axis: Vec3,
  order: number,
  power = 1,
): PointOperation {
  const unit = normalizeVector(axis);
  return operationFromMatrix(
    rotationMatrix(unit, (2 * Math.PI * power) / order),
    { axis: unit, maxOrder: Math.max(order, 8) },
  );
}

/** The reflection in the plane through the origin with unit normal `normal`. */
export function reflectionOperation(normal: Vec3): PointOperation {
  const unit = canonicalSense(normalizeVector(normal));
  return {
    kind: 'sigma',
    matrix: reflectionMatrix(unit),
    order: 1,
    power: 1,
    axis: unit,
    label: 'σ',
  };
}

/** The improper rotation `Sₙᵏ = σ_h · Cₙᵏ` about `axis`. */
export function improperOperation(
  axis: Vec3,
  order: number,
  power = 1,
): PointOperation {
  const unit = normalizeVector(axis);
  const angle = (2 * Math.PI * power) / order;
  return operationFromMatrix(
    multiplyMatrices(reflectionMatrix(unit), rotationMatrix(unit, angle)),
    { axis: unit, maxOrder: Math.max(order, 8) },
  );
}

/**
 * What a 3×3 orthogonal matrix is, as an operation.
 *
 * @param options.axis - The sense the axis is reported in, when the caller has
 *   one. Without it the axis is oriented by {@link canonicalSense}, so the same
 *   matrix always comes back with the same axis and the same power.
 * @param options.maxOrder - The largest `n` accepted. @default 12
 * @throws When the matrix is not an operation of order at most `maxOrder`.
 */
export function operationFromMatrix(
  matrix: Mat3,
  options: {
    readonly axis?: Vec3;
    readonly maxOrder?: number;
    readonly angleTolerance?: number;
  } = {},
): PointOperation {
  const maxOrder = options.maxOrder ?? 12;
  const angleTolerance = options.angleTolerance ?? 1e-6;
  if (isIdentityMatrix(matrix)) return identityOperation();
  if (isInversionMatrix(matrix)) return inversionOperation();
  const geometry = matrixGeometry(matrix);
  const found = geometry.axis as Vec3;
  const preferred = options.axis ? normalizeVector(options.axis) : null;
  const flip =
    preferred === null
      ? canonicalSense(found) !== found
      : found[0] * preferred[0] +
          found[1] * preferred[1] +
          found[2] * preferred[2] <
        0;
  const axis = flip ? ([-found[0], -found[1], -found[2]] as Vec3) : found;
  const angle = flip ? 2 * Math.PI - geometry.angle : geometry.angle;
  const rational = rationalAngle(angle, maxOrder, angleTolerance);
  if (rational === null) {
    throw new RangeError(
      `no axis of order ${maxOrder} or less turns by ${((angle * 180) / Math.PI).toFixed(3)}°`,
    );
  }
  if (rational.order === 1) {
    // S₁ is a mirror plane and is always written as one; C₁ is the identity.
    return geometry.proper ? identityOperation() : reflectionOperation(axis);
  }
  if (!geometry.proper && rational.order === 2 && rational.power === 1) {
    return inversionOperation();
  }
  const { order, power } = improperSymbol(rational, geometry.proper);
  const turn = rotationMatrix(axis, (2 * Math.PI * power) / order);
  return {
    kind: geometry.proper ? 'Cn' : 'Sn',
    // Rebuilt from the axis and the angle, never kept as it came in: a matrix
    // that is only nearly an operation squares to something that is only nearly
    // the identity, and a closure over those never terminates in a group.
    matrix: geometry.proper
      ? turn
      : multiplyMatrices(reflectionMatrix(axis), turn),
    order,
    power,
    axis,
    label: `${geometry.proper ? 'C' : 'S'}${order}${power === 1 ? '' : `^${power}`}`,
  };
}

/** `a` applied after `b`. */
export function composeOperations(
  a: PointOperation,
  b: PointOperation,
  options: {
    readonly maxOrder?: number;
    readonly angleTolerance?: number;
  } = {},
): PointOperation {
  return operationFromMatrix(multiplyMatrices(a.matrix, b.matrix), options);
}

/** The inverse operation, which for an orthogonal matrix is its transpose. */
export function invertOperation(
  operation: PointOperation,
  maxOrder = 12,
): PointOperation {
  return operationFromMatrix(transposeMatrix(operation.matrix), {
    axis: operation.axis ?? undefined,
    maxOrder,
  });
}

/**
 * How many times the operation must be repeated to return to the identity.
 *
 * This is the rule students get wrong: `order(Sₙ) = n` for even n but **2n for
 * odd n**, because `Sₙᵏ = σ_h^k Cₙᵏ` and `σ_h^k = E` only for even k. So an `S₃`
 * axis generates six operations, and that set is the group `C₃h`.
 */
export function operationCycleLength(operation: PointOperation): number {
  switch (operation.kind) {
    case 'E': {
      return 1;
    }
    case 'i':
    case 'sigma': {
      return 2;
    }
    case 'Cn': {
      return operation.order;
    }
    case 'Sn': {
      return operation.order % 2 === 0 ? operation.order : 2 * operation.order;
    }
    // no default
  }
}

/** The same operation under another name, for the σ_h / σ_v / σ_d distinction. */
export function relabelOperation(
  operation: PointOperation,
  label: string,
): PointOperation {
  return { ...operation, label };
}
