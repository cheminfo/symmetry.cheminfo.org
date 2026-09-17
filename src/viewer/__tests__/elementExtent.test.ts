import { expect, test } from 'vitest';

import { createLattice } from '../../symmetry/core/index.ts';
import { axisRod, faceOf } from '../elementExtent.ts';

/** A 10 Å cube, where the answer can be read off the drawing. */
const CUBIC = createLattice({
  a: 10,
  b: 10,
  c: 10,
  alpha: 90,
  beta: 90,
  gamma: 90,
});

test('an unclipped axis keeps the rod the caller asked for', () => {
  expect(axisRod(CUBIC, [5, 5, 0], [0, 0, 1], 8, false)).toStrictEqual({
    point: [5, 5, 0],
    direction: [0, 0, 1],
    length: 8,
  });
});

test('a clipped axis runs the whole way through the cell, centred on it', () => {
  const rod = axisRod(CUBIC, [5, 5, 0], [0, 0, 1], 8, true);
  expect(rod.length).toBeCloseTo(10, 9);
  expect(rod.direction).toStrictEqual([0, 0, 1]);
  expect(rod.point[0]).toBeCloseTo(5, 9);
  expect(rod.point[1]).toBeCloseTo(5, 9);
  expect(rod.point[2]).toBeCloseTo(5, 9);
});

test('an axis that misses the cell falls back to the rod it asked for', () => {
  expect(axisRod(CUBIC, [50, 50, 0], [0, 0, 1], 8, true)).toStrictEqual({
    point: [50, 50, 0],
    direction: [0, 0, 1],
    length: 8,
  });
});

test('an unclipped plane is given no outline, so it keeps its square', () => {
  expect(faceOf(CUBIC, [0, 0, 5], [0, 0, 1], false)).toStrictEqual({});
});

test('a clipped plane is given the four corners it cuts the cell at', () => {
  const { outline } = faceOf(CUBIC, [0, 0, 5], [0, 0, 1], true);
  expect(outline).toHaveLength(4);
  expect(outline?.[1]?.[0]).toBeCloseTo(10, 9);
  expect(outline?.[2]?.[1]).toBeCloseTo(10, 9);
  for (const corner of outline ?? []) {
    expect(corner[2]).toBeCloseTo(5, 9);
  }
});

test('a plane past the cell is given no outline either', () => {
  expect(faceOf(CUBIC, [0, 0, 20], [0, 0, 1], true)).toStrictEqual({});
});
