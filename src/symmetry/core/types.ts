/**
 * The dimension of a crystallographic group: 2 for the plane groups, 3 for the
 * space groups.
 */
export type Dimension = 2 | 3;

/**
 * A symmetry operation of a crystallographic group, in the crystal basis.
 *
 * The rotation part is an exact integer matrix and the translation part is an
 * exact integer count of {@link TWELFTHS_PER_CELL}, so two operations compare
 * with `===` on their `operationKey` and a group expansion terminates. Every
 * translation occurring in the 230 space groups and the 17 wallpaper groups is a
 * twelfth: the denominators that occur are 2, 3, 4 and 6.
 */
export interface CrystalOperation<D extends Dimension = 3> {
  /** How many axes the operation acts on. A `CrystalOperation<2>` is not a `CrystalOperation<3>`. */
  readonly dimension: D;
  /** Rows of the D×D integer matrix W, acting on the fractional column (x, y, z). */
  readonly rotation: ReadonlyArray<readonly number[]>;
  /** Translation w, in twelfths of a cell edge, reduced into [0, 12). */
  readonly translation: readonly number[];
}

/** An exact integer matrix, row-major. */
export type IntegerMatrix = ReadonlyArray<readonly number[]>;

/** The unit a translation is counted in: `6` is 1/2, `4` is 1/3, `3` is 1/4. */
export const TWELFTHS_PER_CELL = 12;

/** Variable names of a fractional coordinate, in order. */
export const AXIS_NAMES = ['x', 'y', 'z'] as const;
