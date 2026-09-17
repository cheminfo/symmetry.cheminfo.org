/**
 * An operation as a matrix, and as the path the structure takes to get there.
 *
 * A proper rotation and a screw have a rigid path from the identity, so they
 * are turned through it and the molecule visibly lands back on itself. The
 * improper ones have none: no continuous rigid motion carries a body onto its
 * mirror image. Pretending otherwise would teach the wrong thing, so instead the
 * structure passes *through* the plane or the centre — flat at the halfway
 * point, which is exactly where the operation's fixed set is.
 */

import type { Mat3 } from '../symmetry/point/mat3.ts';
import {
  IDENTITY_MATRIX,
  INVERSION_MATRIX,
  applyMatrix,
  multiplyMatrices,
  reflectionMatrix,
  rotationMatrix,
} from '../symmetry/point/mat3.ts';
import type { Vec3 } from '../symmetry/point/vec3.ts';
import {
  addVectors,
  normalizeVector,
  scaleVector,
  subtractVectors,
} from '../symmetry/point/vec3.ts';

import type { Point3, ViewerOperation } from './types.ts';

/** A 4×4 affine matrix, sixteen numbers in **column-major** order. */
export type Matrix4 = readonly number[];

/** The matrix that moves nothing. */
export const IDENTITY_MATRIX4: Matrix4 = affineMatrix(
  IDENTITY_MATRIX,
  [0, 0, 0],
);

/**
 * The operation itself, as one matrix.
 *
 * @param operation - What to apply.
 * @returns The 4×4 matrix, column-major.
 */
export function operationMatrix(operation: ViewerOperation): Matrix4 {
  return operationAt(operation, 1);
}

/**
 * The operation part-way through, so a caller can drive it with a clock.
 *
 * @param operation - What to apply.
 * @param fraction - How far through, from 0 (the identity) to 1 (the operation
 *   itself). Anything outside that is clamped.
 * @returns The 4×4 matrix, column-major.
 */
export function operationAt(
  operation: ViewerOperation,
  fraction: number,
): Matrix4 {
  const t = Math.min(1, Math.max(0, fraction));
  switch (operation.kind) {
    case 'rotation': {
      return aboutPoint(turn(operation, t), operation.origin, [0, 0, 0]);
    }
    case 'screw': {
      return aboutPoint(
        turn(operation, t),
        operation.origin,
        scaleVector(operation.translation, t),
      );
    }
    case 'mirror': {
      return aboutPoint(
        blend(IDENTITY_MATRIX, mirrorOf(operation.normal), t),
        operation.point,
        [0, 0, 0],
      );
    }
    case 'glide': {
      return aboutPoint(
        blend(IDENTITY_MATRIX, mirrorOf(operation.normal), t),
        operation.point,
        scaleVector(operation.translation, t),
      );
    }
    case 'inversion': {
      return aboutPoint(
        blend(IDENTITY_MATRIX, INVERSION_MATRIX, t),
        operation.centre,
        [0, 0, 0],
      );
    }
    case 'improperRotation': {
      return twoPhase(operation, t, mirrorOf(operation.axis));
    }
    case 'rotoinversion': {
      return twoPhase(operation, t, INVERSION_MATRIX);
    }
    // no default
  }
}

/**
 * Whether the path from the identity is a rigid motion all the way.
 *
 * A page says so in one line under the button: a proper rotation turns, and an
 * improper one has to pass through its own mirror.
 *
 * @param operation - What is about to be applied.
 * @returns Whether every frame of it is a rotation.
 */
export function operationIsRigid(operation: ViewerOperation): boolean {
  return operation.kind === 'rotation' || operation.kind === 'screw';
}

/**
 * The fraction of an improper animation spent turning, before the reflection or
 * the inversion begins.
 */
export const ROTATION_PHASE = 0.6;

/** Rotate rigidly, then pass through the plane or the centre. */
function twoPhase(
  operation: Extract<
    ViewerOperation,
    { kind: 'improperRotation' | 'rotoinversion' }
  >,
  t: number,
  improper: Mat3,
): Matrix4 {
  if (t <= ROTATION_PHASE) {
    return aboutPoint(
      turn(operation, t / ROTATION_PHASE),
      operation.origin,
      [0, 0, 0],
    );
  }
  const second = (t - ROTATION_PHASE) / (1 - ROTATION_PHASE);
  const rotated = rotationMatrix(
    normalizeVector(operation.axis),
    angleOf(operation),
  );
  return aboutPoint(
    multiplyMatrices(blend(IDENTITY_MATRIX, improper, second), rotated),
    operation.origin,
    [0, 0, 0],
  );
}

/** The rotation of `operation` carried `t` of the way round. */
function turn(
  operation: Extract<
    ViewerOperation,
    { kind: 'rotation' | 'screw' | 'improperRotation' | 'rotoinversion' }
  >,
  t: number,
): Mat3 {
  return rotationMatrix(
    normalizeVector(operation.axis),
    angleOf(operation) * t,
  );
}

/** `2πk/n`, the angle one application turns through. */
function angleOf(operation: { order: number; power?: number }): number {
  return (2 * Math.PI * (operation.power ?? 1)) / operation.order;
}

/** `I − 2 n̂ n̂ᵀ`, from a normal the caller need not have normalised. */
function mirrorOf(normal: Point3): Mat3 {
  return reflectionMatrix(normalizeVector(normal));
}

/** `(1 − t) a + t b`, component by component. */
function blend(a: Mat3, b: Mat3, t: number): Mat3 {
  return [
    blendRow(a[0], b[0], t),
    blendRow(a[1], b[1], t),
    blendRow(a[2], b[2], t),
  ];
}

function blendRow(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] * (1 - t) + b[0] * t,
    a[1] * (1 - t) + b[1] * t,
    a[2] * (1 - t) + b[2] * t,
  ];
}

/** `x ↦ L(x − p) + p + w`, written as one affine matrix. */
function aboutPoint(linear: Mat3, fixed: Point3, shift: Point3): Matrix4 {
  return affineMatrix(
    linear,
    addVectors(subtractVectors(fixed, applyMatrix(linear, fixed)), shift),
  );
}

/** The 3×3 and the translation, laid out the way a GPU reads them. */
function affineMatrix(linear: Mat3, translation: Point3): Matrix4 {
  return [
    linear[0][0],
    linear[1][0],
    linear[2][0],
    0,
    linear[0][1],
    linear[1][1],
    linear[2][1],
    0,
    linear[0][2],
    linear[1][2],
    linear[2][2],
    0,
    translation[0],
    translation[1],
    translation[2],
    1,
  ];
}
