import type { SymmetryInventory } from './detect/assign.ts';
import { assignGroup, inventoryOf } from './detect/assign.ts';
import type { DetectedAtom, DetectionOptions } from './detect/inventory.ts';
import { centreAtoms, isLinear, mapsOnto } from './detect/inventory.ts';
import { closedOperations } from './detect/search.ts';
import type { PointOperation } from './operations.ts';
import { INVERSION_MATRIX } from './point/mat3.ts';
import type { Vec3 } from './point/vec3.ts';
import { labelOperations } from './pointGroups.ts';

export type {
  AxisFinding,
  DetectedAtom,
  DetectionOptions,
} from './detect/inventory.ts';
export type { SymmetryInventory } from './detect/assign.ts';

/**
 * How far an atom may land from the atom it maps onto, at 2 Å from the centre.
 *
 * 0.1 Å is the value a structure from a diffraction experiment needs and is what
 * the tolerance slider starts at. It is deliberately not tiny: a molecule is
 * only ever nearly symmetric, and a tool that reports `C1` for every real
 * structure teaches nothing. What it must never do is report a group without
 * saying at what tolerance, which is why this is a field of the result.
 */
export const DEFAULT_TOLERANCE = 0.1;

/** Everything the detector found, and how sure it is. */
export interface DetectionResult {
  /** The `PointGroup.id`. */
  readonly group: string;
  /** |G|, or `Infinity` for a linear molecule. */
  readonly order: number;
  /** Every operation, empty for a linear molecule. */
  readonly operations: readonly PointOperation[];
  /** The highest-order axis, or `null` when there is none or several. */
  readonly principalAxis: Vec3 | null;
  /** The tolerance the answer holds at. */
  readonly tolerance: number;
  /**
   * Whether every operation of the closure really maps the molecule onto itself.
   * `false` means the tolerance is too loose for this structure, and the group
   * is a guess — say so rather than reporting it.
   */
  readonly closed: boolean;
}

/**
 * The point group of a set of Cartesian coordinates.
 *
 * Operations are looked for about candidate axes read off the atoms, then
 * **closed into a group**, and the assignment is made from the closed set rather
 * than from the search — so an axis the search cannot see, like the `C₃` of an
 * icosahedron through a face, is still there when the group is named.
 *
 * @param positions - Cartesian coordinates in ångström, in any frame.
 * @param elements - One element symbol per position. Two atoms of different
 *   elements are never mapped onto each other, whatever their masses.
 * @param tolerance - See {@link DEFAULT_TOLERANCE}.
 */
export function detectPointGroup(
  positions: readonly Vec3[],
  elements: readonly string[],
  tolerance: number = DEFAULT_TOLERANCE,
): DetectionResult {
  return detectWithOptions(positions, elements, { tolerance });
}

/** {@link detectPointGroup}, with the search limits as well. */
export function detectWithOptions(
  positions: readonly Vec3[],
  elements: readonly string[],
  options: DetectionOptions = {},
): DetectionResult {
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const maxOrder = options.maxOrder ?? 8;
  const atoms = centreAtoms(positions, elements);
  if (isLinear(atoms)) {
    const centric = mapsOnto(atoms, INVERSION_MATRIX, tolerance);
    return {
      group: centric ? 'Dinfh' : 'Cinfv',
      order: Infinity,
      operations: [],
      principalAxis: atoms.length > 1 ? principalOfLine(atoms) : null,
      tolerance,
      closed: true,
    };
  }
  const search = closedOperations(atoms, tolerance, maxOrder);
  const operations = search.operations;
  let closed = search.closed;
  const inventory = inventoryOf(operations);
  const { group, principal } = assignGroup(inventory);
  for (const operation of operations) {
    if (mapsOnto(atoms, operation.matrix, tolerance)) continue;
    closed = false;
    break;
  }
  return {
    group,
    order: operations.length,
    operations: labelOperations(operations, principal),
    principalAxis: principal,
    tolerance,
    closed,
  };
}

/** The inventory of a structure, for the flowchart to be walked against. */
export function inventoryOfAtoms(
  positions: readonly Vec3[],
  elements: readonly string[],
  options: DetectionOptions = {},
): SymmetryInventory {
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const maxOrder = options.maxOrder ?? 8;
  const atoms = centreAtoms(positions, elements);
  const inventory = isLinear(atoms)
    ? inventoryOf([])
    : inventoryOf(closedOperations(atoms, tolerance, maxOrder).operations);
  return {
    ...inventory,
    linear: isLinear(atoms),
    inversion:
      inventory.inversion || mapsOnto(atoms, INVERSION_MATRIX, tolerance),
  };
}

/** The line a linear molecule lies on. */
function principalOfLine(atoms: readonly DetectedAtom[]): Vec3 | null {
  let best: Vec3 | null = null;
  let furthest = 0;
  for (const atom of atoms) {
    const radius = Math.hypot(...atom.position);
    if (radius <= furthest) continue;
    furthest = radius;
    best = atom.position;
  }
  if (best === null || furthest < 1e-9) return null;
  return [best[0] / furthest, best[1] / furthest, best[2] / furthest];
}

/** Re-exported so a caller can test one matrix without naming the group. */
export { centreAtoms, isLinear, mapsOnto } from './detect/inventory.ts';
