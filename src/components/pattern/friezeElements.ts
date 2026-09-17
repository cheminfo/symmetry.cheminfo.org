/**
 * The symmetry elements of a frieze group, clipped to the strip it is drawn on.
 *
 * Everything here is geometry over the element table the plane-group layer
 * computes; nothing is transcribed. A line is clipped to the whole strip rather
 * than to one period, because a diagram whose mirrors stop at the period edge
 * teaches that they stop there.
 */

import type { Lattice } from '../../symmetry/core/index.ts';
import type {
  PlaneElementTable,
  PlaneLine,
} from '../../symmetry/planeElements.ts';
import type { DiagramGlyph, DiagramLine } from '../plane/index.ts';
import { cellBasis, rotationGlyphPath } from '../plane/index.ts';

import type { StripPoint } from './friezeFrame.ts';
import { STRIP_REACH, stripPoint } from './friezeFrame.ts';

/** How far a fractional coordinate may sit outside the strip and still be in it. */
const TOLERANCE = 1e-9;

/**
 * Every mirror and glide of the table, clipped to the strip.
 * @param table - From `planeElementTable(operations, friezeElementShifts(n))`.
 * @param lattice - The same lattice the frame was built from.
 * @param periods - How many periods the strip spans.
 * @returns The segments, in the y-up Cartesian frame.
 */
export function friezeLines(
  table: PlaneElementTable,
  lattice: Lattice,
  periods: number,
): DiagramLine[] {
  const basis = cellBasis(lattice);
  const lines: DiagramLine[] = [];
  for (const line of table.lines) {
    const segment = clipToStrip(line, periods);
    if (segment === null) continue;
    const [first, second] = segment;
    const [x1, y1] = stripPoint(basis, first);
    const [x2, y2] = stripPoint(basis, second);
    lines.push({
      key: `${line.symbol}@${line.normal.join(',')}=${line.offset}`,
      kind: line.kind,
      symbol: line.symbol,
      x1,
      y1,
      x2,
      y2,
    });
  }
  return lines;
}

/**
 * Every rotation centre of the table that falls on the strip, as a glyph path.
 * @param table - From `planeElementTable(operations, friezeElementShifts(n))`.
 * @param lattice - The same lattice the frame was built from.
 * @param periods - How many periods the strip spans.
 * @returns The glyphs, in the y-up Cartesian frame.
 */
export function friezeGlyphs(
  table: PlaneElementTable,
  lattice: Lattice,
  periods: number,
): DiagramGlyph[] {
  const basis = cellBasis(lattice);
  const scale = Math.hypot(basis[0], basis[2]);
  const glyphs: DiagramGlyph[] = [];
  for (const rotation of table.rotations) {
    const [u, v] = rotation.point;
    if (!inside(u, 0, periods) || !inside(v, -STRIP_REACH, STRIP_REACH)) {
      continue;
    }
    const [x, y] = stripPoint(basis, [u, v]);
    glyphs.push({
      key: `${rotation.order}@${u},${v}`,
      order: rotation.order,
      x,
      y,
      path: rotationGlyphPath(rotation.order, x, y, scale),
    });
  }
  return glyphs;
}

/**
 * The part of `h·u + k·v = offset` that lies on the strip, in fractional
 * coordinates. `null` when the line misses it or only touches a corner.
 */
function clipToStrip(
  line: PlaneLine,
  periods: number,
): [StripPoint, StripPoint] | null {
  const h = line.normal[0] ?? 0;
  const k = line.normal[1] ?? 0;
  const square = h * h + k * k;
  if (square === 0) return null;
  const originU = (h * line.offset) / square;
  const originV = (k * line.offset) / square;
  const directionU = -k;
  const directionV = h;
  let low = Number.NEGATIVE_INFINITY;
  let high = Number.POSITIVE_INFINITY;
  // Each edge as `distance + rate · t ≥ 0`, so the segment is the interval on
  // which all four hold.
  const edges: Array<readonly [number, number]> = [
    [originU, directionU],
    [periods - originU, -directionU],
    [originV + STRIP_REACH, directionV],
    [STRIP_REACH - originV, -directionV],
  ];
  for (const [distance, rate] of edges) {
    if (rate === 0) {
      if (distance < -TOLERANCE) return null;
      continue;
    }
    const bound = -distance / rate;
    if (rate > 0) low = Math.max(low, bound);
    else high = Math.min(high, bound);
  }
  if (!(high - low > TOLERANCE)) return null;
  return [
    [originU + low * directionU, originV + low * directionV],
    [originU + high * directionU, originV + high * directionV],
  ];
}

function inside(value: number, low: number, high: number): boolean {
  return value >= low - TOLERANCE && value <= high + TOLERANCE;
}
