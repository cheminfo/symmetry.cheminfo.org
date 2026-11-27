/**
 * The counts a point group is assigned on: two-fold axes perpendicular to the
 * principal one, planes holding it, axes of a given order. The assigner, the
 * flowchart and the evidence a student reads all decide on these, so they
 * count the same way.
 */

import { dotProduct } from 'react-cheminfo/crystal3d';

import { pointGroupById } from '../../data/pointGroups.ts';

import type { SymmetryInventory } from './assign.ts';
import type { AxisFinding } from './inventory.ts';

/**
 * How small `û · v̂` has to be for two axes to count as perpendicular.
 *
 * Not machine zero: an axis found at a distance tolerance is off by a few parts
 * in 10⁵, and at `1e-6` the three `C₂` of a `D₃` stop being perpendicular to its
 * `C₃` and the molecule is assigned `C₃`.
 */
export const PERPENDICULAR = 1e-3;

/**
 * How many two-fold axes are perpendicular to the principal one.
 * @param inventory - What the group holds.
 * @param principal - The principal axis.
 * @returns The count.
 */
export function perpendicularTwofolds(
  inventory: SymmetryInventory,
  principal: AxisFinding,
): number {
  let count = 0;
  for (const axis of inventory.properAxes) {
    if (axis.order !== 2) continue;
    if (Math.abs(dotProduct(axis.axis, principal.axis)) < PERPENDICULAR) {
      count++;
    }
  }
  return count;
}

/**
 * How many planes hold the principal axis.
 * @param inventory - What the group holds.
 * @param principal - The principal axis.
 * @returns The count.
 */
export function verticalPlanes(
  inventory: SymmetryInventory,
  principal: AxisFinding,
): number {
  let count = 0;
  for (const normal of inventory.planes) {
    if (Math.abs(dotProduct(normal, principal.axis)) < PERPENDICULAR) count++;
  }
  return count;
}

/**
 * How many axes satisfy a test.
 * @param inventory - What the group holds.
 * @param test - Whether an axis counts.
 * @returns The count.
 */
export function countAxes(
  inventory: SymmetryInventory,
  test: (axis: AxisFinding) => boolean,
): number {
  let count = 0;
  for (const axis of inventory.properAxes) {
    if (test(axis)) count++;
  }
  return count;
}

/**
 * The highest order of a proper axis.
 * @param inventory - What the group holds.
 * @returns The order, or 0 when there is no proper axis.
 */
export function highestOrder(inventory: SymmetryInventory): number {
  let highest = 0;
  for (const axis of inventory.properAxes) {
    if (axis.order > highest) highest = axis.order;
  }
  return highest;
}

/**
 * |G| of a named group.
 * @param group - The `PointGroup.id`.
 * @returns Its order, or 0 when the catalogue does not hold it.
 */
export function groupOrder(group: string): number {
  try {
    return pointGroupById(group).order;
  } catch {
    return 0;
  }
}
