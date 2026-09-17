import { expect, test } from 'vitest';

import { formatOperation } from '../formatOperation.ts';
import { parseOperation } from '../parseOperation.ts';

test('the identity of three dimensions', () => {
  expect(parseOperation('x,y,z', 3)).toStrictEqual({
    dimension: 3,
    rotation: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    translation: [0, 0, 0],
  });
});

test('a translation is counted in twelfths', () => {
  expect(parseOperation('-x+1/2,-y,z+1/2', 3).translation).toStrictEqual([
    6, 0, 6,
  ]);
  expect(parseOperation('x+1/3,y+2/3,z+1/6', 3).translation).toStrictEqual([
    4, 8, 2,
  ]);
  expect(parseOperation('x+3/4,y+1/4,z+5/6', 3).translation).toStrictEqual([
    9, 3, 10,
  ]);
});

test('the two-variable components of a trigonal setting', () => {
  expect(parseOperation('-x+y+2/3,-x+1/3,z+1/3', 3)).toStrictEqual({
    dimension: 3,
    rotation: [
      [-1, 1, 0],
      [-1, 0, 0],
      [0, 0, 1],
    ],
    translation: [8, 4, 4],
  });
  expect(parseOperation('x-y,x,z', 3).rotation).toStrictEqual([
    [1, -1, 0],
    [1, 0, 0],
    [0, 0, 1],
  ]);
});

test('a plane group is two components', () => {
  expect(parseOperation('-y+1/2,-x+1/2', 2)).toStrictEqual({
    dimension: 2,
    rotation: [
      [0, -1],
      [-1, 0],
    ],
    translation: [6, 6],
  });
});

test('the forms a CIF may carry all mean the same operation', () => {
  const canonical = formatOperation(parseOperation('-x+1/2,y,-z+1/2', 3));
  expect(canonical).toBe('-x+1/2,y,-z+1/2');
  for (const variant of [
    '1/2-x, y, 1/2-z',
    '  -X + 1/2 ,  +Y ,  -Z + 1/2  ',
    '0.5-x,y,0.5-z',
    '-x+1/2,y+1,-z+3/2',
    '-x-1/2,y,-z-1/2',
  ]) {
    expect(formatOperation(parseOperation(variant, 3))).toBe(canonical);
  }
});

test('a decimal third is snapped to a twelfth, a decimal that is not is refused', () => {
  expect(parseOperation('x+0.33333,y,z', 3).translation).toStrictEqual([
    4, 0, 0,
  ]);
  expect(() => parseOperation('x+0.4,y,z', 3)).toThrow(
    /not a multiple of 1\/12/,
  );
});

test('a malformed triplet is refused rather than half read', () => {
  expect(() => parseOperation('x,y', 3)).toThrow(/expected 3 components/);
  expect(() => parseOperation('x,y,z,x', 3)).toThrow(/expected 3 components/);
  expect(() => parseOperation('x,x,z', 3)).toThrow(/determinant is 0/);
  expect(() => parseOperation('2x,y,z', 3)).toThrow(/coefficient 2/);
  expect(() => parseOperation('x+x,y,z', 3)).toThrow(/coefficient 2/);
  expect(() => parseOperation('x,y,z', 2)).toThrow(/expected 2 components/);
  expect(() => parseOperation('x,z', 2)).toThrow(/names the axis z/);
  expect(() => parseOperation('x,,z', 3)).toThrow(/empty component/);
  expect(() => parseOperation('x,y 1/2,z', 3)).toThrow(/missing a sign/);
  expect(() => parseOperation('x,y+1/0,z', 3)).toThrow(/unusable denominator/);
});
