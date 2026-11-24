/**
 * The part of the image that is transformed, when a student selects one.
 *
 * Everything outside it is set to zero, as an opaque screen with a window cut
 * in it would: the transform is then that of the part alone, and a smaller
 * part gives broader spots. A region is whole pixels, `x` and `y` its top-left
 * corner, counted from the top-left of the field.
 */

import { FIELD_SIZE } from './fourier.ts';

/** A rectangle of whole pixels. */
export interface Region {
  /** Column of its left edge. */
  x: number;
  /** Row of its top edge. */
  y: number;
  /** Columns across. */
  width: number;
  /** Rows down. */
  height: number;
}

/** The smallest side a region keeps; anything less is a click, not a drag. */
export const MIN_REGION_SIDE = 4;

/**
 * A rectangle between two corners, cut to the field.
 * @param x0 - Column of one corner.
 * @param y0 - Row of that corner.
 * @param x1 - Column of the opposite corner.
 * @param y1 - Row of that corner.
 * @returns The region, or `null` when it is too thin to be one.
 */
export function regionBetween(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Region | null {
  const left = clampPixel(Math.min(x0, x1));
  const top = clampPixel(Math.min(y0, y1));
  const right = clampPixel(Math.max(x0, x1));
  const bottom = clampPixel(Math.max(y0, y1));
  const width = right - left + 1;
  const height = bottom - top + 1;
  if (width < MIN_REGION_SIDE || height < MIN_REGION_SIDE) return null;
  return { x: left, y: top, width, height };
}

/**
 * The image with everything outside the region set to zero.
 * @param image - The image.
 * @param region - What is kept, or `null` for all of it.
 * @returns The image given when nothing is cut, a new one otherwise.
 */
export function cutToRegion(
  image: Float64Array,
  region: Region | null,
): Float64Array {
  if (region === null) return image;
  const cut = new Float64Array(image.length);
  const right = Math.min(region.x + region.width, FIELD_SIZE);
  const bottom = Math.min(region.y + region.height, FIELD_SIZE);
  for (let row = region.y; row < bottom; row++) {
    for (let column = region.x; column < right; column++) {
      const index = row * FIELD_SIZE + column;
      cut[index] = image[index] ?? 0;
    }
  }
  return cut;
}

/**
 * Read a region from a link: `x,y,width,height`.
 * @param text - What the link carries.
 * @returns The region, cut to the field, or `null` when it is not one.
 */
export function parseRegion(text: string): Region | null {
  const parts = text.split(',');
  if (parts.length !== 4) return null;
  const numbers: number[] = [];
  for (const part of parts) {
    const value = Number(part);
    if (part.trim() === '' || !Number.isFinite(value)) return null;
    numbers.push(Math.round(value));
  }
  const [x = 0, y = 0, width = 0, height = 0] = numbers;
  return regionBetween(x, y, x + width - 1, y + height - 1);
}

/**
 * Write a region into a link.
 * @param region - The region, or `null` for none.
 * @returns `x,y,width,height`, or the empty string.
 */
export function formatRegion(region: Region | null): string {
  if (region === null) return '';
  return `${region.x},${region.y},${region.width},${region.height}`;
}

function clampPixel(value: number): number {
  return Math.min(Math.max(Math.round(value), 0), FIELD_SIZE - 1);
}
