/**
 * Images and transforms turned into pixels a canvas can paint.
 *
 * An image is shown from its darkest value to its brightest, in grey. A
 * transform spans many orders of magnitude — the centre alone is the sum of
 * every pixel — so its amplitude is shown on a logarithmic scale covering a
 * chosen number of decades below its brightest spot, the centre left to
 * saturate. Its phase is shown as a hue, as bright as the amplitude, so the
 * phase of a coefficient too weak to matter stays dark.
 */

import type { Spectrum } from './fourier.ts';
import { FIELD_CENTRE, FIELD_SIZE } from './fourier.ts';

/** The decades of amplitude a transform shows, from one to six. */
export const CONTRAST_RANGE = { min: 1, max: 6, initial: 3 } as const;

/** How many times the middle of the transform can be enlarged. */
export const ZOOMS = ['1', '2', '4'] as const;

/** One of {@link ZOOMS}. */
export type Zoom = (typeof ZOOMS)[number];

/** What the transform pane paints. */
export const SPECTRUM_VIEWS = ['amplitude', 'phase'] as const;

/** One of {@link SPECTRUM_VIEWS}. */
export type SpectrumView = (typeof SPECTRUM_VIEWS)[number];

/**
 * An image, in grey from its darkest value to its brightest.
 * @param image - Row-major values.
 * @returns RGBA bytes, four per pixel.
 */
export function imagePixels(image: Float64Array): Uint8ClampedArray {
  let min = Infinity;
  let max = -Infinity;
  for (const value of image) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const span = max - min;
  const pixels = new Uint8ClampedArray(image.length * 4);
  for (let i = 0; i < image.length; i++) {
    const grey = span > 0 ? (((image[i] ?? 0) - min) / span) * 255 : 0;
    writeRgb(pixels, i, grey, grey, grey);
  }
  return pixels;
}

/**
 * How bright each point of a transform is drawn, from 0 to 1.
 * @param spectrum - The transform.
 * @param decades - Orders of magnitude shown below the brightest point that
 * is not the centre.
 * @returns One value per point, row-major.
 */
export function amplitudeLevels(
  spectrum: Spectrum,
  decades: number,
): Float64Array {
  const amplitudes = new Float64Array(FIELD_SIZE * FIELD_SIZE);
  let max = 0;
  for (let row = 0; row < FIELD_SIZE; row++) {
    const re = spectrum.re[row];
    const im = spectrum.im[row];
    if (re === undefined || im === undefined) continue;
    for (let column = 0; column < FIELD_SIZE; column++) {
      const value = Math.hypot(re[column] ?? 0, im[column] ?? 0);
      amplitudes[row * FIELD_SIZE + column] = value;
      const centre = row === FIELD_CENTRE && column === FIELD_CENTRE;
      if (!centre && value > max) max = value;
    }
  }
  // A transform holding nothing but its centre — a uniform image — is drawn
  // against the centre itself.
  if (max === 0) {
    max = amplitudes[FIELD_CENTRE * FIELD_SIZE + FIELD_CENTRE] ?? 0;
  }
  if (max === 0) return amplitudes;
  const floor = max * 10 ** -decades;
  const top = Math.log10(1 + max / floor);
  for (let i = 0; i < amplitudes.length; i++) {
    const level = Math.log10(1 + (amplitudes[i] ?? 0) / floor) / top;
    amplitudes[i] = Math.min(level, 1);
  }
  return amplitudes;
}

/**
 * A transform's amplitude, in grey on a logarithmic scale.
 * @param spectrum - The transform.
 * @param decades - Orders of magnitude shown.
 * @returns RGBA bytes, four per pixel.
 */
export function amplitudePixels(
  spectrum: Spectrum,
  decades: number,
): Uint8ClampedArray {
  const levels = amplitudeLevels(spectrum, decades);
  const pixels = new Uint8ClampedArray(levels.length * 4);
  for (let i = 0; i < levels.length; i++) {
    const grey = (levels[i] ?? 0) * 255;
    writeRgb(pixels, i, grey, grey, grey);
  }
  return pixels;
}

/**
 * A transform's phase, as a hue as bright as its amplitude.
 * @param spectrum - The transform.
 * @param decades - Orders of magnitude of amplitude shown.
 * @returns RGBA bytes, four per pixel.
 */
export function phasePixels(
  spectrum: Spectrum,
  decades: number,
): Uint8ClampedArray {
  const levels = amplitudeLevels(spectrum, decades);
  const pixels = new Uint8ClampedArray(levels.length * 4);
  for (let row = 0; row < FIELD_SIZE; row++) {
    const re = spectrum.re[row];
    const im = spectrum.im[row];
    if (re === undefined || im === undefined) continue;
    for (let column = 0; column < FIELD_SIZE; column++) {
      const index = row * FIELD_SIZE + column;
      const phase = Math.atan2(im[column] ?? 0, re[column] ?? 0);
      const hue = ((phase + Math.PI) / (2 * Math.PI)) * 6;
      const [red, green, blue] = hueRgb(hue);
      const level = (levels[index] ?? 0) * 255;
      writeRgb(pixels, index, red * level, green * level, blue * level);
    }
  }
  return pixels;
}

/** A fully saturated colour on the six sectors of the hue circle. */
function hueRgb(sector: number): [number, number, number] {
  const fraction = sector - Math.floor(sector);
  const rising = fraction;
  const falling = 1 - fraction;
  switch (Math.floor(sector) % 6) {
    case 0:
      return [1, rising, 0];
    case 1:
      return [falling, 1, 0];
    case 2:
      return [0, 1, rising];
    case 3:
      return [0, falling, 1];
    case 4:
      return [rising, 0, 1];
    default:
      return [1, 0, falling];
  }
}

function writeRgb(
  pixels: Uint8ClampedArray,
  index: number,
  red: number,
  green: number,
  blue: number,
): void {
  const offset = index * 4;
  pixels[offset] = red;
  pixels[offset + 1] = green;
  pixels[offset + 2] = blue;
  pixels[offset + 3] = 255;
}
