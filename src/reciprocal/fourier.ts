/**
 * The two-dimensional Fourier transform of an image, and its inverse.
 *
 * An image is a square of {@link FIELD_SIZE} × {@link FIELD_SIZE} real values,
 * row-major, whose origin is the pixel at the centre — not the top-left
 * corner. The transform is stored the same way: the zero frequency at the
 * centre, so a reader looks at it as a diffraction pattern is looked at. With
 * the origin in the middle on both sides, a picture symmetric about its centre
 * has a real transform, which is what lets the phase view say something.
 *
 * The transforms themselves are `ml-spectra-processing`'s, one pass over the
 * rows and one over the columns.
 */

import { reimMatrixFFT, reimMatrixFFTByColumns } from 'ml-spectra-processing';

/** Pixels along each side of every image and of every transform. */
export const FIELD_SIZE = 256;

/** Where the origin sits on each side: the zero frequency, and the image centre. */
export const FIELD_CENTRE = FIELD_SIZE / 2;

/** A transform: one array of real parts and one of imaginary parts per row. */
export interface Spectrum {
  /** Real parts, one row of {@link FIELD_SIZE} per row of the field. */
  re: Float64Array[];
  /** Imaginary parts, laid out as {@link Spectrum.re}. */
  im: Float64Array[];
}

/**
 * The transform of an image, its zero frequency at the centre.
 * @param image - Row-major values, {@link FIELD_SIZE} squared of them.
 * @returns The transform, origin at the centre.
 */
export function fourierTransform(image: Float64Array): Spectrum {
  const re = new Array<Float64Array>(FIELD_SIZE);
  const im = new Array<Float64Array>(FIELD_SIZE);
  // The image is read from its centre: a circular shift by half a side puts
  // the pixel at the centre where the transform expects its origin.
  for (let row = 0; row < FIELD_SIZE; row++) {
    const source = ((row + FIELD_CENTRE) % FIELD_SIZE) * FIELD_SIZE;
    const values = new Float64Array(FIELD_SIZE);
    for (let column = 0; column < FIELD_SIZE; column++) {
      values[column] =
        image[source + ((column + FIELD_CENTRE) % FIELD_SIZE)] ?? 0;
    }
    re[row] = values;
    im[row] = new Float64Array(FIELD_SIZE);
  }
  const rows = reimMatrixFFT(
    { re, im },
    { applyZeroShift: true, inPlace: true },
  );
  return reimMatrixFFTByColumns(rows, { applyZeroShift: true, inPlace: true });
}

/**
 * The image a transform comes from: its real part, origin at the centre.
 *
 * A transform that was cut or changed may no longer come from a real image —
 * a spot kept without its Friedel mate — and the imaginary part is then what
 * is dropped.
 * @param spectrum - A transform laid out as {@link fourierTransform} returns it.
 * @returns Row-major values, {@link FIELD_SIZE} squared of them.
 */
export function inverseFourierTransform(spectrum: Spectrum): Float64Array {
  const columns = reimMatrixFFTByColumns(spectrum, {
    inverse: true,
    applyZeroShift: true,
  });
  const rows = reimMatrixFFT(columns, {
    inverse: true,
    applyZeroShift: true,
    inPlace: true,
  });
  const image = new Float64Array(FIELD_SIZE * FIELD_SIZE);
  for (let row = 0; row < FIELD_SIZE; row++) {
    const values = rows.re[row];
    if (values === undefined) continue;
    const target = ((row + FIELD_CENTRE) % FIELD_SIZE) * FIELD_SIZE;
    for (let column = 0; column < FIELD_SIZE; column++) {
      image[target + ((column + FIELD_CENTRE) % FIELD_SIZE)] =
        values[column] ?? 0;
    }
  }
  return image;
}

/**
 * The amplitude of one coefficient.
 * @param spectrum - The transform.
 * @param u - Column offset from the centre, positive to the right.
 * @param v - Row offset from the centre, positive downwards.
 * @returns |F(u, v)|, or 0 outside the field.
 */
export function amplitudeAt(spectrum: Spectrum, u: number, v: number): number {
  const re = spectrum.re[v + FIELD_CENTRE]?.[u + FIELD_CENTRE];
  const im = spectrum.im[v + FIELD_CENTRE]?.[u + FIELD_CENTRE];
  if (re === undefined || im === undefined) return 0;
  return Math.hypot(re, im);
}
