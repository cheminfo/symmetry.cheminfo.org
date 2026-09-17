import { expect, test } from 'vitest';

import { symmetryElement } from '../elements.ts';
import { formatOperation } from '../formatOperation.ts';
import {
  greatestCommonDivisor,
  identityMatrix,
  matricesEqual,
  matrixAdjugate,
  matrixDeterminant,
  matrixOrder,
  matrixPowerSum,
  matrixTrace,
  multiplyMatrices,
  primitiveDirection,
} from '../integerMatrix.ts';
import { liftCell, liftOperation, projectOperation } from '../lift.ts';
import { parseOperation } from '../parseOperation.ts';

import { RAW_SETTINGS, p4gOperations } from './fixture.ts';

test('the determinant and trace of the rotations a crystal actually has', () => {
  // A 3-fold along [111], which is where a sign slip in the cyclic expansion hides.
  const threeFold = [
    [0, 0, 1],
    [1, 0, 0],
    [0, 1, 0],
  ];
  expect(matrixDeterminant(threeFold)).toBe(1);
  expect(matrixTrace(threeFold)).toBe(0);
  expect(matrixOrder(threeFold)).toBe(3);
  expect(matrixDeterminant(parseOperation('-x,-y,-z', 3).rotation)).toBe(-1);
  expect(matrixDeterminant(parseOperation('y,x,z', 3).rotation)).toBe(-1);
  expect(matrixDeterminant(parseOperation('-y,x-y,z', 3).rotation)).toBe(1);
  expect(matrixTrace(parseOperation('-y,x-y,z', 3).rotation)).toBe(0);
  expect(matrixDeterminant(parseOperation('-y,x', 2).rotation)).toBe(1);
  expect(matrixTrace(parseOperation('-y,x', 2).rotation)).toBe(0);
});

test('every one of the 7244 rotation parts is unimodular', () => {
  let checked = 0;
  for (const setting of RAW_SETTINGS) {
    for (const xyz of setting.equivalentArray) {
      expect(Math.abs(matrixDeterminant(parseOperation(xyz, 3).rotation))).toBe(
        1,
      );
      checked += 1;
    }
  }
  expect(checked).toBe(7244);
});

test('adjugate times matrix is the determinant times the identity, exactly', () => {
  for (const xyz of ['-y,x-y,z', 'y,x,-z', '-z,-x,y', '-x,-y,-z']) {
    const rotation = parseOperation(xyz, 3).rotation;
    const determinant = matrixDeterminant(rotation);
    const product = multiplyMatrices(matrixAdjugate(rotation), rotation);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(product[i]?.[j]).toBe(i === j ? determinant : 0);
      }
    }
  }
});

test('the power sum projects onto the axis of a rotation and the plane of a mirror', () => {
  const fourFold = parseOperation('-y,x,z', 3).rotation;
  expect(matrixPowerSum(fourFold, matrixOrder(fourFold))).toStrictEqual([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 4],
  ]);
  const mirror = parseOperation('x,y,-z', 3).rotation;
  expect(matrixPowerSum(mirror, 2)).toStrictEqual([
    [2, 0, 0],
    [0, 2, 0],
    [0, 0, 0],
  ]);
  expect(
    matricesEqual(matrixPowerSum(identityMatrix(3), 1), identityMatrix(3)),
  ).toBe(true);
});

test('a direction is reduced to its primitive form, with no negative zero', () => {
  expect(primitiveDirection([0, 0, -2])).toStrictEqual([0, 0, 1]);
  expect(primitiveDirection([-2, 2, 2])).toStrictEqual([1, -1, -1]);
  expect(primitiveDirection([4, 6, 0])).toStrictEqual([2, 3, 0]);
  expect(primitiveDirection([0, 0, 0])).toBeNull();
  expect(Object.is(primitiveDirection([-3, 0, 3])?.[1], 0)).toBe(true);
  expect(greatestCommonDivisor(12, -18)).toBe(6);
  expect(greatestCommonDivisor(0, 7)).toBe(7);
});

test('a matrix of infinite order is refused', () => {
  expect(() =>
    matrixOrder([
      [1, 1],
      [0, 1],
    ]),
  ).toThrow(/no crystallographic order/);
  expect(() => matrixDeterminant([[1]])).toThrow(
    /expected a 2×2 or 3×3 matrix/,
  );
});

test('a plane group lifts into three dimensions and comes back unchanged', () => {
  for (const operation of p4gOperations()) {
    const lifted = liftOperation(operation);
    expect(lifted.rotation[2]).toStrictEqual([0, 0, 1]);
    expect(lifted.translation[2]).toBe(0);
    expect(projectOperation(lifted)).toStrictEqual(operation);
  }
  expect(
    formatOperation(liftOperation(parseOperation('-x+1/2,y+1/2', 2))),
  ).toBe('-x+1/2,y+1/2,z');
  expect(() => projectOperation(parseOperation('-x,y,-z', 3))).toThrow(
    /not a lift/,
  );
});

test('a lifted plane group keeps its elements, now drawn as lines in a plane', () => {
  const glide = liftOperation(parseOperation('-x+1/2,y+1/2', 2));
  const flat = symmetryElement(parseOperation('-x+1/2,y+1/2', 2));
  const lifted = symmetryElement(glide);
  expect(flat.kind).toBe('glide');
  expect(lifted.kind).toBe('glide');
  expect(flat.intrinsic).toStrictEqual([0, 6]);
  expect(lifted.intrinsic).toStrictEqual([0, 6, 0]);
  expect(flat.normal).toStrictEqual([1, 0]);
  expect(lifted.normal).toStrictEqual([1, 0, 0]);
});

test('the plane cell becomes a unit cell one angstrom deep', () => {
  expect(liftCell({ a: 4, b: 4, gamma: 120 })).toStrictEqual({
    a: 4,
    b: 4,
    c: 1,
    alpha: 90,
    beta: 90,
    gamma: 120,
  });
});
