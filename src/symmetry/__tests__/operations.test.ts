import { expect, test } from 'vitest';

import {
  canonicalSense,
  composeOperations,
  identityOperation,
  improperOperation,
  inversionOperation,
  invertOperation,
  operationCycleLength,
  operationFromMatrix,
  reflectionOperation,
  rotationOperation,
  sameOperation,
} from '../operations.ts';
import { IDENTITY_MATRIX, matrixDeterminant } from '../point/mat3.ts';
import type { Vec3 } from '../point/vec3.ts';

const Z: Vec3 = [0, 0, 1];
const X: Vec3 = [1, 0, 0];

test('a rotation is proper and an improper rotation is not', () => {
  expect(matrixDeterminant(rotationOperation(Z, 3).matrix)).toBeCloseTo(1, 12);
  expect(matrixDeterminant(improperOperation(Z, 4).matrix)).toBeCloseTo(-1, 12);
  expect(matrixDeterminant(reflectionOperation(Z).matrix)).toBeCloseTo(-1, 12);
  expect(matrixDeterminant(inversionOperation().matrix)).toBeCloseTo(-1, 12);
});

test('an operation is labelled the way a chemist writes it', () => {
  expect(rotationOperation(Z, 3).label).toBe('C3');
  expect(rotationOperation(Z, 3, 2).label).toBe('C3^2');
  expect(rotationOperation(Z, 6, 5).label).toBe('C6^5');
  expect(improperOperation(Z, 4, 3).label).toBe('S4^3');
  expect(improperOperation(Z, 6).label).toBe('S6');
  expect(reflectionOperation(Z).label).toBe('σ');
  expect(inversionOperation().label).toBe('i');
  expect(identityOperation().label).toBe('E');
});

test('an improper power is odd, so σh·C3² is S3⁵ and never S3²', () => {
  const composed = composeOperations(
    reflectionOperation(Z),
    rotationOperation(Z, 3, 2),
  );
  expect(composed.label).toBe('S3^5');
  expect(composed.kind).toBe('Sn');
  expect(
    composeOperations(reflectionOperation(Z), rotationOperation(Z, 5, 2)).label,
  ).toBe('S5^7');
});

test('the order of an improper axis is n for even n and 2n for odd', () => {
  expect(operationCycleLength(improperOperation(Z, 4))).toBe(4);
  expect(operationCycleLength(improperOperation(Z, 6))).toBe(6);
  expect(operationCycleLength(improperOperation(Z, 3))).toBe(6);
  expect(operationCycleLength(improperOperation(Z, 5))).toBe(10);
  expect(operationCycleLength(rotationOperation(Z, 6))).toBe(6);
  expect(operationCycleLength(reflectionOperation(Z))).toBe(2);
  expect(operationCycleLength(inversionOperation())).toBe(2);
  expect(operationCycleLength(identityOperation())).toBe(1);
});

test('S2 is the inversion and S1 is a mirror plane', () => {
  expect(improperOperation(Z, 2).kind).toBe('i');
  expect(improperOperation(Z, 1).kind).toBe('sigma');
  expect(sameOperation(improperOperation(Z, 2), inversionOperation())).toBe(
    true,
  );
});

test('two mirrors at 60° generate a three-fold axis', () => {
  const first = reflectionOperation([0, 1, 0]);
  const second = reflectionOperation([
    Math.sin(Math.PI / 3),
    Math.cos(Math.PI / 3),
    0,
  ]);
  const product = composeOperations(first, second);
  expect(product.kind).toBe('Cn');
  expect(product.order).toBe(3);
});

test('i·C3 is S6⁵, the identity behind the Th convention', () => {
  const product = composeOperations(
    inversionOperation(),
    rotationOperation(Z, 3),
  );
  expect(product.label).toBe('S6^5');
  expect(
    composeOperations(inversionOperation(), rotationOperation(Z, 6)).label,
  ).toBe('S3^5');
  expect(
    composeOperations(inversionOperation(), rotationOperation(Z, 5)).label,
  ).toBe('S10^7');
});

test('an operation composed with its inverse is the identity', () => {
  for (const operation of [
    rotationOperation([1, 1, 1], 3),
    improperOperation(Z, 8, 3),
    reflectionOperation([1, -1, 0]),
    inversionOperation(),
  ]) {
    const product = composeOperations(operation, invertOperation(operation));
    expect(product.kind).toBe('E');
    expect(product.matrix).toStrictEqual(IDENTITY_MATRIX);
  }
});

test('an axis the caller names keeps its sense; one read off a matrix is canonical', () => {
  expect(canonicalSense([0, 0, -1])).toStrictEqual([-0, -0, 1]);
  expect(canonicalSense([0, 0, 1])).toStrictEqual([0, 0, 1]);
  const down = rotationOperation([0, 0, -1], 3);
  expect(down.axis).toStrictEqual([0, 0, -1]);
  expect(down.label).toBe('C3');
  // The same matrix, read back without being told which way the axis points.
  const read = operationFromMatrix(down.matrix);
  expect(read.axis).toStrictEqual([-0, -0, 1]);
  expect(read.label).toBe('C3^2');
});

test('a matrix that is no operation of a small axis is refused', () => {
  const tilted = rotationOperation(Z, 1, 0);
  expect(tilted.kind).toBe('E');
  expect(() =>
    operationFromMatrix(rotationOperation(Z, 11).matrix, { maxOrder: 8 }),
  ).toThrow('no axis of order 8 or less');
});

test('C2 about x is its own inverse and squares to the identity', () => {
  const half = rotationOperation(X, 2);
  expect(half.order).toBe(2);
  expect(composeOperations(half, half).kind).toBe('E');
  expect(sameOperation(half, invertOperation(half))).toBe(true);
});
