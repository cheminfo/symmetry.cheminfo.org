import type { PointGroup } from '../../data/pointGroups.ts';
import type { PointOperation } from '../operations.ts';
import { relabelOperation } from '../operations.ts';

import { axisLetter } from './direction.ts';
import type { Vec3 } from './vec3.ts';
import { dotProduct, sameAxis } from './vec3.ts';

/** Two axes count as perpendicular below this `|û · v̂|`. */
const PERPENDICULAR = 1e-3;

const Z_AXIS: Vec3 = [0, 0, 1];

/**
 * The same operations, with every mirror named for where it sits: σ_h is
 * perpendicular to the principal axis, σ_v holds it and a perpendicular `C₂`,
 * σ_d holds it and bisects two of them.
 *
 * With no principal axis — the cubic and icosahedral groups — a plane keeps the
 * bare `σ`, because which of theirs is called σ_h is a property of the setting
 * and not of the operation. For the same reason every vertical plane of a `D_nh`
 * with even n comes back as σ_v: its planes all hold a perpendicular `C₂`, and
 * which half is called σ_d follows from which axes are called `C₂′` — a choice
 * of setting that also swaps `B₁` and `B₂` in the character table. The class
 * labels of the catalogue carry that convention; an operation cannot.
 */
export function labelOperations(
  operations: readonly PointOperation[],
  principal: Vec3 | null,
): readonly PointOperation[] {
  if (principal === null) return operations;
  const perpendicular: Vec3[] = [];
  for (const operation of operations) {
    if (operation.kind !== 'Cn' || operation.order !== 2) continue;
    const axis = operation.axis as Vec3;
    if (Math.abs(dotProduct(axis, principal)) < PERPENDICULAR) {
      perpendicular.push(axis);
    }
  }
  const out: PointOperation[] = [];
  for (const operation of operations) {
    if (operation.kind !== 'sigma') {
      out.push(operation);
      continue;
    }
    const normal = operation.axis as Vec3;
    if (sameAxis(normal, principal)) {
      out.push(relabelOperation(operation, 'σh'));
      continue;
    }
    const holdsC2 = perpendicular.some(
      (axis) => Math.abs(dotProduct(axis, normal)) < PERPENDICULAR,
    );
    out.push(
      relabelOperation(
        operation,
        perpendicular.length === 0 || holdsC2 ? 'σv' : 'σd',
      ),
    );
  }
  return out;
}

/** **z**, unless the group has no single principal axis. */
export function principalAxisOf(group: PointGroup): Vec3 | null {
  return group.family === 'cubic' ||
    group.family === 'icosahedral' ||
    group.id === 'C1' ||
    group.id === 'Ci'
    ? null
    : Z_AXIS;
}

/**
 * Where an operation acts: the plane it reflects in, or the axis it turns
 * about.
 *
 * It is what a listing sorts its classes on, so `σv(xz)` comes before `σv(yz)`
 * whatever the closure happened to produce first. It is not a name — a name
 * comes from the class, in `operationDisplayNames`, and never from a Cartesian
 * vector.
 * @param operation - Any operation.
 * @returns `xz`, `y`, `⊥[1 1 0]`, or `centre` for one with no axis.
 */
export function operationSituation(operation: PointOperation): string {
  const axis = operation.axis;
  if (axis === null) return 'centre';
  const letter = axisLetter(axis);
  if (operation.kind !== 'sigma') return letter;
  if (letter === 'x') return 'yz';
  if (letter === 'y') return 'xz';
  if (letter === 'z') return 'xy';
  return `⊥${letter}`;
}

export { axisLetter } from './direction.ts';
