import { expect, test } from 'vitest';

import { perpendicularTo, planeFrame } from '../frame.ts';

test('a plane normal to z is spanned by x and y, in that order', () => {
  expect(planeFrame([0, 0, 2])).toStrictEqual({
    normal: [0, 0, 1],
    major: [1, 0, 0],
    minor: [0, 1, 0],
  });
});

test('a plane normal to x falls back to the y seed and is spanned by y and z', () => {
  expect(planeFrame([3, 0, 0])).toStrictEqual({
    normal: [1, 0, 0],
    major: [0, 1, 0],
    minor: [0, 0, 1],
  });
});

test('the frame is orthonormal and right-handed on an oblique normal', () => {
  const { normal, major, minor } = planeFrame([1, 2, -3]);
  expect(dot(normal, major)).toBeCloseTo(0, 12);
  expect(dot(normal, minor)).toBeCloseTo(0, 12);
  expect(dot(major, minor)).toBeCloseTo(0, 12);
  expect(dot(major, major)).toBeCloseTo(1, 12);
  // normal × major = minor, so major × minor = normal.
  const cross: [number, number, number] = [
    major[1] * minor[2] - major[2] * minor[1],
    major[2] * minor[0] - major[0] * minor[2],
    major[0] * minor[1] - major[1] * minor[0],
  ];
  expect(cross[0]).toBeCloseTo(normal[0], 12);
  expect(cross[1]).toBeCloseTo(normal[1], 12);
  expect(cross[2]).toBeCloseTo(normal[2], 12);
});

test('the same normal always gives the same frame, so a redraw does not spin a plane', () => {
  expect(planeFrame([1, 2, -3])).toStrictEqual(planeFrame([2, 4, -6]));
});

test('perpendicularTo([1,1,0]) is the in-plane diagonal, normalised', () => {
  const result = perpendicularTo([1, 1, 0]);
  expect(result[0]).toBeCloseTo(Math.SQRT1_2, 12);
  expect(result[1]).toBeCloseTo(-Math.SQRT1_2, 12);
  expect(result[2]).toBe(0);
});

test('a direction of no length has no perpendicular', () => {
  expect(() => perpendicularTo([0, 0, 0])).toThrow();
});

function dot(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
