import { expect, test } from 'vitest';

import { exampleById, exampleImage } from '../examples.ts';
import {
  FIELD_CENTRE,
  FIELD_SIZE,
  amplitudeAt,
  fourierTransform,
  inverseFourierTransform,
} from '../fourier.ts';
import { blankField, fillPolygon } from '../raster.ts';
import { LETTER_F } from '../shapes.ts';

function pixel(column: number, row: number): number {
  return (row + FIELD_CENTRE) * FIELD_SIZE + column + FIELD_CENTRE;
}

test('a point at the centre transforms into a flat field, every phase zero', () => {
  const image = blankField();
  image[pixel(0, 0)] = 1;
  const spectrum = fourierTransform(image);

  for (const [u, v] of [
    [0, 0],
    [1, 0],
    [-37, 90],
    [127, -128],
  ] as const) {
    expect(spectrum.re[v + FIELD_CENTRE]?.[u + FIELD_CENTRE]).toBeCloseTo(
      1,
      12,
    );
    expect(spectrum.im[v + FIELD_CENTRE]?.[u + FIELD_CENTRE]).toBeCloseTo(
      0,
      12,
    );
  }
});

test('a cosine grating gives exactly two spots, at ±its frequency', () => {
  const image = new Float64Array(FIELD_SIZE * FIELD_SIZE);
  for (let row = 0; row < FIELD_SIZE; row++) {
    for (let column = 0; column < FIELD_SIZE; column++) {
      image[row * FIELD_SIZE + column] = Math.cos(
        (2 * Math.PI * 16 * column) / FIELD_SIZE,
      );
    }
  }
  const spectrum = fourierTransform(image);
  const half = (FIELD_SIZE * FIELD_SIZE) / 2;

  expect(amplitudeAt(spectrum, 16, 0)).toBeCloseTo(half, 6);
  expect(amplitudeAt(spectrum, -16, 0)).toBeCloseTo(half, 6);
  expect(amplitudeAt(spectrum, 0, 0)).toBeCloseTo(0, 6);
  expect(amplitudeAt(spectrum, 16, 1)).toBeCloseTo(0, 6);
  expect(amplitudeAt(spectrum, 32, 0)).toBeCloseTo(0, 6);
});

test('the inverse gives the image back, to rounding', () => {
  const image = blankField();
  fillPolygon(image, LETTER_F);
  const back = inverseFourierTransform(fourierTransform(image));

  let largest = 0;
  for (let i = 0; i < image.length; i++) {
    largest = Math.max(largest, Math.abs((back[i] ?? 0) - (image[i] ?? 0)));
  }
  expect(largest).toBeLessThan(1e-12);
});

test('Friedel’s law: a real image has |F(u, v)| = |F(−u, −v)|', () => {
  const image = blankField();
  fillPolygon(image, LETTER_F);
  const spectrum = fourierTransform(image);

  for (const [u, v] of [
    [3, 5],
    [17, -2],
    [-40, 33],
  ] as const) {
    expect(amplitudeAt(spectrum, -u, -v)).toBeCloseTo(
      amplitudeAt(spectrum, u, v),
      9,
    );
  }
  // …while the F itself has no centre of symmetry, so the phases differ.
  const re = spectrum.re[FIELD_CENTRE + 5]?.[FIELD_CENTRE + 3] ?? 0;
  const im = spectrum.im[FIELD_CENTRE + 5]?.[FIELD_CENTRE + 3] ?? 0;
  expect(Math.abs(im)).toBeGreaterThan(Math.abs(re) * 1e-3);
});

test('a picture symmetric about its centre has a real transform', () => {
  const square = exampleById('square');
  if (square === undefined) throw new Error('no square example');
  const spectrum = fourierTransform(exampleImage(square));

  let largest = 0;
  for (let row = 0; row < FIELD_SIZE; row++) {
    for (let column = 0; column < FIELD_SIZE; column++) {
      // The row and column at −128 have no partner at +128 inside the field.
      if (row === 0 || column === 0) continue;
      largest = Math.max(largest, Math.abs(spectrum.im[row]?.[column] ?? 0));
    }
  }
  expect(largest).toBeLessThan(1e-9);
  expect(amplitudeAt(spectrum, 0, 0)).toBeCloseTo(32 * 32, 6);
});
