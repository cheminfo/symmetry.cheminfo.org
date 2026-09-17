import {
  identityMatrix,
  matricesEqual,
  matrixAdjugate,
  matrixDeterminant,
  multiplyMatrices,
  multiplyMatrixVector,
} from './integerMatrix.ts';
import type { CrystalOperation, Dimension } from './types.ts';
import { TWELFTHS_PER_CELL } from './types.ts';

/** How close two fractional coordinates must be to count as the same atom. */
const DEFAULT_TOLERANCE = 1e-4;

/**
 * The composition `a ∘ b`: apply `b` first, then `a`, so
 * `compose(a, b)(point)` is `apply(a, apply(b, point))`.
 *
 * The rotation part is `Wa · Wb` and the translation is `Wa · wb + wa`, reduced
 * into the cell — exact integer arithmetic throughout.
 */
export function compose<D extends Dimension>(
  a: CrystalOperation<D>,
  b: CrystalOperation<D>,
): CrystalOperation<D> {
  const rotation = multiplyMatrices(a.rotation, b.rotation);
  const rotated = multiplyMatrixVector(a.rotation, b.translation);
  const translation = new Array<number>(rotated.length).fill(0);
  for (let index = 0; index < rotated.length; index++) {
    translation[index] = wrapTwelfths(
      (rotated[index] ?? 0) + (a.translation[index] ?? 0),
    );
  }
  return { dimension: a.dimension, rotation, translation };
}

/** The inverse operation: rotation `W⁻¹`, translation `−W⁻¹ · w`. */
export function inverse<D extends Dimension>(
  operation: CrystalOperation<D>,
): CrystalOperation<D> {
  const determinant = matrixDeterminant(operation.rotation);
  const adjugate = matrixAdjugate(operation.rotation);
  const rotation: number[][] = [];
  for (const row of adjugate) {
    const values = new Array<number>(adjugate.length).fill(0);
    for (let j = 0; j < adjugate.length; j++) {
      values[j] = (row[j] ?? 0) / determinant;
    }
    rotation.push(values);
  }
  const rotated = multiplyMatrixVector(rotation, operation.translation);
  const translation = new Array<number>(rotated.length).fill(0);
  for (let index = 0; index < rotated.length; index++) {
    translation[index] = wrapTwelfths(-(rotated[index] ?? 0));
  }
  return { dimension: operation.dimension, rotation, translation };
}

/**
 * The image `W · point + w` of a fractional point. The result is **not** wrapped
 * into the cell: pass it through {@link wrapFractional} when the cell is what you
 * want, and leave it alone when you are following a bond out of the cell.
 */
export function apply(
  operation: CrystalOperation<Dimension>,
  point: readonly number[],
): number[] {
  const size = operation.rotation.length;
  const image = new Array<number>(size).fill(0);
  for (let i = 0; i < size; i++) {
    let sum = (operation.translation[i] ?? 0) / TWELFTHS_PER_CELL;
    const row = operation.rotation[i];
    for (let j = 0; j < size; j++) sum += (row?.[j] ?? 0) * (point[j] ?? 0);
    image[i] = sum;
  }
  return image;
}

/** Each coordinate moved into [0, 1) by a whole number of cells. */
export function wrapFractional(point: readonly number[]): number[] {
  const wrapped = new Array<number>(point.length).fill(0);
  for (let index = 0; index < point.length; index++) {
    const value = point[index] ?? 0;
    wrapped[index] = value - Math.floor(value);
  }
  return wrapped;
}

/**
 * The exact key of an operation modulo the lattice: two operations share a key
 * when they are the same coset representative. Integers only, so the comparison
 * is exact and a group expansion terminates.
 */
export function operationKey(operation: CrystalOperation<Dimension>): string {
  let key = '';
  for (const row of operation.rotation) {
    for (let j = 0; j < operation.rotation.length; j++) {
      key += `${row[j] ?? 0},`;
    }
  }
  key += '|';
  for (const twelfths of operation.translation) {
    key += `${wrapTwelfths(twelfths)},`;
  }
  return key;
}

/** The identity operation of the given dimension. */
export function identityOperation<D extends Dimension>(
  dimension: D,
): CrystalOperation<D> {
  return {
    dimension,
    rotation: identityMatrix(dimension),
    translation: new Array<number>(dimension).fill(0),
  };
}

/** Whether the operation is the identity, translation included. */
export function isIdentity(operation: CrystalOperation<Dimension>): boolean {
  for (const twelfths of operation.translation) {
    if (wrapTwelfths(twelfths) !== 0) return false;
  }
  return matricesEqual(
    operation.rotation,
    identityMatrix(operation.rotation.length),
  );
}

/**
 * The orbit of one fractional position: every distinct image under the
 * operations, wrapped into the cell.
 *
 * The returned `operationIndex` is what lets the page say *which* operation put
 * an atom where it is, and hovering it highlight the element that generated it.
 * Its length is the multiplicity of the position, which is exact.
 *
 * @param position - A fractional position; it need not be inside the cell.
 * @param operations - The full coset list, centring translations included.
 * @param tolerance - Fractional distance below which two images are one atom.
 *   @default 1e-4
 */
export function orbit(
  position: readonly number[],
  operations: ReadonlyArray<CrystalOperation<Dimension>>,
  tolerance = DEFAULT_TOLERANCE,
): Array<{ position: number[]; operationIndex: number }> {
  const images: Array<{ position: number[]; operationIndex: number }> = [];
  for (let index = 0; index < operations.length; index++) {
    const operation = operations[index];
    if (operation === undefined) continue;
    const image = wrapFractional(apply(operation, position));
    let seen = false;
    for (let other = 0; other < images.length && !seen; other++) {
      seen = sameSite(image, images[other]?.position ?? [], tolerance);
    }
    if (!seen) images.push({ position: image, operationIndex: index });
  }
  return images;
}

/** Whether two wrapped fractional positions are the same site, across the cell edge. */
export function sameSite(
  a: readonly number[],
  b: readonly number[],
  tolerance = DEFAULT_TOLERANCE,
): boolean {
  for (let index = 0; index < a.length; index++) {
    const difference = Math.abs((a[index] ?? 0) - (b[index] ?? 0));
    if (Math.min(difference, 1 - difference) > tolerance) return false;
  }
  return true;
}

/** A count of twelfths reduced into [0, 12). */
export function wrapTwelfths(twelfths: number): number {
  return (
    ((twelfths % TWELFTHS_PER_CELL) + TWELFTHS_PER_CELL) % TWELFTHS_PER_CELL
  );
}

/** The dimension an operation lives in, read off its rotation part. */
export function dimensionOf(operation: CrystalOperation<Dimension>): Dimension {
  return operation.rotation.length === 2 ? 2 : 3;
}
