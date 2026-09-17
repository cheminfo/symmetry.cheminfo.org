import { pointGroupById } from '../../data/pointGroups.ts';
import type { PointOperation } from '../operations.ts';
import { canonicalSense } from '../operations.ts';
import type { Vec3 } from '../point/vec3.ts';
import { dotProduct, sameAxis } from '../point/vec3.ts';

import type { AxisFinding } from './inventory.ts';

/**
 * How small `û · v̂` has to be for two axes to count as perpendicular.
 *
 * Not machine zero: an axis found at a distance tolerance is off by a few parts
 * in 10⁵, and at `1e-6` the three `C₂` of a `D₃` stop being perpendicular to its
 * `C₃` and the molecule is assigned `C₃`.
 */
const PERPENDICULAR = 1e-3;

/** What a group holds, read off its operations rather than off the geometry. */
export interface SymmetryInventory {
  readonly linear: boolean;
  readonly inversion: boolean;
  /** One entry per axis, carrying the highest-order rotation on it. */
  readonly properAxes: readonly AxisFinding[];
  /** One entry per improper axis, carrying the highest-order `Sₙ` on it. */
  readonly improperAxes: readonly AxisFinding[];
  /** The unit normals of the mirror planes. */
  readonly planes: readonly Vec3[];
  readonly order: number;
}

/** The axes, planes and inversion a set of operations holds. */
export function inventoryOf(
  operations: readonly PointOperation[],
): SymmetryInventory {
  const proper: AxisFinding[] = [];
  const improper: AxisFinding[] = [];
  const planes: Vec3[] = [];
  let inversion = false;
  for (const operation of operations) {
    if (operation.kind === 'i') inversion = true;
    if (operation.axis === null) continue;
    const axis = canonicalSense(operation.axis);
    if (operation.kind === 'sigma') {
      if (!planes.some((normal) => sameAxis(normal, axis))) planes.push(axis);
      continue;
    }
    // Compared with a tolerance, never on a rounded key: C₃ and C₃² come out of
    // a closure with axes that agree to 1e-9 and round to two different strings,
    // and two axes of order three is the test that sends a D₃ to the cubic branch.
    const table = operation.kind === 'Cn' ? proper : improper;
    const known = table.find((entry) => sameAxis(entry.axis, axis));
    if (known === undefined) {
      table.push({ axis, order: operation.order });
    } else if (known.order < operation.order) {
      table[table.indexOf(known)] = {
        axis: known.axis,
        order: operation.order,
      };
    }
  }
  return {
    linear: false,
    inversion,
    properAxes: proper,
    improperAxes: improper,
    planes,
    order: operations.length,
  };
}

/**
 * The group an inventory names, walking the standard assignment tree.
 *
 * Where several axes share the highest order — the three `C₂` of a `D₂d`, say —
 * each is tried as the principal one and the answer whose order matches the
 * number of operations wins. Taking the first would call allene `D₂`.
 */
export function assignGroup(inventory: SymmetryInventory): {
  readonly group: string;
  readonly principal: Vec3 | null;
} {
  if (inventory.linear) {
    return { group: inventory.inversion ? 'Dinfh' : 'Cinfv', principal: null };
  }
  const cubic = assignHighSymmetry(inventory);
  if (cubic !== null) return { group: cubic, principal: null };
  if (inventory.properAxes.length === 0) {
    if (inventory.planes.length > 0) return { group: 'Cs', principal: null };
    return { group: inventory.inversion ? 'Ci' : 'C1', principal: null };
  }
  let highest = 0;
  for (const axis of inventory.properAxes) {
    if (axis.order > highest) highest = axis.order;
  }
  let fallback: { group: string; principal: Vec3 } | null = null;
  for (const candidate of inventory.properAxes) {
    if (candidate.order !== highest) continue;
    const group = assignAxial(inventory, candidate);
    const answer = { group, principal: candidate.axis };
    if (orderOf(group) === inventory.order) return answer;
    fallback ??= answer;
  }
  return fallback ?? { group: 'C1', principal: null };
}

/** The cubic and icosahedral branch: two or more axes of order above two. */
function assignHighSymmetry(inventory: SymmetryInventory): string | null {
  let high = 0;
  let fiveFold = 0;
  let fourFold = 0;
  for (const axis of inventory.properAxes) {
    if (axis.order > 2) high++;
    if (axis.order === 5) fiveFold++;
    if (axis.order === 4) fourFold++;
  }
  if (high < 2) return null;
  if (fiveFold === 6) return inventory.inversion ? 'Ih' : 'I';
  if (fourFold === 3) return inventory.inversion ? 'Oh' : 'O';
  if (inventory.planes.length === 0) return 'T';
  return inventory.inversion ? 'Th' : 'Td';
}

/** The `C` and `D` branches, once a principal axis has been chosen. */
function assignAxial(
  inventory: SymmetryInventory,
  principal: AxisFinding,
): string {
  const n = principal.order;
  let perpendicular = 0;
  for (const axis of inventory.properAxes) {
    if (axis.order !== 2) continue;
    if (Math.abs(dotProduct(axis.axis, principal.axis)) < PERPENDICULAR) {
      perpendicular++;
    }
  }
  let horizontal = false;
  let vertical = 0;
  for (const normal of inventory.planes) {
    if (sameAxis(normal, principal.axis)) {
      horizontal = true;
      continue;
    }
    if (Math.abs(dotProduct(normal, principal.axis)) < PERPENDICULAR) {
      vertical++;
    }
  }
  if (perpendicular === n) {
    if (horizontal) return `D${n}h`;
    return vertical === n ? `D${n}d` : `D${n}`;
  }
  if (horizontal) return n === 1 ? 'Cs' : `C${n}h`;
  if (vertical === n) return `C${n}v`;
  for (const axis of inventory.improperAxes) {
    if (sameAxis(axis.axis, principal.axis) && axis.order === 2 * n) {
      return `S${2 * n}`;
    }
  }
  return `C${n}`;
}

/** |G| of a named group, or 0 when the catalogue does not hold it. */
function orderOf(group: string): number {
  try {
    return pointGroupById(group).order;
  } catch {
    return 0;
  }
}
