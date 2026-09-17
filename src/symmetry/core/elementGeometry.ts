import type { SymmetryElementKind } from './elementSymbol.ts';
import {
  greatestCommonDivisor,
  identityMatrix,
  matrixAdjugate,
  matrixDeterminant,
  matrixOrder,
  matrixPowerSum,
  matrixTrace,
  multiplyMatrices,
  multiplyMatrixVector,
  primitiveDirection,
} from './integerMatrix.ts';
import type { Dimension, IntegerMatrix } from './types.ts';
import { TWELFTHS_PER_CELL } from './types.ts';

/**
 * The (determinant, trace) table of International Tables §11.2, complete in both
 * dimensions: `trace` fixes the rotation angle through `2 cos θ`, which is
 * invariant under a change of basis and so reads the same in a hexagonal cell.
 */
export function classifyRotation(
  rotation: IntegerMatrix,
  dimension: Dimension,
): { order: number; proper: boolean } {
  const determinant = matrixDeterminant(rotation);
  const trace = matrixTrace(rotation);
  const proper = determinant === 1;
  if (!proper && dimension === 2) return { order: 2, proper };
  const offset = dimension === 3 ? 1 : 0;
  const cosine = (proper ? trace : -trace) - offset;
  const order = orderFromCosine(cosine);
  if (order === null) {
    throw new RangeError(
      `no crystallographic element has determinant ${determinant} and trace ${trace}`,
    );
  }
  return { order, proper };
}

/** Which of the eight kinds the operation is, once the intrinsic part is known. */
export function elementKind(
  proper: boolean,
  order: number,
  dimension: Dimension,
  intrinsic: readonly number[],
): SymmetryElementKind {
  let moves = false;
  for (const component of intrinsic) {
    if (component !== 0) moves = true;
  }
  if (proper) {
    if (order === 1) return moves ? 'translation' : 'identity';
    return moves ? 'screw' : 'rotation';
  }
  if (dimension === 3 && order === 1) return 'inversion';
  if (order === 2 || dimension === 2) return moves ? 'glide' : 'mirror';
  return 'rotoinversion';
}

/**
 * The axis `[uvw]` of a rotation — the +1 eigenspace of W — or of a
 * rotoinversion, which has none of its own and takes that of W².
 */
export function elementAxis(
  rotation: IntegerMatrix,
  kind: SymmetryElementKind,
  order: number,
): number[] | null {
  if (kind === 'rotation' || kind === 'screw') {
    return firstColumn(matrixPowerSum(rotation, matrixOrder(rotation)));
  }
  if (kind !== 'rotoinversion' || order === 1) return null;
  const squared = multiplyMatrices(rotation, rotation);
  return firstColumn(matrixPowerSum(squared, matrixOrder(squared)));
}

/**
 * The Miller indices `(hkl)` of a mirror or glide: the −1 eigenvector of Wᵀ,
 * read off a column of `adj(Wᵀ + I)`.
 *
 * It is taken in reciprocal space on purpose — in a cell that is not orthogonal
 * the normal is a dual vector, and treating it as a direct-space direction is
 * the classic way to draw a monoclinic mirror in the wrong place.
 */
export function elementNormal(rotation: IntegerMatrix): number[] | null {
  const dimension = rotation.length;
  const transposePlusIdentity: number[][] = [];
  for (let i = 0; i < dimension; i++) {
    const row = new Array<number>(dimension).fill(0);
    for (let j = 0; j < dimension; j++) {
      row[j] = (rotation[j]?.[i] ?? 0) + (i === j ? 1 : 0);
    }
    transposePlusIdentity.push(row);
  }
  return firstColumn(matrixAdjugate(transposePlusIdentity));
}

/** Up to two independent primitive columns of `Σ Wⁿ`, which span the locus. */
export function elementSpan(powerSum: IntegerMatrix): number[][] {
  const size = powerSum.length;
  const basis: number[][] = [];
  for (let j = 0; j < size && basis.length < 2; j++) {
    const direction = primitiveDirection(columnOf(powerSum, j));
    if (direction === null) continue;
    if (basis.length === 0 || isIndependent(basis[0] ?? [], direction)) {
      basis.push(direction);
    }
  }
  return basis;
}

/**
 * Solve `(W − I) x = −w_location` through `x₀ = ((W − I) + P)⁻¹ · (−w_location)`.
 *
 * `(W − I) + P` is invertible although `W − I` is not: `W − I` is invertible off
 * the +1 eigenspace and zero on it, while `P` is the identity on it and zero off
 * it. Everything is scaled by the period so the inverse is an adjugate over a
 * determinant and the answer stays an exact fraction.
 */
export function locateElement(
  rotation: IntegerMatrix,
  powerSum: IntegerMatrix,
  period: number,
  translation: readonly number[],
  intrinsic: readonly number[],
): { location: number[]; locationDenominator: number } {
  const dimension = rotation.length;
  const identity = identityMatrix(dimension);
  const solvable: number[][] = [];
  for (let i = 0; i < dimension; i++) {
    const row = new Array<number>(dimension).fill(0);
    for (let j = 0; j < dimension; j++) {
      row[j] =
        period * ((rotation[i]?.[j] ?? 0) - (identity[i]?.[j] ?? 0)) +
        (powerSum[i]?.[j] ?? 0);
    }
    solvable.push(row);
  }
  const target = new Array<number>(dimension).fill(0);
  for (let index = 0; index < dimension; index++) {
    target[index] =
      -period * ((translation[index] ?? 0) - (intrinsic[index] ?? 0));
  }
  const numerator = multiplyMatrixVector(matrixAdjugate(solvable), target);
  return reduceFraction(
    numerator,
    TWELFTHS_PER_CELL * matrixDeterminant(solvable),
  );
}

function orderFromCosine(cosine: number): number | null {
  switch (cosine) {
    case 2:
      return 1;
    case 1:
      return 6;
    case 0:
      return 4;
    case -1:
      return 3;
    case -2:
      return 2;
    default:
      return null;
  }
}

function reduceFraction(
  numerator: readonly number[],
  denominator: number,
): { location: number[]; locationDenominator: number } {
  const sign = denominator < 0 ? -1 : 1;
  let divisor = Math.abs(denominator);
  for (const value of numerator) {
    divisor = greatestCommonDivisor(divisor, value);
  }
  if (divisor === 0) divisor = 1;
  const location = new Array<number>(numerator.length).fill(0);
  for (let index = 0; index < numerator.length; index++) {
    location[index] = (sign * (numerator[index] ?? 0)) / divisor;
  }
  return { location, locationDenominator: (sign * denominator) / divisor };
}

function firstColumn(matrix: IntegerMatrix): number[] | null {
  for (let j = 0; j < matrix.length; j++) {
    const direction = primitiveDirection(columnOf(matrix, j));
    if (direction !== null) return direction;
  }
  return null;
}

function columnOf(matrix: IntegerMatrix, column: number): number[] {
  const values = new Array<number>(matrix.length).fill(0);
  for (let i = 0; i < matrix.length; i++) values[i] = matrix[i]?.[column] ?? 0;
  return values;
}

function isIndependent(a: readonly number[], b: readonly number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      if ((a[i] ?? 0) * (b[j] ?? 0) - (a[j] ?? 0) * (b[i] ?? 0) !== 0) {
        return true;
      }
    }
  }
  return false;
}
