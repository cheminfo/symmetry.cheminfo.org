import { expect, test } from 'vitest';

import {
  cellAxes,
  cellAxisLabelPoints,
  cellEdges,
  cellPoint,
  clampRepeat,
  latticeShifts,
} from '../cellGeometry.ts';
import type { UnitCell } from '../types.ts';

const CUBIC: UnitCell = { a: 4, b: 4, c: 4, alpha: 90, beta: 90, gamma: 90 };

const MONOCLINIC: UnitCell = {
  a: 5,
  b: 6,
  c: 7,
  alpha: 90,
  beta: 105,
  gamma: 90,
};

test('a cubic cell has its axes along x, y and z', () => {
  const [a, b, c] = cellAxes(CUBIC);
  expectClose(a, [4, 0, 0]);
  expectClose(b, [0, 4, 0]);
  expectClose(c, [0, 0, 4]);
});

test('a monoclinic cell keeps a along x and puts c in the xz plane', () => {
  const [a, b, c] = cellAxes(MONOCLINIC);
  expectClose(a, [5, 0, 0]);
  expectClose(b, [0, 6, 0]);
  // c = (c cosβ, 0, c sinβ), the PDB convention with β the a–c angle.
  expectClose(c, [
    7 * Math.cos((105 * Math.PI) / 180),
    0,
    7 * Math.sin((105 * Math.PI) / 180),
  ]);
});

test('the axes reproduce the cell lengths and the β angle they were built from', () => {
  const [a, , c] = cellAxes(MONOCLINIC);
  expect(Math.hypot(a[0], a[1], a[2])).toBeCloseTo(5, 12);
  expect(Math.hypot(c[0], c[1], c[2])).toBeCloseTo(7, 12);
  const cosine = (a[0] * c[0] + a[1] * c[1] + a[2] * c[2]) / (5 * 7);
  expect((Math.acos(cosine) * 180) / Math.PI).toBeCloseTo(105, 10);
});

test('a fractional point goes through the axes', () => {
  expectClose(cellPoint(cellAxes(CUBIC), [0.5, 0.25, 1]), [2, 1, 4]);
});

test('an n×n×n stack has one shift per cell, the first of them zero', () => {
  const shifts = latticeShifts(cellAxes(CUBIC), [2, 3, 1]);
  expect(shifts).toHaveLength(6);
  expectClose(shifts[0] ?? [0, 0, 0], [0, 0, 0]);
  expectClose(shifts[5] ?? [0, 0, 0], [4, 8, 0]);
});

test('a box has twelve edges, and a stack has twelve per cell', () => {
  expect(cellEdges(CUBIC)).toHaveLength(12);
  expect(cellEdges(CUBIC, [2, 2, 2])).toHaveLength(96);
});

test('the twelve edges meet at the eight corners, three each', () => {
  const corners = new Map<string, number>();
  for (const edge of cellEdges(CUBIC)) {
    for (const point of [edge.start, edge.end]) {
      const key = point.map((value) => value.toFixed(6)).join(',');
      corners.set(key, (corners.get(key) ?? 0) + 1);
    }
  }
  expect(corners.size).toBe(8);
  expect([...corners.values()]).toStrictEqual([3, 3, 3, 3, 3, 3, 3, 3]);
});

test('the a, b and c letters sit part-way along their own edges', () => {
  const [a, b, c] = cellAxisLabelPoints(CUBIC, 0.5);
  expectClose(a, [2, 0, 0]);
  expectClose(b, [0, 2, 0]);
  expectClose(c, [0, 0, 2]);
});

test('a repeat below one, or fractional, is read as whole cells', () => {
  expect(clampRepeat([0, 2.7, -3])).toStrictEqual([1, 2, 1]);
});

test('three angles that describe no cell are refused rather than drawn as NaN', () => {
  expect(() =>
    cellAxes({ a: 1, b: 1, c: 1, alpha: 10, beta: 10, gamma: 170 }),
  ).toThrow(RangeError);
});

function expectClose(
  actual: readonly number[],
  expected: readonly [number, number, number],
): void {
  expect(actual[0] ?? Number.NaN).toBeCloseTo(expected[0], 10);
  expect(actual[1] ?? Number.NaN).toBeCloseTo(expected[1], 10);
  expect(actual[2] ?? Number.NaN).toBeCloseTo(expected[2], 10);
}
