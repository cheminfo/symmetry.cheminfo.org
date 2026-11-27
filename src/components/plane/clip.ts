/**
 * Clipping a symmetry-element line to the block of cells being drawn.
 *
 * A diagram whose mirrors stop at the cell edge teaches that they stop there,
 * which is the misconception the picture exists to remove. So the line is
 * clipped to the whole block, in fractional coordinates where the block is the
 * axis-aligned square `[0, cells]²` and the clipping is four comparisons.
 */

import type { PlaneLine } from '../../symmetry/planeElements.ts';

/** How far a fractional coordinate may sit outside the block and still be in it. */
const TOLERANCE = 1e-9;

/** An axis-aligned rectangle, in fractional coordinates. */
export interface ClipRectangle {
  readonly uMin: number;
  readonly uMax: number;
  readonly vMin: number;
  readonly vMax: number;
}

/**
 * The part of the line `h·u + k·v = offset` that lies in the block `[0, cells]²`,
 * in fractional coordinates.
 *
 * @returns `[u1, v1, u2, v2]`, or `null` when the line misses the block or only
 *   touches one of its corners.
 */
export function clipToBlock(
  line: PlaneLine,
  cells: number,
): [number, number, number, number] | null {
  const segment = clipLineToRect(line, {
    uMin: 0,
    uMax: cells,
    vMin: 0,
    vMax: cells,
  });
  if (segment === null) return null;
  const [first, second] = segment;
  // Both ends of a line are the same line, so fix the order rather than let the
  // sign of the direction vector decide it and make the tests unreadable.
  const forward =
    first[0] < second[0] - TOLERANCE ||
    (Math.abs(first[0] - second[0]) <= TOLERANCE && first[1] <= second[1]);
  return forward
    ? [first[0], first[1], second[0], second[1]]
    : [second[0], second[1], first[0], first[1]];
}

/**
 * The part of the line `h·u + k·v = offset` that lies in a rectangle, in
 * fractional coordinates, its two ends in the order the line's direction meets
 * them.
 *
 * @param line - The line, by its normal and offset.
 * @param box - The rectangle it is clipped to.
 * @returns The two ends, or `null` when the line misses the rectangle or only
 *   touches one of its corners.
 */
export function clipLineToRect(
  line: PlaneLine,
  box: ClipRectangle,
): [[number, number], [number, number]] | null {
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
    [originU - box.uMin, directionU],
    [box.uMax - originU, -directionU],
    [originV - box.vMin, directionV],
    [box.vMax - originV, -directionV],
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
