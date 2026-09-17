import type { PointOperation } from '../operations.ts';
import { indexOfOperation, operationFromMatrix } from '../operations.ts';
import { closeGroup } from '../pointGroups.ts';

import type { DetectedAtom } from './inventory.ts';
import { candidateMatrices, mapsOnto } from './inventory.ts';

/**
 * How far two operation matrices may be and still be the same operation, for a
 * structure whose furthest atom is `radius` from the centre.
 *
 * An operation found at a distance tolerance is only nearly exact — a candidate
 * whose reference pair is off by the width of the tolerance turns by a little
 * too much — so the group has to be assembled with room for that, or a `C₃` and
 * its own square fail to compose back to the identity. Two operations count as
 * one when no atom can tell them apart at this tolerance, which is what ties
 * this to the distance the user set.
 */
export function matrixTolerance(tolerance: number, radius: number): number {
  return Math.max(1e-3, tolerance / Math.max(1, radius));
}

/**
 * How far from `2πk/n` a matrix may turn and still be read as `Cₙᵏ`, in turns.
 *
 * Two fractions with denominators up to 16 are never closer than 1/240, so this
 * has to stay well under that or an axis would be read as the wrong order.
 */
export const ANGLE_TOLERANCE = 2e-3;

/** What the search found, and whether it composes into a group. */
export interface SearchResult {
  readonly operations: readonly PointOperation[];
  /** `false` when the operations do not close, which means the tolerance is too loose. */
  readonly closed: boolean;
}

/** The group of a structure, or the operations found when they do not close. */
export function closedOperations(
  atoms: readonly DetectedAtom[],
  tolerance: number,
  maxOrder: number,
): SearchResult {
  const found = generatorsFrom(atoms, tolerance, maxOrder);
  try {
    return {
      operations: closeGroup(found, {
        tolerance: matrixTolerance(tolerance, furthest(atoms)),
        angleTolerance: ANGLE_TOLERANCE,
      }),
      closed: true,
    };
  } catch {
    // The operations found do not compose into a group, which means the
    // tolerance is too loose for this structure. Say so rather than invent one.
    return { operations: found, closed: false };
  }
}

/** How far the furthest atom is from the centre. */
export function furthest(atoms: readonly DetectedAtom[]): number {
  let radius = 0;
  for (const atom of atoms) {
    const distance = Math.hypot(...atom.position);
    if (distance > radius) radius = distance;
  }
  return radius;
}

/**
 * Every operation the structure really has.
 *
 * A candidate that maps the molecule onto itself is an operation, so this list
 * is already the group; it is still closed afterwards, because a candidate whose
 * order is above `maxOrder` is refused and a group missing one operation is
 * worse than a slow one.
 */
export function generatorsFrom(
  atoms: readonly DetectedAtom[],
  tolerance: number,
  maxOrder: number,
): PointOperation[] {
  const operations: PointOperation[] = [];
  for (const matrix of candidateMatrices(atoms, tolerance)) {
    if (!mapsOnto(atoms, matrix, tolerance)) continue;
    let operation: PointOperation;
    try {
      operation = operationFromMatrix(matrix, {
        maxOrder: 2 * maxOrder,
        // A candidate accepted at this tolerance is only nearly an operation,
        // so the angle it turns by is only nearly 2πk/n.
        angleTolerance: ANGLE_TOLERANCE,
      });
    } catch {
      // An axis of an order no point group of this size has: not an operation.
      continue;
    }
    // Two candidates that snap to the same operation are one generator.
    const same = indexOfOperation(
      operations,
      operation,
      matrixTolerance(tolerance, furthest(atoms)),
    );
    if (same === -1) {
      operations.push(operation);
    }
  }
  return operations;
}
