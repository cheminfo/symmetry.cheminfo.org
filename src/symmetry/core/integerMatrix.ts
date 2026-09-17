import type { IntegerMatrix } from './types.ts';

/**
 * The product `a · b` of two square integer matrices of the same size.
 *
 * @param a - Left factor, row-major.
 * @param b - Right factor, row-major.
 * @returns The product, row-major.
 */
export function multiplyMatrices(
  a: IntegerMatrix,
  b: IntegerMatrix,
): number[][] {
  const size = a.length;
  const product: number[][] = [];
  for (let i = 0; i < size; i++) {
    const values = new Array<number>(size).fill(0);
    for (let k = 0; k < size; k++) {
      const factor = entry(a, i, k);
      if (factor === 0) continue;
      for (let j = 0; j < size; j++) {
        values[j] = (values[j] ?? 0) + factor * entry(b, k, j);
      }
    }
    product.push(values);
  }
  return product;
}

/** The product `matrix · vector`. */
export function multiplyMatrixVector(
  matrix: IntegerMatrix,
  vector: readonly number[],
): number[] {
  const size = matrix.length;
  const image = new Array<number>(size).fill(0);
  for (let i = 0; i < size; i++) {
    let sum = 0;
    for (let j = 0; j < vector.length; j++) {
      sum += entry(matrix, i, j) * (vector[j] ?? 0);
    }
    image[i] = sum;
  }
  return image;
}

/** The `size × size` identity matrix. */
export function identityMatrix(size: number): number[][] {
  const identity: number[][] = [];
  for (let i = 0; i < size; i++) {
    const values = new Array<number>(size).fill(0);
    values[i] = 1;
    identity.push(values);
  }
  return identity;
}

/**
 * The determinant of a 2×2 or 3×3 integer matrix.
 *
 * @throws When the matrix is not 2×2 or 3×3; no crystallographic operation is.
 */
export function matrixDeterminant(matrix: IntegerMatrix): number {
  if (matrix.length === 2) {
    return (
      entry(matrix, 0, 0) * entry(matrix, 1, 1) -
      entry(matrix, 0, 1) * entry(matrix, 1, 0)
    );
  }
  if (matrix.length !== 3) {
    throw new RangeError(
      `expected a 2×2 or 3×3 matrix, received ${matrix.length}×${matrix.length}`,
    );
  }
  // The cyclic cofactor expansion: the index rotation already carries the sign,
  // so there is no alternating factor to apply on top of it.
  let determinant = 0;
  for (let j = 0; j < 3; j++) {
    determinant +=
      entry(matrix, 0, j) *
      (entry(matrix, 1, (j + 1) % 3) * entry(matrix, 2, (j + 2) % 3) -
        entry(matrix, 1, (j + 2) % 3) * entry(matrix, 2, (j + 1) % 3));
  }
  return determinant;
}

/** The trace, which is invariant under a change of basis and so names the rotation angle. */
export function matrixTrace(matrix: IntegerMatrix): number {
  let trace = 0;
  for (let i = 0; i < matrix.length; i++) trace += entry(matrix, i, i);
  return trace;
}

/**
 * The adjugate: `adjugate(m) · m = det(m) · I`, exactly, in integers.
 *
 * It is how this core inverts an integer matrix without ever dividing, so an
 * element's position stays an exact fraction.
 */
export function matrixAdjugate(matrix: IntegerMatrix): number[][] {
  if (matrix.length === 2) {
    return [
      [entry(matrix, 1, 1), -entry(matrix, 0, 1)],
      [-entry(matrix, 1, 0), entry(matrix, 0, 0)],
    ];
  }
  const adjugate: number[][] = [];
  for (let i = 0; i < 3; i++) {
    const values = new Array<number>(3).fill(0);
    for (let j = 0; j < 3; j++) {
      const rows = [(j + 1) % 3, (j + 2) % 3];
      const columns = [(i + 1) % 3, (i + 2) % 3];
      values[j] =
        entry(matrix, rows[0] ?? 0, columns[0] ?? 0) *
          entry(matrix, rows[1] ?? 0, columns[1] ?? 0) -
        entry(matrix, rows[0] ?? 0, columns[1] ?? 0) *
          entry(matrix, rows[1] ?? 0, columns[0] ?? 0);
    }
    adjugate.push(values);
  }
  return adjugate;
}

/** Whether two matrices hold the same integers. */
export function matricesEqual(a: IntegerMatrix, b: IntegerMatrix): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length; j++) {
      if (entry(a, i, j) !== entry(b, i, j)) return false;
    }
  }
  return true;
}

/**
 * The order of a rotation part: the smallest `k ≥ 1` with `W^k = I`.
 *
 * @throws When no power up to 6 is the identity, which no crystallographic
 *   rotation part can fail.
 */
export function matrixOrder(matrix: IntegerMatrix): number {
  const identity = identityMatrix(matrix.length);
  let power: IntegerMatrix = matrix;
  for (let k = 1; k <= 6; k++) {
    if (matricesEqual(power, identity)) return k;
    power = multiplyMatrices(power, matrix);
  }
  throw new RangeError(
    'the matrix has no crystallographic order: W^k ≠ I for every k ≤ 6',
  );
}

/**
 * `Σ W^n` for `n` from 0 to `order − 1`, the projector onto the +1 eigenspace
 * scaled by the order. Its columns span the axis of a rotation or the plane of
 * a mirror, and it is what splits a translation into its intrinsic and location
 * parts.
 */
export function matrixPowerSum(
  matrix: IntegerMatrix,
  order: number,
): number[][] {
  const size = matrix.length;
  let power = identityMatrix(size);
  const sum = new Array<number[]>(size);
  for (let i = 0; i < size; i++) sum[i] = new Array<number>(size).fill(0);
  for (let n = 0; n < order; n++) {
    for (let i = 0; i < size; i++) {
      const target = sum[i] ?? [];
      for (let j = 0; j < size; j++) {
        target[j] = (target[j] ?? 0) + entry(power, i, j);
      }
    }
    power = multiplyMatrices(power, matrix);
  }
  return sum;
}

/** The greatest common divisor of two integers, always positive. */
export function greatestCommonDivisor(a: number, b: number): number {
  let left = Math.abs(a);
  let right = Math.abs(b);
  while (right !== 0) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }
  return left;
}

/**
 * The primitive integer direction along `vector`: divided by the greatest common
 * divisor of its components, and signed so the first non-zero component is
 * positive. `[0, 0, -2]` becomes `[0, 0, 1]`.
 *
 * @returns `null` when every component is zero.
 */
export function primitiveDirection(vector: readonly number[]): number[] | null {
  let divisor = 0;
  for (const value of vector) {
    divisor = greatestCommonDivisor(divisor, value);
  }
  if (divisor === 0) return null;
  let sign = 1;
  for (const value of vector) {
    if (value !== 0) {
      sign = value < 0 ? -1 : 1;
      break;
    }
  }
  const direction = new Array<number>(vector.length).fill(0);
  for (let i = 0; i < vector.length; i++) {
    // `+ 0` so a zero component never prints as the -0 a sign flip would leave.
    direction[i] = (sign * (vector[i] ?? 0)) / divisor + 0;
  }
  return direction;
}

/** One entry, or 0 outside the matrix, so `noUncheckedIndexedAccess` costs nothing here. */
function entry(matrix: IntegerMatrix, row: number, column: number): number {
  return matrix[row]?.[column] ?? 0;
}
