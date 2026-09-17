/**
 * Which operations of a group are one operation seen from another direction.
 *
 * Two operations are conjugate when some operation of the group carries one
 * onto the other — `g a g⁻¹ = b` — and the classes that relation cuts a group
 * into are what a character table heads its columns with. They are also what an
 * operation is named from: D₆ₕ's principal two-fold is a class of its own and
 * is `C₂(z)`, while the six in the ring plane fall into two classes of three
 * and are `C₂′` and `C₂″`. A number running from 1 to 7 across the group throws
 * all of that away.
 */

import { indexOfOperation } from './compare.ts';
import type { PointOperation } from './operation.ts';
import { composeOperations, invertOperation } from './operation.ts';

/**
 * How far two matrices may be and still be the same operation.
 *
 * Not machine zero: an operation read off a molecule at the detector's
 * tolerance is already off by a few parts in 10⁵, and a conjugate of it by
 * more.
 */
const CLASS_TOLERANCE = 1e-6;

/**
 * The conjugacy class of every operation, as an index per operation.
 *
 * Classes are numbered in the order their first member appears, so the
 * partition reads the same way twice running and a name built from it is
 * stable.
 *
 * A set that is not closed still comes back fully partitioned — every
 * operation is seeded into a class of its own before its conjugates are
 * sought — because the detector can hand over an unclosed set and a name is
 * owed for each of them anyway.
 * @param operations - The operations of a group, in any order.
 * @param tolerance - How far two matrices may be and still be the same.
 * @returns One class index per operation, counting from 0.
 */
export function operationClassIndices(
  operations: readonly PointOperation[],
  tolerance = CLASS_TOLERANCE,
): readonly number[] {
  const classes = new Array<number>(operations.length).fill(-1);
  let next = 0;
  for (let index = 0; index < operations.length; index++) {
    if (classes[index] !== -1) continue;
    const current = next++;
    classes[index] = current;
    const subject = operations[index] as PointOperation;
    for (const other of operations) {
      const conjugate = composeOperations(
        composeOperations(other, subject),
        invertOperation(other),
      );
      const found = indexOfOperation(operations, conjugate, tolerance);
      if (found !== -1 && classes[found] === -1) classes[found] = current;
    }
  }
  return classes;
}
