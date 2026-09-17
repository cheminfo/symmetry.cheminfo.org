import type { UnitCell } from './lattice.ts';
import type { CrystalOperation } from './types.ts';

/** The three parameters of a two-dimensional cell: two edges in Å, one angle in degrees. */
export interface UnitCell2D {
  readonly a: number;
  readonly b: number;
  /** Angle between a and b, in degrees. */
  readonly gamma: number;
}

/**
 * The three-dimensional operation a plane-group operation *is*: `x+1/2, -y`
 * becomes `x+1/2, -y, z`.
 *
 * A wallpaper group is a space group whose third axis carries nothing, so
 * lifting it lets the orbit generator, the element decomposition and the cell
 * maths run on it unchanged, and the two-dimensional drawing is the projection
 * along **c**. Lift and reuse; never write a second pipeline.
 */
export function liftOperation(
  operation: CrystalOperation<2>,
): CrystalOperation<3> {
  const rotation: number[][] = [];
  for (let i = 0; i < 2; i++) {
    rotation.push([
      operation.rotation[i]?.[0] ?? 0,
      operation.rotation[i]?.[1] ?? 0,
      0,
    ]);
  }
  rotation.push([0, 0, 1]);
  return {
    dimension: 3,
    rotation,
    translation: [
      operation.translation[0] ?? 0,
      operation.translation[1] ?? 0,
      0,
    ],
  };
}

/**
 * The two-dimensional operation a lifted one came from.
 *
 * @throws When the third axis carries anything, so the operation is not a lift.
 */
export function projectOperation(
  operation: CrystalOperation<3>,
): CrystalOperation<2> {
  const third = operation.rotation[2];
  const carries =
    (third?.[0] ?? 0) !== 0 ||
    (third?.[1] ?? 0) !== 0 ||
    (third?.[2] ?? 0) !== 1 ||
    (operation.rotation[0]?.[2] ?? 0) !== 0 ||
    (operation.rotation[1]?.[2] ?? 0) !== 0 ||
    (operation.translation[2] ?? 0) !== 0;
  if (carries) {
    throw new RangeError(
      'the operation acts on the third axis, so it is not a lift',
    );
  }
  return {
    dimension: 2,
    rotation: [
      [operation.rotation[0]?.[0] ?? 0, operation.rotation[0]?.[1] ?? 0],
      [operation.rotation[1]?.[0] ?? 0, operation.rotation[1]?.[1] ?? 0],
    ],
    translation: [operation.translation[0] ?? 0, operation.translation[1] ?? 0],
  };
}

/** The plane cell as a unit cell one Å deep, so the lattice maths applies to it. */
export function liftCell(cell: UnitCell2D): UnitCell {
  return { a: cell.a, b: cell.b, c: 1, alpha: 90, beta: 90, gamma: cell.gamma };
}
