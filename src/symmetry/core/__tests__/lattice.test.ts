import { expect, test } from 'vitest';

import { fractionalDistance, minimumImageDistance } from '../distance.ts';
import {
  cartesianMatrix,
  cartesianToFractional,
  cellVolume,
  createLattice,
  dSpacing,
  fractionalToCartesian,
  metricTensor,
  reciprocalCell,
} from '../lattice.ts';

const CUBIC = { a: 4, b: 4, c: 4, alpha: 90, beta: 90, gamma: 90 };
const HEXAGONAL = { a: 3, b: 3, c: 5, alpha: 90, beta: 90, gamma: 120 };
const MONOCLINIC = { a: 5, b: 6, c: 7, alpha: 90, beta: 100, gamma: 90 };
const TRICLINIC = { a: 5.1, b: 6.2, c: 7.3, alpha: 80, beta: 85, gamma: 95 };

test('the volume of a cell whose answer is obvious', () => {
  expect(cellVolume(CUBIC)).toBeCloseTo(64, 12);
  // a·b·c·sin γ for a monoclinic cell, and a²·c·sin 120° for a hexagonal one.
  expect(cellVolume(MONOCLINIC)).toBeCloseTo(206.8096281325637, 10);
  expect(cellVolume(HEXAGONAL)).toBeCloseTo(38.97114317029975, 10);
});

test('no cell has these angles', () => {
  expect(() =>
    cellVolume({ a: 5, b: 5, c: 5, alpha: 20, beta: 20, gamma: 150 }),
  ).toThrow(/no cell has the angles/);
});

test('the metric tensor of a cubic cell is its edge squared on the diagonal', () => {
  const metric = metricTensor(CUBIC);
  expect(metric[0]?.[0]).toBe(16);
  expect(metric[1]?.[1]).toBe(16);
  expect(metric[0]?.[1] ?? 0).toBeCloseTo(0, 12);
  // a·b·cos 120° = −4.5 for the hexagonal cell.
  expect(metricTensor(HEXAGONAL)[0]?.[1] ?? 0).toBeCloseTo(-4.5, 12);
});

test('a lies along x and b lies in the xy plane', () => {
  const matrix = cartesianMatrix(HEXAGONAL);
  expect(matrix[0]?.[0]).toBe(3);
  expect(matrix[1]?.[0]).toBe(0);
  expect(matrix[2]?.[0]).toBe(0);
  expect(matrix[2]?.[1]).toBe(0);
  const lattice = createLattice(HEXAGONAL);
  const b = fractionalToCartesian(lattice, [0, 1, 0]);
  expect(b[0] ?? 0).toBeCloseTo(-1.5, 12);
  expect(b[1] ?? 0).toBeCloseTo(2.598076211353316, 12);
  expect(b[2] ?? 0).toBeCloseTo(0, 12);
});

test('a triclinic cell is self-consistent: G = MᵀM, V = sqrt(det G), G* = G⁻¹', () => {
  const lattice = createLattice(TRICLINIC);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) {
        sum +=
          (lattice.cartesian[k]?.[i] ?? 0) * (lattice.cartesian[k]?.[j] ?? 0);
      }
      expect(sum).toBeCloseTo(lattice.metric[i]?.[j] ?? 0, 10);
    }
  }
  const metric = lattice.metric;
  const determinant =
    (metric[0]?.[0] ?? 0) *
      ((metric[1]?.[1] ?? 0) * (metric[2]?.[2] ?? 0) -
        (metric[1]?.[2] ?? 0) ** 2) -
    (metric[0]?.[1] ?? 0) *
      ((metric[1]?.[0] ?? 0) * (metric[2]?.[2] ?? 0) -
        (metric[1]?.[2] ?? 0) * (metric[2]?.[0] ?? 0)) +
    (metric[0]?.[2] ?? 0) *
      ((metric[1]?.[0] ?? 0) * (metric[2]?.[1] ?? 0) -
        (metric[1]?.[1] ?? 0) * (metric[2]?.[0] ?? 0));
  expect(Math.sqrt(determinant)).toBeCloseTo(225.2199406520876, 9);
  const reciprocal = metricTensor(reciprocalCell(TRICLINIC));
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      expect(reciprocal[i]?.[j] ?? 0).toBeCloseTo(
        lattice.reciprocalMetric[i]?.[j] ?? 0,
        12,
      );
    }
  }
});

test('fractional and Cartesian are inverse, even in a triclinic cell', () => {
  const lattice = createLattice(TRICLINIC);
  const back = cartesianToFractional(
    lattice,
    fractionalToCartesian(lattice, [0.13, 0.57, 0.91]),
  );
  expect(back[0] ?? 0).toBeCloseTo(0.13, 12);
  expect(back[1] ?? 0).toBeCloseTo(0.57, 12);
  expect(back[2] ?? 0).toBeCloseTo(0.91, 12);
});

test('d-spacing of the cubic and hexagonal planes a student can check', () => {
  const cubic = createLattice(CUBIC);
  expect(dSpacing(cubic, 1, 0, 0)).toBeCloseTo(4, 12);
  expect(dSpacing(cubic, 1, 1, 0)).toBeCloseTo(2.8284271247461903, 12);
  expect(dSpacing(cubic, 1, 1, 1)).toBeCloseTo(2.3094010767585034, 12);
  const hexagonal = createLattice(HEXAGONAL);
  expect(dSpacing(hexagonal, 0, 0, 1)).toBeCloseTo(5, 12);
  expect(dSpacing(hexagonal, 1, 0, 0)).toBeCloseTo(2.598076211353316, 12);
});

test('a distance is taken as written, the minimum image over the cell edge', () => {
  const cubic = createLattice(CUBIC);
  expect(fractionalDistance(cubic, [0, 0, 0], [0.5, 0.5, 0.5])).toBeCloseTo(
    3.4641016151377544,
    12,
  );
  expect(minimumImageDistance(cubic, [0, 0, 0], [0.9, 0, 0])).toBeCloseTo(
    0.4,
    12,
  );
  expect(minimumImageDistance(cubic, [0, 0, 0], [0.5, 0.5, 0.5])).toBeCloseTo(
    3.4641016151377544,
    12,
  );
});

test('a strongly oblique cell needs the wider image search', () => {
  const oblique = createLattice({
    a: 5,
    b: 5,
    c: 20,
    alpha: 90,
    beta: 160,
    gamma: 90,
  });
  expect(
    minimumImageDistance(oblique, [0, 0, 0], [0.9, 0, 0.5], 1),
  ).toBeCloseTo(5.1849601458, 8);
  expect(
    minimumImageDistance(oblique, [0, 0, 0], [0.9, 0, 0.5], 2),
  ).toBeCloseTo(3.4217542359, 8);
  expect(
    minimumImageDistance(oblique, [0, 0, 0], [0.9, 0, 0.5], 3),
  ).toBeCloseTo(3.4217542359, 8);
});
