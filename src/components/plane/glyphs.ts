/**
 * The International Tables glyphs for a rotation point, as SVG path data.
 *
 * A lens for a 2-fold, a triangle for a 3-fold, a square for a 4-fold, a hexagon
 * for a 6-fold — Table 2.1.2.1 of Volume A. One function draws all of them so a
 * stereogram's 5-fold and 8-fold, which no crystal has, come out of the same
 * code rather than a second one.
 */

import { round } from './precision.ts';

/** Every glyph size, as a fraction of the drawn cell edge. */
export const GLYPH = {
  /** Half the long axis of the 2-fold lens. */
  lensLength: 0.042,
  /** Half its short axis: the control offset of the two quadratic arcs. */
  lensWidth: 0.026,
  /** Circumradius of the 3-fold triangle. */
  triangle: 0.05,
  /** Half the side of the 4-fold square, whose edges run along the cell edges. */
  square: 0.038,
  /** Circumradius of the 6-fold hexagon, and of any other n-gon. */
  polygon: 0.05,
} as const;

/**
 * The glyph of an n-fold rotation point, centred on `(cx, cy)`.
 *
 * @param order - n of the n-fold: 2 draws the lens, 4 the axis-aligned square,
 *   anything else a regular n-gon with a vertex pointing up.
 * @param cx - Centre, in the drawing's own units.
 * @param cy - Centre.
 * @param scale - The cell edge the sizes above are fractions of.
 * @returns Path data for a single `<path d>`.
 * @throws When the order is below 2, which is no rotation point at all.
 */
export function rotationGlyphPath(
  order: number,
  cx: number,
  cy: number,
  scale: number,
): string {
  if (order < 2) throw new RangeError(`${order} is not a rotation point`);
  if (order === 2) return lensPath(cx, cy, scale);
  if (order === 4) return squarePath(cx, cy, GLYPH.square * scale);
  return polygonPath(cx, cy, GLYPH.polygon * scale, order);
}

/** The pointed oval the Tables draw a 2-fold with: two quadratic arcs meeting in points. */
export function lensPath(cx: number, cy: number, scale: number): string {
  const long = GLYPH.lensLength * scale;
  const wide = GLYPH.lensWidth * scale;
  const top = point(cx, cy + long);
  const bottom = point(cx, cy - long);
  return `M ${top} Q ${point(cx + wide, cy)} ${bottom} Q ${point(cx - wide, cy)} ${top} Z`;
}

/** A square with its edges along the drawing's axes, which are the cell edges. */
export function squarePath(cx: number, cy: number, half: number): string {
  return `M ${point(cx - half, cy - half)} L ${point(cx + half, cy - half)} L ${point(cx + half, cy + half)} L ${point(cx - half, cy + half)} Z`;
}

/**
 * A regular polygon with a vertex straight up.
 *
 * @param cx - Centre.
 * @param cy - Centre.
 * @param radius - Circumradius.
 * @param sides - How many, 3 or more.
 */
export function polygonPath(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
): string {
  let path = '';
  for (let index = 0; index < sides; index++) {
    const angle = Math.PI / 2 + (2 * Math.PI * index) / sides;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    path += `${index === 0 ? 'M' : ' L'} ${point(x, y)}`;
  }
  return `${path} Z`;
}

/** A circle as path data, so an open glyph is the same kind of node as a filled one. */
export function circlePath(cx: number, cy: number, radius: number): string {
  const r = round(radius);
  return `M ${point(cx - radius, cy)} a ${r} ${r} 0 1 0 ${round(2 * radius)} 0 a ${r} ${r} 0 1 0 ${round(-2 * radius)} 0 Z`;
}

/** `x,y` at drawing precision. */
function point(x: number, y: number): string {
  return `${round(x)},${round(y)}`;
}

/**
 * The comma the Tables put inside a circle whose point is of the opposite hand.
 *
 * @param cx - Centre of the circle it sits in.
 * @param cy - Centre.
 * @param size - Radius of that circle.
 */
export function commaPath(cx: number, cy: number, size: number): string {
  const head = size * 0.55;
  const tail = size * 1.15;
  return [
    `M ${point(cx - head * 0.6, cy + head * 0.2)}`,
    `C ${point(cx - head * 0.6, cy + head)} ${point(cx + head * 0.6, cy + head)} ${point(cx + head * 0.6, cy + head * 0.2)}`,
    `C ${point(cx + head * 0.6, cy - head * 0.5)} ${point(cx, cy - tail * 0.6)} ${point(cx - head * 0.2, cy - tail)}`,
    `C ${point(cx + head * 0.1, cy - tail * 0.5)} ${point(cx - head * 0.1, cy - head * 0.2)} ${point(cx - head * 0.6, cy + head * 0.2)}`,
    'Z',
  ].join(' ');
}
