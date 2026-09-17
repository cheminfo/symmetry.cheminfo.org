import { expect, test } from 'vitest';

import {
  boundingSphereOf,
  framedRadius,
  primitivesExtent,
  unionSpheres,
} from '../framing.ts';
import type { MeshPrimitive } from '../primitives.ts';

test('two points give the ball about their midpoint', () => {
  expect(
    boundingSphereOf([
      [-2, 0, 0],
      [2, 0, 0],
    ]),
  ).toStrictEqual({ centre: [0, 0, 0], radius: 2 });
});

test('the padding is added to the radius, for the balls drawn on the atoms', () => {
  expect(boundingSphereOf([[0, 0, 0]], 0.5)).toStrictEqual({
    centre: [0, 0, 0],
    radius: 0.5,
  });
});

test('nothing on screen is a point at the origin', () => {
  expect(boundingSphereOf([])).toStrictEqual({ centre: [0, 0, 0], radius: 0 });
});

test('the union holds every sphere it was given', () => {
  const union = unionSpheres([
    { centre: [0, 0, 0], radius: 1 },
    { centre: [10, 0, 0], radius: 2 },
  ]);
  expect(union.centre).toStrictEqual([5, 0, 0]);
  expect(union.radius).toBe(7);
});

test('a union of one is that one, and a union of none is a point', () => {
  const only = { centre: [1, 2, 3] as const, radius: 4 };
  expect(unionSpheres([only])).toBe(only);
  expect(unionSpheres([])).toStrictEqual({ centre: [0, 0, 0], radius: 0 });
});

test('the drawn shapes are measured at their corners, not at their centres', () => {
  const primitives: MeshPrimitive[] = [
    {
      shape: 'plate',
      centre: [0, 0, 0],
      major: [1, 0, 0],
      minor: [0, 1, 0],
      size: 4,
    },
  ];
  const extent = primitivesExtent(primitives);
  expect(extent.centre).toStrictEqual([0, 0, 0]);
  expect(extent.radius).toBeCloseTo(Math.hypot(2, 2), 12);
});

test('a ball is measured by its own radius, not by its centre alone', () => {
  expect(
    primitivesExtent([{ shape: 'sphere', centre: [0, 0, 0], radius: 3 }])
      .radius,
  ).toBe(3);
});

test('the framed radius leaves a margin and never frames tighter than the minimum', () => {
  expect(framedRadius(10, 0.1)).toBeCloseTo(11, 12);
  expect(framedRadius(0.01)).toBe(0.5);
});
