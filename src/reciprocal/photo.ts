/**
 * A picture somebody opens, made into an image the page can transform.
 *
 * It is cut to its central square, scaled to the field, and read in grey. The
 * transform treats the field as one tile of an endless wall of copies, so the
 * left edge of a photograph meets its right edge and the top meets the bottom;
 * where they differ, that seam alone puts a bright cross through the centre of
 * the transform. The edges are therefore faded to the picture's mean grey over
 * the outer eighth of each side, and the cross is gone.
 */

import { FIELD_SIZE } from './fourier.ts';

/** The share of each side faded into the mean. */
const FADED_SHARE = 1 / 8;

/**
 * Read a picture file into an image.
 * @param file - A picture the browser can decode: PNG, JPEG, GIF, WebP, SVG.
 * @returns Row-major values from 0 to 1, {@link FIELD_SIZE} squared of them.
 */
export async function readPhoto(file: Blob): Promise<Float64Array> {
  const bitmap = await globalThis.createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = FIELD_SIZE;
    canvas.height = FIELD_SIZE;
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('This browser cannot read pictures.');
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      FIELD_SIZE,
      FIELD_SIZE,
    );
    const { data } = context.getImageData(0, 0, FIELD_SIZE, FIELD_SIZE);
    const image = new Float64Array(FIELD_SIZE * FIELD_SIZE);
    for (let i = 0; i < image.length; i++) {
      const offset = i * 4;
      // Transparent pixels read as black, like the drawings' background.
      const alpha = (data[offset + 3] ?? 255) / 255;
      const luminance =
        0.2126 * (data[offset] ?? 0) +
        0.7152 * (data[offset + 1] ?? 0) +
        0.0722 * (data[offset + 2] ?? 0);
      image[i] = (luminance / 255) * alpha;
    }
    return fadeEdges(image);
  } finally {
    bitmap.close();
  }
}

/**
 * Fade the edges of an image into its mean grey.
 * @param image - Row-major values, {@link FIELD_SIZE} squared of them.
 * @returns A new image, the same in its centre, the mean along its border.
 */
export function fadeEdges(image: Float64Array): Float64Array {
  let sum = 0;
  for (const value of image) sum += value;
  const mean = sum / image.length;
  const weights = edgeWeights();
  const faded = new Float64Array(image.length);
  for (let row = 0; row < FIELD_SIZE; row++) {
    const rowWeight = weights[row] ?? 0;
    for (let column = 0; column < FIELD_SIZE; column++) {
      const index = row * FIELD_SIZE + column;
      const weight = rowWeight * (weights[column] ?? 0);
      faded[index] = mean + ((image[index] ?? 0) - mean) * weight;
    }
  }
  return faded;
}

/** A Tukey window along one side: 1 in the middle, a cosine down to 0. */
function edgeWeights(): Float64Array {
  const weights = new Float64Array(FIELD_SIZE);
  const ramp = FIELD_SIZE * FADED_SHARE;
  for (let i = 0; i < FIELD_SIZE; i++) {
    const fromEdge = Math.min(i, FIELD_SIZE - 1 - i);
    weights[i] =
      fromEdge >= ramp ? 1 : 0.5 - 0.5 * Math.cos((Math.PI * fromEdge) / ramp);
  }
  return weights;
}
