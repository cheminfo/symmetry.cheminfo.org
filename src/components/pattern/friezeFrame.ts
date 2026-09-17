/**
 * Where a frieze is drawn: a strip, not a block of cells.
 *
 * A frieze group translates in one direction only, so its picture is `n`
 * periods along **a** and one cell either side of the strip axis — the
 * reflection `x,−y` is what puts the motif below the axis. The wallpaper
 * renderers tile in both directions, which would draw the associated wallpaper
 * group instead and teach a translation the group has not got.
 */

import type { Lattice } from '../../symmetry/core/index.ts';
import { cellBasis, round } from '../plane/index.ts';

/** How far across the strip the picture reaches, in cells either side of the axis. */
export const STRIP_REACH = 1;

/** One point in fractional cell coordinates, y-up. */
export type StripPoint = readonly [number, number];

/** The window a strip is drawn in, and the outline of each period. */
export interface FriezeFrame {
  /** `x y width height`, for a `<g transform="scale(1 -1)">` wrapper. */
  readonly viewBox: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** One outline per period, the one at the origin marked. */
  readonly periods: ReadonlyArray<{
    readonly key: string;
    readonly points: string;
    readonly primary: boolean;
  }>;
}

/**
 * The window that holds a strip of periods.
 * @param lattice - From `patternLattice(planeGroupCell(choice, size))`.
 * @param periods - How many periods along **a**.
 * @param padding - Space left around it, in the lattice's units. @default 0
 * @returns The frame, with the period outlines.
 */
export function friezeFrame(
  lattice: Lattice,
  periods: number,
  padding = 0,
): FriezeFrame {
  const basis = cellBasis(lattice);
  const corners: StripPoint[] = [
    [0, -STRIP_REACH],
    [periods, -STRIP_REACH],
    [periods, STRIP_REACH],
    [0, STRIP_REACH],
  ];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const corner of corners) {
    const [x, y] = stripPoint(basis, corner);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const x = round(minX - padding);
  // The flip sends y to −y, so the window's top edge is at −maxY on screen.
  const y = round(-maxY - padding);
  const width = round(maxX - minX + 2 * padding);
  const height = round(maxY - minY + 2 * padding);
  return {
    viewBox: [x, y, width, height].join(' '),
    x,
    y,
    width,
    height,
    periods: periodOutlines(basis, periods),
  };
}

/**
 * The lattice translations a strip of periods needs: along **a**, and nowhere
 * else.
 * @param periods - How many periods to draw.
 * @returns `[0,0]`, `[1,0]`, … — what `patternCopies` takes as its shifts.
 */
export function friezeShifts(periods: number): StripPoint[] {
  const shifts: StripPoint[] = [];
  for (let index = 0; index < periods; index++) shifts.push([index, 0]);
  return shifts;
}

/**
 * The element table of a frieze group: decomposed over the strip translations
 * alone, so the picture carries no element the group has not got.
 * @param periods - How many periods the diagram spans.
 * @returns Shifts for `planeElementTable`.
 */
export function friezeElementShifts(periods: number): number[][] {
  const shifts: number[][] = [];
  for (let index = 0; index <= 2 * periods; index++) shifts.push([index, 0]);
  return shifts;
}

/**
 * The region a motif was drawn in, as a `<polygon points>` in the picture's own
 * frame.
 * @param domain - Fractional corners, from `motif.domain`.
 * @param lattice - The same lattice the frame was built from.
 * @returns The points attribute.
 */
export function motifDomainPoints(
  domain: ReadonlyArray<readonly [number, number]>,
  lattice: Lattice,
): string {
  const basis = cellBasis(lattice);
  return domain.map((corner) => stripPoint(basis, corner).join(',')).join(' ');
}

/**
 * A fractional point in the y-up Cartesian frame the strip is drawn in.
 * @param basis - **M**, from `cellBasis(lattice)`.
 * @param point - Fractional cell coordinates.
 * @returns Its Cartesian coordinates, rounded so the string is reproducible.
 */
export function stripPoint(
  basis: readonly [number, number, number, number],
  point: StripPoint,
): [number, number] {
  return [
    round(basis[0] * point[0] + basis[1] * point[1]),
    round(basis[2] * point[0] + basis[3] * point[1]),
  ];
}

function periodOutlines(
  basis: readonly [number, number, number, number],
  periods: number,
): FriezeFrame['periods'] {
  const outlines: Array<{ key: string; points: string; primary: boolean }> = [];
  for (let index = 0; index < periods; index++) {
    const corners: StripPoint[] = [
      [index, -STRIP_REACH],
      [index + 1, -STRIP_REACH],
      [index + 1, STRIP_REACH],
      [index, STRIP_REACH],
    ];
    outlines.push({
      key: String(index),
      points: corners
        .map((corner) => stripPoint(basis, corner).join(','))
        .join(' '),
      primary: index === 0,
    });
  }
  return outlines;
}
