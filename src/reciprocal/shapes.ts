/**
 * The outlines the drawings are cut from, each about its own centre, `y`
 * pointing down.
 *
 * They are chosen for their symmetry, which is the point of drawing them: the
 * F has none at all, the arrow one mirror, and a blade none — so a hub of
 * three blades has a three-fold axis and no mirror, and a hub of four a
 * four-fold axis and no mirror.
 */

import type { Point } from './raster.ts';

/** A capital F, 40 wide and 60 tall: no symmetry at all. */
export const LETTER_F: readonly Point[] = [
  { x: -20, y: -30 },
  { x: 20, y: -30 },
  { x: 20, y: -18 },
  { x: -8, y: -18 },
  { x: -8, y: -6 },
  { x: 12, y: -6 },
  { x: 12, y: 6 },
  { x: -8, y: 6 },
  { x: -8, y: 30 },
  { x: -20, y: 30 },
];

/** An arrow pointing up, 52 wide and 64 tall: one mirror, vertical. */
export const ARROW: readonly Point[] = [
  { x: 0, y: -34 },
  { x: 26, y: -6 },
  { x: 9, y: -6 },
  { x: 9, y: 30 },
  { x: -9, y: 30 },
  { x: -9, y: -6 },
  { x: -26, y: -6 },
];

/**
 * One blade of a propeller, reaching to the right of the hub and swept
 * upwards, so that no line through the hub mirrors it.
 */
export const BLADE: readonly Point[] = [
  { x: 4, y: -6 },
  { x: 44, y: -20 },
  { x: 38, y: 0 },
  { x: 6, y: 6 },
];
