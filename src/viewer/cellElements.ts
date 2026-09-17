/**
 * Where in the cell each element is drawn.
 *
 * `symmetryElements` reports one element per coset, located wherever the
 * Wondratschek split puts it, and that place is often a poor one to draw: the
 * m ⟂ (110) of a cubic group comes back through the origin, where it touches
 * the cell along one edge and nothing else. The plane a crystallographer draws
 * is the same element one lattice translation over — the diagonal that cuts the
 * cell in half — and moving a drawing by a lattice translation changes nothing
 * about which element it is.
 *
 * So every element is offered the cells around this one, and drawn in the one
 * where it meets the cell most. Three of the nine mirror planes of `Pm-3m` are
 * invisible without this.
 */

import type { Lattice, SymmetryElement } from '../symmetry/core/index.ts';
import {
  crossProduct,
  subtractVectors,
  vectorNorm,
} from '../symmetry/point/vec3.ts';

import { cellSection, clipLineToCell } from './cellClip.ts';
import { elementLocus } from './crystalDrawing.ts';
import type { Point3 } from './types.ts';

/** A whole-cell shift, in cells along a, b and c. */
export type CellShift = readonly [number, number, number];

/** Drawn where it is, when no neighbouring cell suits it better. */
export const NO_SHIFT: CellShift = [0, 0, 0];

/**
 * The cell to draw this element in.
 *
 * @param element - What `symmetryElements` returned.
 * @param lattice - The cell it lives in.
 * @returns The shift, in cells along a, b and c. It is `[0, 0, 0]` unless a
 *   neighbouring cell holds strictly more of the element than this one does.
 */
export function cellShiftFor(
  element: SymmetryElement,
  lattice: Lattice,
): CellShift {
  if (elementLocus(element, lattice) === null) return NO_SHIFT;
  let best = NO_SHIFT;
  let most = 0;
  for (const shift of NEIGHBOURS) {
    const reach = cellReach(element, lattice, shift);
    if (reach > most * (1 + PREFER_HERE)) {
      most = reach;
      best = shift;
    }
  }
  return best;
}

/**
 * The same, for a whole cell at once.
 *
 * @param elements - Every element of the cell.
 * @param lattice - The cell they live in.
 * @returns The shift of each, keyed by `elementKey`.
 */
export function cellShifts(
  elements: readonly SymmetryElement[],
  lattice: Lattice,
  keyOf: (element: SymmetryElement) => string,
): Map<string, CellShift> {
  const shifts = new Map<string, CellShift>();
  for (const element of elements) {
    shifts.set(keyOf(element), cellShiftFor(element, lattice));
  }
  return shifts;
}

/**
 * How much of the element lies in the cell: the area of the face a plane cuts
 * out of it, the length of the rod an axis is cut down to, and for a point
 * whether it is in the cell at all.
 */
function cellReach(
  element: SymmetryElement,
  lattice: Lattice,
  shift: CellShift,
): number {
  const locus = elementLocus(element, lattice, shift);
  if (locus === null) return 0;
  if (locus.normal !== undefined) {
    return faceArea(cellSection(lattice, locus.point, locus.normal));
  }
  if (locus.direction !== undefined) {
    const segment = clipLineToCell(lattice, locus.point, locus.direction);
    if (segment === null) return 0;
    return vectorNorm(subtractVectors(segment.end, segment.start));
  }
  return insideCell(lattice, locus.point) ? 1 : 0;
}

/** The area of a convex polygon, as the fan of triangles it is drawn as. */
function faceArea(corners: readonly Point3[]): number {
  const first = corners[0];
  if (first === undefined) return 0;
  let area = 0;
  for (let index = 1; index + 1 < corners.length; index++) {
    const second = corners[index];
    const third = corners[index + 1];
    if (second === undefined || third === undefined) continue;
    area +=
      vectorNorm(
        crossProduct(
          subtractVectors(second, first),
          subtractVectors(third, first),
        ),
      ) / 2;
  }
  return area;
}

/** Whether a Cartesian point is in the cell, within a fraction of a cell edge. */
function insideCell(lattice: Lattice, point: Point3): boolean {
  for (let axis = 0; axis < 3; axis++) {
    let fraction = 0;
    for (let index = 0; index < 3; index++) {
      fraction +=
        (lattice.fractional[axis]?.[index] ?? 0) * (point[index] ?? 0);
    }
    if (fraction < -SLACK || fraction > 1 + SLACK) return false;
  }
  return true;
}

/** This cell and the twenty-six around it, nearest first. */
const NEIGHBOURS: readonly CellShift[] = buildNeighbours();

function buildNeighbours(): CellShift[] {
  const shifts: CellShift[] = [];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      for (let k = -1; k <= 1; k++) shifts.push([i, j, k]);
    }
  }
  return shifts.toSorted(
    (left, right) => Math.hypot(...left) - Math.hypot(...right),
  );
}

/**
 * How much better a neighbouring cell has to be before the element moves there.
 * Without it, floating-point noise moves a plane that fits both cells equally.
 */
const PREFER_HERE = 1e-6;

/** How far outside the cell, in cell fractions, a point still counts as in it. */
const SLACK = 1e-9;
