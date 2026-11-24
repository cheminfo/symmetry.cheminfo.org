import { expect, test } from 'vitest';

import { RECIPROCAL_EXAMPLES, exampleById, exampleImage } from '../examples.ts';
import {
  FIELD_CENTRE,
  FIELD_SIZE,
  amplitudeAt,
  fourierTransform,
} from '../fourier.ts';
import type { LatticeSettings } from '../lattice.ts';
import {
  DEFAULT_LATTICE,
  latticeImage,
  latticeVectors,
  millerIndices,
  reciprocalVectors,
} from '../lattice.ts';

function dot(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return a.x * b.x + a.y * b.y;
}

function spectrumOf(settings: LatticeSettings) {
  return fourierTransform(latticeImage(settings));
}

test('a* · a = b* · b = 1 and a* · b = b* · a = 0, whatever the angle', () => {
  const vectors = latticeVectors({
    ...DEFAULT_LATTICE,
    a: 20,
    b: 16,
    gamma: 70,
  });
  const reciprocal = reciprocalVectors(vectors);

  expect(dot(reciprocal.a, vectors.a)).toBeCloseTo(1, 12);
  expect(dot(reciprocal.b, vectors.b)).toBeCloseTo(1, 12);
  expect(dot(reciprocal.a, vectors.b)).toBeCloseTo(0, 12);
  expect(dot(reciprocal.b, vectors.a)).toBeCloseTo(0, 12);
  // |a*| = 1 / (a sin γ), and a* and b* meet at 180° − γ.
  const aStar = Math.hypot(reciprocal.a.x, reciprocal.a.y);
  expect(aStar).toBeCloseTo(1 / (20 * Math.sin((70 * Math.PI) / 180)), 12);
  const cosine =
    dot(reciprocal.a, reciprocal.b) /
    (aStar * Math.hypot(reciprocal.b.x, reciprocal.b.y));
  expect((Math.acos(cosine) * 180) / Math.PI).toBeCloseTo(110, 9);
});

test('the point (16, 0) of a 16 px square lattice is its (1 0) spot', () => {
  const vectors = latticeVectors(DEFAULT_LATTICE);

  const first = millerIndices(vectors, 16, 0);
  expect(first.h).toBeCloseTo(1, 12);
  expect(first.k).toBeCloseTo(0, 12);
  const { h, k } = millerIndices(vectors, 16, -32);
  expect(h).toBeCloseTo(1, 12);
  expect(k).toBeCloseTo(2, 12);
});

test('a square lattice of dots every 16 px gives spots every 16 px', () => {
  const spectrum = spectrumOf(DEFAULT_LATTICE);
  const spot = amplitudeAt(spectrum, 16, 0);

  expect(spot).toBeGreaterThan(20 * amplitudeAt(spectrum, 8, 0));
  expect(spot).toBeGreaterThan(20 * amplitudeAt(spectrum, 8, 8));
  expect(amplitudeAt(spectrum, 16, 16)).toBeGreaterThan(
    20 * amplitudeAt(spectrum, 24, 8),
  );
});

test('a centred cell has no spot with h + k odd', () => {
  const spectrum = spectrumOf({
    ...DEFAULT_LATTICE,
    a: 32,
    b: 32,
    basis: 'centred',
  });
  // a = 32 px: one step of a* is 8 px of the transform.
  const strong = amplitudeAt(spectrum, 16, 0);

  expect(amplitudeAt(spectrum, 8, 0)).toBeLessThan(0.02 * strong);
  expect(amplitudeAt(spectrum, 0, 8)).toBeLessThan(0.02 * strong);
  expect(amplitudeAt(spectrum, 8, 8)).toBeGreaterThan(0.5 * strong);
});

test('a glide along b leaves every (0 k) spot with k odd empty', () => {
  const spectrum = spectrumOf({
    ...DEFAULT_LATTICE,
    a: 32,
    b: 32,
    basis: 'glide',
  });
  const even = amplitudeAt(spectrum, 0, 16);

  expect(amplitudeAt(spectrum, 0, 8)).toBeLessThan(0.02 * even);
  expect(amplitudeAt(spectrum, 0, 24)).toBeLessThan(0.02 * even);
  // Off the axis the odd spots are there: the absence is the glide's alone.
  expect(amplitudeAt(spectrum, 8, 8)).toBeGreaterThan(0.1 * even);
});

test('a smaller crystal gives broader spots', () => {
  expect(spotHalfWidth(90)).toBe(0);
  expect(spotHalfWidth(22)).toBeGreaterThanOrEqual(2);
});

test('every example draws a picture inside the field', () => {
  expect(RECIPROCAL_EXAMPLES).toHaveLength(19);
  const ids = new Set(RECIPROCAL_EXAMPLES.map((example) => example.id));
  expect(ids.size).toBe(19);

  for (const example of RECIPROCAL_EXAMPLES) {
    const image = exampleImage(example);
    expect(image).toHaveLength(FIELD_SIZE * FIELD_SIZE);
    let sum = 0;
    for (const value of image) sum += value;
    expect(sum).toBeGreaterThan(10);
  }
});

test('equal bars and gaps keep only the odd orders of the stripes', () => {
  const stripes = exampleById('stripes');
  if (stripes === undefined) throw new Error('no stripes');
  const spectrum = fourierTransform(exampleImage(stripes));
  const first = amplitudeAt(spectrum, 16, 0);

  expect(first).toBeGreaterThan(1000);
  expect(amplitudeAt(spectrum, 32, 0)).toBeLessThan(1e-6 * first);
  // A sampled square wave: the third order is sin(π/16) / sin(3π/16) of the
  // first, close to the 1/3 of a continuous one.
  expect(amplitudeAt(spectrum, 48, 0) / first).toBeCloseTo(
    Math.sin(Math.PI / 16) / Math.sin((3 * Math.PI) / 16),
    9,
  );
  expect(amplitudeAt(spectrum, 16, 1)).toBeLessThan(1e-6 * first);
});

test('the arrow is its own mirror image, and the F is not', () => {
  expect(mirrored('arrow')).toBe(true);
  expect(mirrored('letter-f')).toBe(false);
});

/** How many pixels past the (1 0) spot it stays above half its height. */
function spotHalfWidth(crystal: number): number {
  const spectrum = spectrumOf({ ...DEFAULT_LATTICE, crystal });
  const peak = amplitudeAt(spectrum, 16, 0);
  let half = 0;
  while (amplitudeAt(spectrum, 16 + half + 1, 0) > peak / 2) half++;
  return half;
}

/** Whether an example is the same mirrored left to right about its centre. */
function mirrored(id: string): boolean {
  const example = exampleById(id);
  if (example === undefined) throw new Error(id);
  const image = exampleImage(example);
  for (let row = 0; row < FIELD_SIZE; row++) {
    for (let x = 1; x < FIELD_CENTRE; x++) {
      const left = image[row * FIELD_SIZE + FIELD_CENTRE - x] ?? 0;
      const right = image[row * FIELD_SIZE + FIELD_CENTRE + x] ?? 0;
      if (Math.abs(left - right) > 1e-12) return false;
    }
  }
  return true;
}
