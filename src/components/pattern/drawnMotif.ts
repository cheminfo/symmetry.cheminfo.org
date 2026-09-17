/**
 * The motif a student draws, carried by the link.
 *
 * A drawing kept in component state alone is lost on reload and cannot be
 * handed out, which is exactly what a teacher wants to do with it. So the
 * polygon goes into `?motif=` itself: `d:` and then two digits of hundredths
 * per coordinate, which fits fifteen vertices inside the sixty-four characters
 * the share codec allows and needs no escaping.
 */

import type { Motif } from '../plane/index.ts';
import { motifById } from '../plane/index.ts';

/** What the id of a drawn motif starts with. */
export const DRAWN_PREFIX = 'd:';

/** How many vertices fit in the characters a link may carry. */
export const MAX_DRAWN_POINTS = 15;

/** The fewest vertices that enclose an area. */
export const MIN_DRAWN_POINTS = 3;

/** One vertex, in fractional cell coordinates, y-up. */
export type DrawnPoint = readonly [number, number];

/**
 * The motif an id names: the polygon it encodes, or one of the shipped ones.
 * @param id - What `?motif=` carried, or `null`.
 * @returns A motif, always. A drawing of fewer than three corners encloses no
 *   area, so it draws nothing rather than silently becoming a shipped motif
 *   while the student is still placing corners.
 */
export function motifFor(id: string | null): Motif {
  const points = decodeDrawnMotif(id);
  return points === null ? motifById(id) : drawnMotif(points);
}

/** Whether an id names a drawing rather than one of the shipped motifs. */
export function isDrawnMotifId(id: string | null | undefined): boolean {
  return typeof id === 'string' && id.startsWith(DRAWN_PREFIX);
}

/**
 * The polygon an id encodes.
 * @param id - What `?motif=` carried, or `null`.
 * @returns Its vertices, or `null` when the id names no drawing at all. A link
 *   cut short mid-vertex keeps the vertices it did carry, and a drawing still
 *   being placed comes back with the corners it has.
 */
export function decodeDrawnMotif(
  id: string | null | undefined,
): DrawnPoint[] | null {
  if (id === null || id === undefined || !isDrawnMotifId(id)) return null;
  const digits = id.slice(DRAWN_PREFIX.length).replaceAll(/\D/g, '');
  const count = Math.min(Math.floor(digits.length / 4), MAX_DRAWN_POINTS);
  const points: DrawnPoint[] = [];
  for (let index = 0; index < count; index++) {
    points.push([
      Number(digits.slice(index * 4, index * 4 + 2)) / 100,
      Number(digits.slice(index * 4 + 2, index * 4 + 4)) / 100,
    ]);
  }
  return points;
}

/**
 * The id a polygon takes in the address.
 * @param points - Vertices in fractional cell coordinates; beyond fifteen they
 *   are dropped, because the link cannot carry them.
 * @returns The id, `d:` followed by four digits per vertex.
 */
export function encodeDrawnMotif(points: readonly DrawnPoint[]): string {
  let digits = '';
  for (
    let index = 0;
    index < points.length && index < MAX_DRAWN_POINTS;
    index++
  ) {
    const point = points[index] as DrawnPoint;
    digits += `${hundredths(point[0])}${hundredths(point[1])}`;
  }
  return `${DRAWN_PREFIX}${digits}`;
}

/**
 * A drawn polygon, as the tiling repeats it.
 *
 * One filled path and no accent: a copy reached by a reflection swaps the two
 * colours, so a single-coloured drawing still shows its handedness. Fewer than
 * three corners enclose nothing, and draw nothing.
 * @param points - Its vertices.
 * @returns The motif.
 */
export function drawnMotif(points: readonly DrawnPoint[]): Motif {
  const corners = points.map((point) => `${point[0]},${point[1]}`);
  return {
    id: encodeDrawnMotif(points),
    name: 'Your drawing',
    description: 'The polygon you drew, repeated by the group.',
    paths:
      points.length < MIN_DRAWN_POINTS
        ? []
        : [{ d: `M ${corners.join(' L ')} Z` }],
    domain: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
  };
}

/** Two digits of hundredths, kept inside the cell. */
function hundredths(value: number): string {
  const clamped = Math.min(99, Math.max(0, Math.round(value * 100)));
  return String(clamped).padStart(2, '0');
}
