/**
 * The element diagram of a frieze group, as a strip.
 *
 * A frieze group repeats along **one** direction, so it cannot be drawn with
 * the plane-group diagram: that one decomposes the operations over a square
 * block of lattice translations, and a translation across the strip is not one
 * of this group's. Feeding `p11g` the square block invents four glide lines it
 * does not have, and `p2` twenty rotation centres — measured, not guessed.
 *
 * So the shifts run along **a** alone, and the picture is a band with the axis
 * of the frieze through the middle rather than along its bottom edge.
 */

import type { CrystalOperation } from '../../symmetry/core/index.ts';
import { planeElementTable } from '../../symmetry/planeElements.ts';
import { rotationGlyphPath } from '../plane/glyphs.ts';
import { round } from '../plane/precision.ts';

/** One period of the strip, in the picture's own units. */
const PERIOD = 100;

/** Half the height of the band. A frieze is unbounded across; this is the view. */
const HALF_HEIGHT = 42;

/** Space left around the band so a glyph on its edge is whole. */
const PADDING = 10;

/** One mirror or glide line of a strip, already placed. */
export interface StripLine {
  readonly key: string;
  readonly kind: 'mirror' | 'glide';
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** One rotation point of a strip, as a filled glyph. */
export interface StripGlyph {
  readonly key: string;
  readonly order: number;
  readonly path: string;
}

/** Everything a frieze diagram draws, in the y-up frame the SVG flips. */
export interface StripDiagram {
  readonly viewBox: string;
  /** Where one period ends and the next begins, for the faint uprights. */
  readonly boundaries: readonly number[];
  readonly lines: readonly StripLine[];
  readonly glyphs: readonly StripGlyph[];
  readonly top: number;
}

/**
 * The lattice translations of a strip: along **a** only, `(0, 0)` first.
 *
 * @param count - How many periods beyond the first. @default 1
 */
export function stripShifts(count = 1): number[][] {
  const shifts: number[][] = [];
  for (let u = 0; u <= count; u++) shifts.push([u, 0]);
  return shifts;
}

/**
 * The drawable diagram of one frieze group, from its coset list.
 *
 * The table is built over `2 × periods` translations, not `periods`: an
 * element's location is the translation divided by the order of the operation,
 * so a half-turn centre a whole period away comes from a shift of two.
 *
 * @param operations - From `friezeOperations`.
 * @param periods - How many periods to draw. @default 3
 */
export function stripDiagram(
  operations: ReadonlyArray<CrystalOperation<2>>,
  periods = 3,
): StripDiagram {
  const table = planeElementTable(operations, stripShifts(2 * periods));
  const width = periods * PERIOD;
  const lines: StripLine[] = [];
  for (const line of table.lines) {
    const [h, k] = line.normal;
    const placed = placeLine(line.kind, line.symbol, h, k, line.offset, width);
    if (placed !== null) lines.push(placed);
  }
  const glyphs: StripGlyph[] = [];
  for (const rotation of table.rotations) {
    const [u, v] = rotation.point;
    const x = round(u * PERIOD);
    const y = round(v * 2 * HALF_HEIGHT);
    if (x < 0 || x > width || Math.abs(y) > HALF_HEIGHT) continue;
    glyphs.push({
      key: `${rotation.order}@${u},${v}`,
      order: rotation.order,
      path: rotationGlyphPath(rotation.order, x, y, PERIOD),
    });
  }
  const boundaries: number[] = [];
  for (let period = 0; period <= periods; period++) {
    boundaries.push(period * PERIOD);
  }
  return {
    viewBox: `${-PADDING} ${-(HALF_HEIGHT + PADDING)} ${width + 2 * PADDING} ${2 * (HALF_HEIGHT + PADDING)}`,
    boundaries,
    lines,
    glyphs,
    top: HALF_HEIGHT,
  };
}

/**
 * Where one line of the element table crosses the band.
 *
 * A frieze carries only two kinds: `(1 0)` lines across the strip, which are
 * the mirrors between the motifs, and `(0 1)` lines along it, which are the
 * mirror or glide the strip axis itself is. Anything else needs a translation
 * the group has not got, so it is dropped rather than drawn wrong.
 */
function placeLine(
  kind: 'mirror' | 'glide',
  symbol: string,
  h: number,
  k: number,
  offset: number,
  width: number,
): StripLine | null {
  if (k === 0 && h !== 0) {
    const x = round((offset / h) * PERIOD);
    if (x < 0 || x > width) return null;
    return {
      key: `${symbol}|${h},${k}|${offset}`,
      kind,
      x1: x,
      y1: -HALF_HEIGHT,
      x2: x,
      y2: HALF_HEIGHT,
    };
  }
  if (h === 0 && k !== 0) {
    const y = round((offset / k) * 2 * HALF_HEIGHT);
    if (Math.abs(y) > HALF_HEIGHT) return null;
    return {
      key: `${symbol}|${h},${k}|${offset}`,
      kind,
      x1: 0,
      y1: y,
      x2: width,
      y2: y,
    };
  }
  return null;
}
