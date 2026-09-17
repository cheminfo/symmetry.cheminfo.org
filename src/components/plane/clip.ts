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
  const edges: Array<readonly [number, number]> = [
    [originU, directionU],
    [cells - originU, -directionU],
    [originV, directionV],
    [cells - originV, -directionV],
  ];
  for (const edge of edges) {
    const [distance, rate] = edge;
    if (rate === 0) {
      if (distance < -TOLERANCE) return null;
      continue;
    }
    const bound = -distance / rate;
    if (rate > 0) low = Math.max(low, bound);
    else high = Math.min(high, bound);
  }
  if (!(high - low > TOLERANCE)) return null;
  const first: [number, number] = [
    originU + low * directionU,
    originV + low * directionV,
  ];
  const second: [number, number] = [
    originU + high * directionU,
    originV + high * directionV,
  ];
  // Both ends of a line are the same line, so fix the order rather than let the
  // sign of the direction vector decide it and make the tests unreadable.
  const forward =
    first[0] < second[0] - TOLERANCE ||
    (Math.abs(first[0] - second[0]) <= TOLERANCE && first[1] <= second[1]);
  return forward
    ? [first[0], first[1], second[0], second[1]]
    : [second[0], second[1], first[0], first[1]];
}
