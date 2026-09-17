/**
 * The symmetry elements of one plane group, listed once each.
 *
 * `rotationsInCell` and `linesInCell` give what a **diagram** draws: the closed
 * cell, so a glyph appears at all four corners and a mirror is drawn on both
 * edges it runs along. A **list** wants the other thing — one entry per element
 * — because a reader counts it. Untouched, p2 reads as nine two-fold centres
 * where it has four, and p4g as five four-folds where it has two.
 *
 * Two elements are the same when a lattice translation carries one onto the
 * other, which for a point is its coordinates modulo 1 and for a line is its
 * offset modulo 1: the normal `(hk)` is primitive, so `h·u + k·v` runs over
 * every integer as `(u, v)` runs over the lattice.
 */

import type {
  PlaneElementTable,
  PlaneLine,
  PlaneRotationPoint,
} from '../../symmetry/planeElements.ts';
import {
  formatPlaneElement,
  linesInCell,
  rotationsInCell,
} from '../../symmetry/planeElements.ts';

/** How close to a lattice point a coordinate has to be to be one. */
const TOLERANCE = 1e-6;

/**
 * Every element of one cell, written out, rotations before lines.
 * @param table - From `planeElementTable` over two or more cells of shifts.
 * @returns One string per element, in the order the table lists them.
 */
export function cellElementLabels(table: PlaneElementTable): readonly string[] {
  return [
    ...cellRotations(table).map(formatPlaneElement),
    ...cellLines(table).map(formatPlaneElement),
  ];
}

/**
 * The rotation centres of one cell, one per lattice orbit.
 * @param table - The element table.
 * @returns The centres, the representative nearest the origin kept.
 */
export function cellRotations(
  table: PlaneElementTable,
): readonly PlaneRotationPoint[] {
  const seen = new Set<string>();
  const kept: PlaneRotationPoint[] = [];
  for (const rotation of rotationsInCell(table)) {
    const key = `${rotation.order}|${modKey(rotation.point[0])}|${modKey(rotation.point[1])}`;
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(rotation);
  }
  return kept;
}

/**
 * The mirror and glide lines of one cell, one per lattice orbit.
 * @param table - The element table.
 * @returns The lines, the representative nearest the origin kept.
 */
export function cellLines(table: PlaneElementTable): readonly PlaneLine[] {
  const seen = new Set<string>();
  const kept: PlaneLine[] = [];
  for (const line of linesInCell(table)) {
    const key = [
      line.symbol,
      line.normal.join(','),
      modKey(line.offset),
      line.glide.join(','),
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(line);
  }
  return kept;
}

/** A coordinate reduced into `[0, 1)`, as a string that compares exactly. */
function modKey(value: number): string {
  const reduced = ((value % 1) + 1) % 1;
  return (reduced > 1 - TOLERANCE ? 0 : reduced).toFixed(6);
}

/** What each rotation glyph is, by the order it stands for. */
const GLYPHS: Record<number, string> = {
  2: 'a lens is a two-fold',
  3: 'a triangle a three-fold',
  4: 'a square a four-fold',
  6: 'a hexagon a six-fold',
};

/**
 * The legend of one diagram, naming only the glyphs it actually draws.
 *
 * A fixed legend listing six shapes under a picture holding two is noise, and
 * it invites the reader to look for the four that are not there.
 * @param table - The element table the diagram is drawn from.
 * @returns The clauses, joined; the empty string when nothing is drawn.
 */
export function elementLegend(table: PlaneElementTable): string {
  const orders = new Set(cellRotations(table).map((entry) => entry.order));
  const parts: string[] = [];
  for (const order of [2, 3, 4, 6]) {
    const glyph = GLYPHS[order];
    if (orders.has(order) && glyph !== undefined) parts.push(glyph);
  }
  const lines = cellLines(table);
  if (lines.some((line) => line.kind === 'mirror')) {
    parts.push('a heavy line a mirror');
  }
  if (lines.some((line) => line.kind === 'glide')) {
    parts.push('a dashed one a glide');
  }
  if (parts.length === 0) return '';
  if (parts.length === 1) return `${parts[0]}`;
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}
