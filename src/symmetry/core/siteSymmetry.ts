import { apply } from './operation.ts';
import { pointGroupName } from './pointGroupName.ts';
import type { CrystalOperation, Dimension, IntegerMatrix } from './types.ts';

/** How far an image may sit from the position and still count as fixed. */
const DEFAULT_TOLERANCE = 1e-4;

/**
 * What a position sits on: the operations that leave it where it is, how many
 * copies of it the cell therefore holds, and the name of the point group they
 * form.
 *
 * This is what the site says instead of a Wyckoff letter. The letter is a
 * convention that cannot be derived from the operations; the multiplicity and
 * the site symmetry can, they are exact, and they are the chemistry — a readout
 * of `multiplicity 4, site symmetry m-3m` says everything `4a` says and says it
 * without a table nobody can check.
 */
export interface SiteSymmetry {
  /** The order of the stabiliser: how many operations leave the position fixed. */
  readonly order: number;
  /** How many copies of the position the cell holds: `operations.length / order`. */
  readonly multiplicity: number;
  /** The Hermann–Mauguin name of the stabiliser, `1` for a general position. */
  readonly symbol: string;
  /** Indices into `operations` of the operations that fix the position. */
  readonly stabiliser: readonly number[];
  /** Whether nothing but the identity fixes it. */
  readonly general: boolean;
}

/**
 * The stabiliser of a fractional position under a group, and the multiplicity
 * that follows from it by the orbit–stabiliser theorem.
 *
 * An operation fixes the position when it returns it to itself **modulo a
 * lattice translation**, which is what makes the origin of a face-centred group
 * come out at multiplicity 4 rather than 1.
 *
 * @param position - A fractional position; it need not be inside the cell.
 * @param operations - The full coset list, centring translations included.
 * @param tolerance - How far an image may sit from the position. @default 1e-4
 */
export function siteSymmetry(
  position: readonly number[],
  operations: ReadonlyArray<CrystalOperation<Dimension>>,
  tolerance = DEFAULT_TOLERANCE,
): SiteSymmetry {
  const dimension = (operations[0]?.rotation.length ??
    position.length) as Dimension;
  const stabiliser: number[] = [];
  const rotations: IntegerMatrix[] = [];
  for (let index = 0; index < operations.length; index++) {
    const operation = operations[index];
    if (operation === undefined) continue;
    if (!fixes(operation, position, tolerance)) continue;
    stabiliser.push(index);
    rotations.push(operation.rotation);
  }
  return {
    order: stabiliser.length,
    multiplicity: operations.length / stabiliser.length,
    symbol: pointGroupName(rotations, dimension),
    stabiliser,
    general: stabiliser.length === 1,
  };
}

/** Whether the operation returns the position to itself, modulo a lattice translation. */
export function fixes(
  operation: CrystalOperation<Dimension>,
  position: readonly number[],
  tolerance = DEFAULT_TOLERANCE,
): boolean {
  const image = apply(operation, position);
  for (let index = 0; index < image.length; index++) {
    const difference = (image[index] ?? 0) - (position[index] ?? 0);
    if (Math.abs(difference - Math.round(difference)) > tolerance) return false;
  }
  return true;
}
