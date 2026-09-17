/**
 * What the molecule answers at each question of the assignment tree, and the
 * count it answers with.
 *
 * A student told "yes" has learned nothing; a student told "4 axes above
 * two-fold" can go and count them on the screen. So every step of the walk
 * carries the number it was decided on, and the questions that compare a count
 * against n name the principal axis rather than the number, because reading n
 * off `the principal C₆` is the comparison the question is asking for.
 */

import type { AxisFinding, SymmetryInventory } from '../../symmetry/detect.ts';
import { dotProduct, sameAxis } from '../../symmetry/point/vec3.ts';

/** How small `û · v̂` has to be for two axes to count as perpendicular. */
const PERPENDICULAR = 1e-3;

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';

/** Said when a question needs a principal axis and the walk found none. */
const NO_PRINCIPAL = 'There is no principal axis to measure against.';

/**
 * The one clause a question is answered with.
 *
 * @param id - The question, one of the assignment tree's.
 * @param inventory - What the molecule holds.
 * @param principal - The axis the walk read `n` off, when it needed one.
 * @returns The evidence, ending in a full stop, or an empty string for a
 *   question this module does not count for.
 */
export function questionEvidence(
  id: string,
  inventory: SymmetryInventory,
  principal: AxisFinding | null,
): string {
  switch (id) {
    case 'linear': {
      return inventory.linear
        ? 'Every atom lies on one line.'
        : 'The atoms do not lie on one line.';
    }
    case 'linear-i':
    case 'icosa-i':
    case 'octa-i':
    case 'tetra-i':
    case 'lone-i': {
      return inventory.inversion
        ? 'There is a centre of inversion.'
        : 'There is no centre of inversion.';
    }
    case 'multi-high-axis': {
      return `${count(
        axesWhere(inventory, (axis) => axis.order > 2),
        'axis above two-fold',
        'axes above two-fold',
      )}.`;
    }
    case 'has-c5': {
      return `${count(
        axesWhere(inventory, (axis) => axis.order === 5),
        `${symbol('C', 5)} axis`,
        `${symbol('C', 5)} axes`,
      )}.`;
    }
    case 'has-c4': {
      return `${count(
        axesWhere(inventory, (axis) => axis.order === 4),
        `${symbol('C', 4)} axis`,
        `${symbol('C', 4)} axes`,
      )}.`;
    }
    case 'tetra-mirror':
    case 'lone-mirror': {
      return `${count(inventory.planes.length, 'mirror plane', 'mirror planes')}.`;
    }
    case 'any-axis': {
      if (inventory.properAxes.length === 0) {
        return 'There is no proper rotation axis.';
      }
      const clause = count(
        inventory.properAxes.length,
        'proper axis',
        'proper axes',
      );
      return `${clause}, the highest ${symbol('C', highestOrder(inventory))}.`;
    }
    case 'perp-c2': {
      if (principal === null) return NO_PRINCIPAL;
      const against = `perpendicular to the ${name(principal)}`;
      return `${count(
        perpendicularAxes(inventory, principal),
        `${symbol('C', 2)} axis ${against}`,
        `${symbol('C', 2)} axes ${against}`,
      )}.`;
    }
    case 'd-sigma-h':
    case 'c-sigma-h': {
      if (principal === null) return NO_PRINCIPAL;
      const horizontal = inventory.planes.some((normal) =>
        sameAxis(normal, principal.axis),
      );
      return horizontal
        ? `One plane is perpendicular to the ${name(principal)}.`
        : `No plane is perpendicular to the ${name(principal)}.`;
    }
    case 'd-sigma-d':
    case 'c-sigma-v': {
      if (principal === null) return NO_PRINCIPAL;
      const holding = `holding the ${name(principal)}`;
      return `${count(
        verticalPlanes(inventory, principal),
        `plane ${holding}`,
        `planes ${holding}`,
      )}.`;
    }
    case 'improper': {
      if (principal === null) return NO_PRINCIPAL;
      const improper = symbol('S', 2 * principal.order);
      const found = inventory.improperAxes.some(
        (axis) =>
          sameAxis(axis.axis, principal.axis) &&
          axis.order === 2 * principal.order,
      );
      return found
        ? `There is an ${improper} along the ${name(principal)}.`
        : `There is no ${improper} along the ${name(principal)}.`;
    }
    default: {
      return '';
    }
  }
}

/** `C₂`, `S₄`, `S₁₀`: the symbol with its order set below. */
export function symbol(letter: string, order: number): string {
  let digits = '';
  for (const character of String(order)) {
    digits += SUBSCRIPTS[Number(character)] ?? character;
  }
  return `${letter}${digits}`;
}

/** `There are 3 mirror planes`, and `There is no mirror plane` at zero. */
function count(total: number, one: string, many: string): string {
  if (total === 0) return `There is no ${one}`;
  if (total === 1) return `There is 1 ${one}`;
  return `There are ${total} ${many}`;
}

/**
 * The principal axis, named so its order is readable in the sentence. A
 * question that asks for *n* of something is answered by comparing the count
 * against the n in `the principal C₆`, which is the comparison to be taught.
 */
function name(principal: AxisFinding): string {
  return `principal ${symbol('C', principal.order)}`;
}

function highestOrder(inventory: SymmetryInventory): number {
  let highest = 0;
  for (const axis of inventory.properAxes) {
    if (axis.order > highest) highest = axis.order;
  }
  return highest;
}

function axesWhere(
  inventory: SymmetryInventory,
  test: (axis: AxisFinding) => boolean,
): number {
  let total = 0;
  for (const axis of inventory.properAxes) {
    if (test(axis)) total++;
  }
  return total;
}

function perpendicularAxes(
  inventory: SymmetryInventory,
  principal: AxisFinding,
): number {
  let total = 0;
  for (const axis of inventory.properAxes) {
    if (axis.order !== 2) continue;
    if (Math.abs(dotProduct(axis.axis, principal.axis)) < PERPENDICULAR) {
      total++;
    }
  }
  return total;
}

function verticalPlanes(
  inventory: SymmetryInventory,
  principal: AxisFinding,
): number {
  let total = 0;
  for (const normal of inventory.planes) {
    if (Math.abs(dotProduct(normal, principal.axis)) < PERPENDICULAR) total++;
  }
  return total;
}
