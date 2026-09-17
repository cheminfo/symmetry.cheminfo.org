import { expect, test } from 'vitest';

import type { Matrix4 } from '../operationMatrix.ts';
import {
  IDENTITY_MATRIX4,
  ROTATION_PHASE,
  operationAt,
  operationIsRigid,
  operationMatrix,
} from '../operationMatrix.ts';
import type { Point3, ViewerOperation } from '../types.ts';

const Z_AXIS: Point3 = [0, 0, 1];
const ORIGIN: Point3 = [0, 0, 0];

test('the identity is the matrix that moves nothing', () => {
  expect([...IDENTITY_MATRIX4]).toStrictEqual([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
  ]);
});

test('a C4 about z is the quarter turn, written column-major', () => {
  const matrix = operationMatrix({
    kind: 'rotation',
    axis: Z_AXIS,
    origin: ORIGIN,
    order: 4,
  });
  expectMatrix(matrix, [0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
});

test('a C3 about z carries (1,0,0) onto (−½, √3/2, 0)', () => {
  const operation: ViewerOperation = {
    kind: 'rotation',
    axis: Z_AXIS,
    origin: ORIGIN,
    order: 3,
  };
  expectPoint(apply(operationMatrix(operation), [1, 0, 0]), [
    -0.5,
    Math.sqrt(3) / 2,
    0,
  ]);
});

test('C3² is two thirds of a turn, not a third', () => {
  const squared = operationMatrix({
    kind: 'rotation',
    axis: Z_AXIS,
    origin: ORIGIN,
    order: 3,
    power: 2,
  });
  expectPoint(apply(squared, [1, 0, 0]), [-0.5, -Math.sqrt(3) / 2, 0]);
});

test('three C3 turns bring every point home, which is what the animation shows', () => {
  const operation: ViewerOperation = {
    kind: 'rotation',
    axis: [1, 1, 1],
    origin: ORIGIN,
    order: 3,
  };
  const matrix = operationMatrix(operation);
  const once = apply(matrix, [1, 0, 0]);
  const twice = apply(matrix, once);
  expectPoint(apply(matrix, twice), [1, 0, 0]);
});

test('a rotation about an axis off the origin keeps that axis fixed', () => {
  const matrix = operationMatrix({
    kind: 'rotation',
    axis: Z_AXIS,
    origin: [2, 3, 0],
    order: 2,
  });
  expectPoint(apply(matrix, [2, 3, 5]), [2, 3, 5]);
  expectPoint(apply(matrix, [3, 3, 0]), [1, 3, 0]);
});

test('a rotation is rigid at every fraction: it never changes a length', () => {
  const operation: ViewerOperation = {
    kind: 'rotation',
    axis: [0, 1, 1],
    origin: ORIGIN,
    order: 5,
  };
  for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
    const moved = apply(operationAt(operation, fraction), [1, 2, 3]);
    expect(Math.hypot(moved[0], moved[1], moved[2])).toBeCloseTo(
      Math.hypot(1, 2, 3),
      10,
    );
  }
});

test('a screw turns and travels together: half way is half of both', () => {
  const operation: ViewerOperation = {
    kind: 'screw',
    axis: Z_AXIS,
    origin: ORIGIN,
    order: 2,
    translation: [0, 0, 3],
  };
  expectPoint(apply(operationMatrix(operation), [1, 0, 0]), [-1, 0, 3]);
  expectPoint(apply(operationAt(operation, 0.5), [1, 0, 0]), [0, 1, 1.5]);
});

test('a mirror reflects at the end and flattens onto the plane half way', () => {
  const operation: ViewerOperation = {
    kind: 'mirror',
    normal: Z_AXIS,
    point: [0, 0, 1],
  };
  expectPoint(apply(operationMatrix(operation), [1, 2, 3]), [1, 2, -1]);
  expectPoint(apply(operationAt(operation, 0.5), [1, 2, 3]), [1, 2, 1]);
});

test('an inversion collapses through its centre and comes out the other side', () => {
  const operation: ViewerOperation = { kind: 'inversion', centre: [1, 1, 1] };
  expectPoint(apply(operationMatrix(operation), [3, 1, 1]), [-1, 1, 1]);
  expectPoint(apply(operationAt(operation, 0.5), [3, 1, 1]), [1, 1, 1]);
});

test('a glide reflects and translates, and its translation grows with the fraction', () => {
  const operation: ViewerOperation = {
    kind: 'glide',
    normal: Z_AXIS,
    point: ORIGIN,
    translation: [2, 0, 0],
  };
  expectPoint(apply(operationMatrix(operation), [0, 0, 1]), [2, 0, -1]);
  expectPoint(apply(operationAt(operation, 0.5), [0, 0, 1]), [1, 0, 0]);
});

test('S4 about z is a quarter turn followed by a reflection in the xy plane', () => {
  const operation: ViewerOperation = {
    kind: 'improperRotation',
    axis: Z_AXIS,
    origin: ORIGIN,
    order: 4,
  };
  expectPoint(apply(operationMatrix(operation), [1, 0, 1]), [0, 1, -1]);
  // The turn finishes before the reflection starts, so the point is still up.
  expectPoint(
    apply(operationAt(operation, ROTATION_PHASE), [1, 0, 1]),
    [0, 1, 1],
  );
});

test('-4 about z turns a quarter and then inverts through the origin', () => {
  const operation: ViewerOperation = {
    kind: 'rotoinversion',
    axis: Z_AXIS,
    origin: ORIGIN,
    order: 4,
  };
  expectPoint(apply(operationMatrix(operation), [1, 0, 1]), [0, -1, -1]);
  expectPoint(
    apply(operationAt(operation, ROTATION_PHASE), [1, 0, 1]),
    [0, 1, 1],
  );
});

test('every operation starts at the identity, and a fraction outside 0..1 is clamped', () => {
  const operations: ViewerOperation[] = [
    { kind: 'rotation', axis: Z_AXIS, origin: ORIGIN, order: 6 },
    {
      kind: 'screw',
      axis: Z_AXIS,
      origin: ORIGIN,
      order: 2,
      translation: [0, 0, 1],
    },
    { kind: 'mirror', normal: Z_AXIS, point: ORIGIN },
    { kind: 'glide', normal: Z_AXIS, point: ORIGIN, translation: [1, 0, 0] },
    { kind: 'inversion', centre: ORIGIN },
    { kind: 'improperRotation', axis: Z_AXIS, origin: ORIGIN, order: 4 },
    { kind: 'rotoinversion', axis: Z_AXIS, origin: ORIGIN, order: 4 },
  ];
  for (const operation of operations) {
    expectMatrix(operationAt(operation, 0), [...IDENTITY_MATRIX4]);
    expectMatrix(operationAt(operation, -3), [...IDENTITY_MATRIX4]);
    expectMatrix(operationAt(operation, 7), [...operationMatrix(operation)]);
  }
});

test('only a proper rotation and a screw have a rigid path from the identity', () => {
  expect(
    operationIsRigid({
      kind: 'rotation',
      axis: Z_AXIS,
      origin: ORIGIN,
      order: 3,
    }),
  ).toBe(true);
  expect(
    operationIsRigid({
      kind: 'screw',
      axis: Z_AXIS,
      origin: ORIGIN,
      order: 2,
      translation: [0, 0, 1],
    }),
  ).toBe(true);
  expect(operationIsRigid({ kind: 'inversion', centre: ORIGIN })).toBe(false);
  expect(
    operationIsRigid({ kind: 'mirror', normal: Z_AXIS, point: ORIGIN }),
  ).toBe(false);
});

/** `matrix · point`, reading the sixteen numbers as column-major. */
function apply(matrix: Matrix4, point: Point3): Point3 {
  const image: [number, number, number] = [0, 0, 0];
  for (let row = 0; row < 3; row++) {
    image[row] =
      (matrix[row] ?? 0) * point[0] +
      (matrix[4 + row] ?? 0) * point[1] +
      (matrix[8 + row] ?? 0) * point[2] +
      (matrix[12 + row] ?? 0);
  }
  return image;
}

function expectMatrix(actual: Matrix4, expected: readonly number[]): void {
  expect(actual).toHaveLength(16);
  for (let index = 0; index < 16; index++) {
    expect(actual[index] ?? Number.NaN).toBeCloseTo(expected[index] ?? 0, 12);
  }
}

function expectPoint(actual: Point3, expected: readonly number[]): void {
  for (let index = 0; index < 3; index++) {
    expect(actual[index]).toBeCloseTo(expected[index] ?? 0, 10);
  }
}
