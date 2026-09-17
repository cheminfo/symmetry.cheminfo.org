import type { FlowQuestion, FlowTarget } from '../data/flowchart.ts';
import { FLOW_START, flowQuestion } from '../data/flowchart.ts';
import { pointGroupById } from '../data/pointGroups.ts';

import type { SymmetryInventory } from './detect/assign.ts';
import type { AxisFinding } from './detect/inventory.ts';
import type { Vec3 } from './point/vec3.ts';
import { dotProduct, sameAxis } from './point/vec3.ts';

/** How small `û · v̂` has to be for two axes to count as perpendicular. */
const PERPENDICULAR = 1e-3;

/** What a walk down the tree found, and how it got there. */
export interface FlowWalk {
  /** The `PointGroup.id` the walk arrives at. */
  readonly group: string;
  /** `questionId:yes` or `questionId:no`, in the order they were answered. */
  readonly path: readonly string[];
  /** The axis the `n` of a family was read off, when one was needed. */
  readonly principalAxis: Vec3 | null;
}

/**
 * The tree of `src/data/flowchart.ts`, walked against what a structure holds.
 *
 * This is deliberately a **second** route to the group: the detector assigns
 * directly, this one answers the printed questions one at a time. A page teaches
 * the tree, so the tree has to reach the same answer, and the test that says so
 * is what stops the two drifting apart.
 */
export function walkFlowchart(inventory: SymmetryInventory): FlowWalk {
  const candidates = principalCandidates(inventory);
  let fallback: FlowWalk | null = null;
  for (const principal of candidates) {
    const walk = walkWith(inventory, principal);
    if (orderOf(walk.group) === inventory.order) return walk;
    fallback ??= walk;
  }
  return fallback ?? { group: 'C1', path: [], principalAxis: null };
}

/**
 * The answer to one question, read off the operations.
 *
 * @throws When the question is not one of the tree's.
 */
export function answerQuestion(
  id: string,
  inventory: SymmetryInventory,
  principal: AxisFinding | null,
): boolean {
  switch (id) {
    case 'linear': {
      return inventory.linear;
    }
    case 'linear-i':
    case 'icosa-i':
    case 'octa-i':
    case 'tetra-i':
    case 'lone-i': {
      return inventory.inversion;
    }
    case 'multi-high-axis': {
      return countAxes(inventory, (axis) => axis.order > 2) >= 2;
    }
    case 'has-c5': {
      return countAxes(inventory, (axis) => axis.order === 5) === 6;
    }
    case 'has-c4': {
      return countAxes(inventory, (axis) => axis.order === 4) === 3;
    }
    case 'tetra-mirror':
    case 'lone-mirror': {
      return inventory.planes.length > 0;
    }
    case 'any-axis': {
      return inventory.properAxes.length > 0;
    }
    case 'perp-c2': {
      return (
        principal !== null &&
        perpendicularAxes(inventory, principal) === principal.order
      );
    }
    case 'd-sigma-h':
    case 'c-sigma-h': {
      return (
        principal !== null &&
        inventory.planes.some((normal) => sameAxis(normal, principal.axis))
      );
    }
    case 'd-sigma-d':
    case 'c-sigma-v': {
      return (
        principal !== null &&
        verticalPlanes(inventory, principal) === principal.order
      );
    }
    case 'improper': {
      return (
        principal !== null &&
        inventory.improperAxes.some(
          (axis) =>
            sameAxis(axis.axis, principal.axis) &&
            axis.order === 2 * principal.order,
        )
      );
    }
    default: {
      throw new RangeError(`the flowchart cannot answer ${id}`);
    }
  }
}

/** The tree, walked with one choice of principal axis. */
function walkWith(
  inventory: SymmetryInventory,
  principal: AxisFinding | null,
): FlowWalk {
  const path: string[] = [];
  let target: FlowTarget = { kind: 'question', id: FLOW_START };
  while (target.kind === 'question') {
    const question: FlowQuestion = flowQuestion(target.id);
    const answer = answerQuestion(question.id, inventory, principal);
    path.push(`${question.id}:${answer ? 'yes' : 'no'}`);
    target = answer ? question.yes : question.no;
  }
  return {
    group: resolveTarget(target, principal),
    path,
    principalAxis: principal?.axis ?? null,
  };
}

/** A family plus the n the walk found is a group id. */
function resolveTarget(
  target: FlowTarget,
  principal: AxisFinding | null,
): string {
  if (target.kind === 'group') return target.id;
  if (target.kind === 'question') {
    throw new RangeError(`the walk stopped on the question ${target.id}`);
  }
  const n = principal?.order ?? 1;
  return target.family === 'S2n'
    ? `S${2 * n}`
    : target.family.replace('n', String(n));
}

/** The axes that could be the principal one: those of the highest order. */
function principalCandidates(
  inventory: SymmetryInventory,
): ReadonlyArray<AxisFinding | null> {
  if (inventory.properAxes.length === 0) return [null];
  let highest = 0;
  for (const axis of inventory.properAxes) {
    if (axis.order > highest) highest = axis.order;
  }
  return inventory.properAxes.filter((axis) => axis.order === highest);
}

/** How many two-fold axes are perpendicular to the principal one. */
function perpendicularAxes(
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

/** How many planes hold the principal axis. */
function verticalPlanes(
  inventory: SymmetryInventory,
  principal: AxisFinding,
): number {
  let count = 0;
  for (const normal of inventory.planes) {
    if (Math.abs(dotProduct(normal, principal.axis)) < PERPENDICULAR) count++;
  }
  return count;
}

/** How many axes satisfy a test. */
function countAxes(
  inventory: SymmetryInventory,
  test: (axis: AxisFinding) => boolean,
): number {
  let count = 0;
  for (const axis of inventory.properAxes) {
    if (test(axis)) count++;
  }
  return count;
}

/** |G| of a named group, or 0 when the catalogue does not hold it. */
function orderOf(group: string): number {
  try {
    return pointGroupById(group).order;
  } catch {
    return 0;
  }
}
