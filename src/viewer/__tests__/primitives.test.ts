import { expect, test } from 'vitest';

import {
  DEFAULT_ELEMENT_STYLE,
  primitivePoints,
  resolveElementStyle,
} from '../primitives.ts';

test('an override replaces one field and leaves the rest at their defaults', () => {
  expect(resolveElementStyle({ axisRadius: 1 })).toStrictEqual({
    ...DEFAULT_ELEMENT_STYLE,
    axisRadius: 1,
  });
});

test('no overrides at all gives the defaults', () => {
  expect(resolveElementStyle()).toStrictEqual(DEFAULT_ELEMENT_STYLE);
});

test('a rod reaches its two ends', () => {
  expect(
    primitivePoints({
      shape: 'rod',
      start: [0, 0, -1],
      end: [0, 0, 1],
      radius: 0.1,
    }),
  ).toStrictEqual([
    [0, 0, -1],
    [0, 0, 1],
  ]);
});

test('a cone reaches its base and its tip', () => {
  expect(
    primitivePoints({
      shape: 'cone',
      base: [0, 0, 0],
      tip: [0, 0, 1],
      radius: 0.2,
    }),
  ).toStrictEqual([
    [0, 0, 0],
    [0, 0, 1],
  ]);
});

test('a ball reaches its radius along every axis', () => {
  expect(
    primitivePoints({ shape: 'sphere', centre: [1, 1, 1], radius: 2 }),
  ).toStrictEqual([
    [-1, 1, 1],
    [3, 1, 1],
    [1, -1, 1],
    [1, 3, 1],
    [1, 1, -1],
    [1, 1, 3],
  ]);
});

test('a square reaches its four corners', () => {
  expect(
    primitivePoints({
      shape: 'plate',
      centre: [0, 0, 5],
      major: [1, 0, 0],
      minor: [0, 1, 0],
      size: 4,
    }),
  ).toStrictEqual([
    [-2, -2, 5],
    [-2, 2, 5],
    [2, -2, 5],
    [2, 2, 5],
  ]);
});
