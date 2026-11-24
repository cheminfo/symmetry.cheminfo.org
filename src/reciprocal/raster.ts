/**
 * Shapes painted white on a black field, with their edges smoothed.
 *
 * Every drawing the page transforms is built from these: holes, slits, letters
 * and the motif a lattice repeats. A shape is given in pixels about the centre
 * of the field — `x` to the right, `y` downwards, as on screen — and painted
 * with 4 × 4 samples per pixel, so a slanted edge is grey where it cuts a
 * pixel instead of a staircase. A staircase would put spots of its own in the
 * transform, and a student would rightly ask where they come from.
 *
 * Shapes are joined, never added: where two overlap the field stays at 1.
 */

import { FIELD_CENTRE, FIELD_SIZE } from './fourier.ts';

/** A point in pixels from the centre of the field, `y` pointing down. */
export interface Point {
  /** Pixels to the right of the centre. */
  x: number;
  /** Pixels below the centre. */
  y: number;
}

/** Samples along each side of a pixel. */
const SAMPLES = 4;

/** Total samples in one pixel. */
const SAMPLES_PER_PIXEL = SAMPLES * SAMPLES;

/**
 * A black field, ready to be painted on.
 * @returns {@link FIELD_SIZE} squared zeros.
 */
export function blankField(): Float64Array {
  return new Float64Array(FIELD_SIZE * FIELD_SIZE);
}

/**
 * Paint a filled polygon.
 * @param field - Field painted on, in place.
 * @param points - Vertices in order, either way round; the polygon is closed.
 * @param brightness - What a fully covered pixel is painted, 1 for white.
 */
export function fillPolygon(
  field: Float64Array,
  points: readonly Point[],
  brightness = 1,
): void {
  if (points.length < 3) return;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }
  paint(field, brightness, minX, maxX, minY, maxY, (x, y) =>
    insidePolygon(points, x, y),
  );
}

/**
 * Paint a filled disk.
 * @param field - Field painted on, in place.
 * @param centre - Its centre.
 * @param radius - Its radius, in pixels.
 * @param brightness - What a fully covered pixel is painted, 1 for white.
 */
export function fillDisk(
  field: Float64Array,
  centre: Point,
  radius: number,
  brightness = 1,
): void {
  const squared = radius * radius;
  paint(
    field,
    brightness,
    centre.x - radius,
    centre.x + radius,
    centre.y - radius,
    centre.y + radius,
    (x, y) => {
      const dx = x - centre.x;
      const dy = y - centre.y;
      return dx * dx + dy * dy <= squared;
    },
  );
}

/**
 * Paint an upright rectangle.
 * @param field - Field painted on, in place.
 * @param centre - Its centre.
 * @param width - Its width, in pixels.
 * @param height - Its height, in pixels.
 */
export function fillRectangle(
  field: Float64Array,
  centre: Point,
  width: number,
  height: number,
): void {
  const left = centre.x - width / 2;
  const right = centre.x + width / 2;
  const top = centre.y - height / 2;
  const bottom = centre.y + height / 2;
  paint(
    field,
    1,
    left,
    right,
    top,
    bottom,
    (x, y) => x >= left && x <= right && y >= top && y <= bottom,
  );
}

/**
 * Turn a polygon about the centre of the field.
 * @param points - Its vertices.
 * @param degrees - Angle, counter-clockwise as the eye sees it on screen.
 * @returns The vertices, turned.
 */
export function rotatePoints(
  points: readonly Point[],
  degrees: number,
): Point[] {
  const angle = (degrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  // `y` points down, so a turn the eye reads as counter-clockwise is the
  // mathematical clockwise one in these coordinates.
  return points.map((point) => ({
    x: point.x * cos + point.y * sin,
    y: -point.x * sin + point.y * cos,
  }));
}

/**
 * Move a polygon, and optionally mirror it left to right first.
 * @param points - Its vertices.
 * @param offset - Where its own origin lands.
 * @param mirror - Whether `x` is negated before the move.
 * @param scale - Factor applied before the move.
 * @returns The vertices, placed.
 */
export function placePoints(
  points: readonly Point[],
  offset: Point,
  mirror = false,
  scale = 1,
): Point[] {
  return points.map((point) => ({
    x: offset.x + (mirror ? -point.x : point.x) * scale,
    y: offset.y + point.y * scale,
  }));
}

function paint(
  field: Float64Array,
  brightness: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  inside: (x: number, y: number) => boolean,
): void {
  const firstColumn = Math.max(0, Math.floor(minX + FIELD_CENTRE - 0.5));
  const lastColumn = Math.min(
    FIELD_SIZE - 1,
    Math.ceil(maxX + FIELD_CENTRE + 0.5),
  );
  const firstRow = Math.max(0, Math.floor(minY + FIELD_CENTRE - 0.5));
  const lastRow = Math.min(
    FIELD_SIZE - 1,
    Math.ceil(maxY + FIELD_CENTRE + 0.5),
  );
  for (let row = firstRow; row <= lastRow; row++) {
    for (let column = firstColumn; column <= lastColumn; column++) {
      let covered = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        // Pixel `i` spans `i - 0.5` to `i + 0.5` about its own centre, so the
        // samples sit symmetrically about it and a centred shape stays centred.
        const y = row - FIELD_CENTRE + (sy + 0.5) / SAMPLES - 0.5;
        for (let sx = 0; sx < SAMPLES; sx++) {
          const x = column - FIELD_CENTRE + (sx + 0.5) / SAMPLES - 0.5;
          if (inside(x, y)) covered++;
        }
      }
      if (covered === 0) continue;
      const index = row * FIELD_SIZE + column;
      const value = (covered / SAMPLES_PER_PIXEL) * brightness;
      if (value > (field[index] ?? 0)) field[index] = value;
    }
  }
}

function insidePolygon(
  points: readonly Point[],
  x: number,
  y: number,
): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    if (a === undefined || b === undefined) continue;
    if (
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}
