import { expect, test } from 'vitest';

import type { SymmetryElement } from '../elements.ts';
import {
  elementPoint,
  symmetryElement,
  symmetryElements,
} from '../elements.ts';
import { parseOperation } from '../parseOperation.ts';

import { p4gOperations, settingOperations } from './fixture.ts';

/** The distinct symbols of a set of elements, sorted. */
function symbolsOf(elements: SymmetryElement[]): string[] {
  return [...new Set(elements.map((element) => element.symbol))].toSorted();
}

/** Where every inversion centre of a set of elements sits. */
function centresOf(elements: SymmetryElement[]): string[] {
  return elements
    .filter((element) => element.kind === 'inversion')
    .map((element) => elementPoint(element).join(','));
}

/** `kind symbol at point`, for a rotation point, an axis, an inversion centre. */
function describe(element: SymmetryElement): string {
  return `${element.kind} ${element.symbol} at ${elementPoint(element).join(',')}`;
}

/** `kind symbol (hkl)=offset glide`, for a mirror or a glide. */
function describeLine(element: SymmetryElement): string {
  const point = elementPoint(element);
  const normal = element.normal ?? [];
  let offset = 0;
  for (let index = 0; index < normal.length; index++) {
    offset += (normal[index] ?? 0) * (point[index] ?? 0);
  }
  return `${element.kind} ${element.symbol} (${normal.join(',')})=${offset} glide ${element.intrinsic.join(',')}`;
}

test('P2_1/c: a 2_1 along b through (0,y,1/4), a centre at the origin, a c glide at y=1/4', () => {
  const elements = symmetryElements(settingOperations(14));
  expect(elements).toHaveLength(4);
  expect(elements.map((element) => describe(element))).toStrictEqual([
    'identity 1 at 0,0,0',
    'screw 2_1 at 0,0,0.25',
    'inversion -1 at 0,0,0',
    'glide c at 0,0.25,0',
  ]);
  expect(elements[1]?.axis).toStrictEqual([0, 1, 0]);
  expect(elements[1]?.intrinsic).toStrictEqual([0, 6, 0]);
  expect(elements[3]?.normal).toStrictEqual([0, 1, 0]);
  expect(elements[3]?.intrinsic).toStrictEqual([0, 0, 6]);
  expect(elements[3]?.span).toStrictEqual([
    [1, 0, 0],
    [0, 0, 1],
  ]);
});

test('Pnma: three 2_1 screws, a centre, and the a, m and n planes at a quarter', () => {
  const elements = symmetryElements(settingOperations(62));
  expect(elements).toHaveLength(8);
  expect(elements.map((element) => describe(element))).toStrictEqual([
    'identity 1 at 0,0,0',
    'screw 2_1 at 0.25,0,0',
    'screw 2_1 at 0,0,0',
    'screw 2_1 at 0,0.25,0.25',
    'inversion -1 at 0,0,0',
    'glide a at 0,0,0.25',
    'mirror m at 0,0.25,0',
    'glide n at 0.25,0,0',
  ]);
  expect(elements.map((element) => element.axis)).toStrictEqual([
    null,
    [0, 0, 1],
    [0, 1, 0],
    [1, 0, 0],
    null,
    null,
    null,
    null,
  ]);
  expect(elements[7]?.intrinsic).toStrictEqual([0, 6, 6]);
});

test('Fd-3m: the two origin choices are the same group seen from two points', () => {
  const origin2 = symmetryElements(settingOperations(227, 0));
  const origin1 = symmetryElements(settingOperations(227, 1));
  expect(origin2).toHaveLength(157);
  expect(origin1).toHaveLength(157);
  expect(symbolsOf(origin2)).toStrictEqual([
    '-1',
    '-3',
    '-4',
    '1',
    '2',
    '2_1',
    '3',
    '3_1',
    '3_2',
    '4_1',
    '4_3',
    'd',
    'm',
    't(0,1/2,1/2)',
    't(1/2,0,1/2)',
    't(1/2,1/2,0)',
  ]);
  expect(symbolsOf(origin1)).toStrictEqual(symbolsOf(origin2));
  expect(centresOf(origin2)).toStrictEqual([
    '0,0,0',
    '0,0.25,0.25',
    '0.25,0,0.25',
    '0.25,0.25,0',
  ]);
  expect(centresOf(origin1)).toStrictEqual([
    '0.125,0.125,0.125',
    '0.125,0.375,0.375',
    '0.375,0.125,0.375',
    '0.375,0.375,0.125',
  ]);
});

test('p4g: four mirrors on the diagonals, glides at the quarters, no 4-fold on a mirror', () => {
  const elements = symmetryElements(p4gOperations(), [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ]);
  const lines = [
    ...new Set(
      elements
        .filter((element) => element.normal !== null)
        .map((element) => describeLine(element)),
    ),
  ].toSorted();
  expect(lines).toStrictEqual([
    'glide g (0,1)=0.25 glide 6,0',
    'glide g (0,1)=0.75 glide 6,0',
    'glide g (1,-1)=0 glide 6,6',
    'glide g (1,0)=0.25 glide 0,6',
    'glide g (1,0)=0.75 glide 0,6',
    'glide g (1,1)=1 glide 6,-6',
    'mirror m (1,-1)=-0.5 glide 0,0',
    'mirror m (1,-1)=0.5 glide 0,0',
    'mirror m (1,1)=0.5 glide 0,0',
    'mirror m (1,1)=1.5 glide 0,0',
  ]);
  const rotations = [
    ...new Set(
      elements
        .filter((element) => element.kind === 'rotation')
        .map(
          (element) =>
            `${element.symbol} at ${elementPoint(element).join(',')}`,
        ),
    ),
  ].toSorted();
  expect(rotations).toStrictEqual([
    '2 at 0,0',
    '2 at 0,0.5',
    '2 at 0.5,0',
    '2 at 0.5,0.5',
    '4 at -0.5,0.5',
    '4 at 0,0',
    '4 at 0,1',
    '4 at 0.5,-0.5',
    '4 at 0.5,0.5',
    '4 at 1,0',
  ]);
  // In two dimensions there is no screw axis and no inversion centre: −I is the 2-fold.
  expect(elements.filter((element) => element.kind === 'screw')).toStrictEqual(
    [],
  );
  expect(
    elements.filter((element) => element.kind === 'inversion'),
  ).toStrictEqual([]);
});

test('a centred lattice measures its screws and glides against its own translations', () => {
  // Taken against the cell edge, the 3-fold of a body-centred cubic group has a
  // pitch of a sixth, which is no screw at all; against the centring vector it is
  // the 3_2 the International Tables print.
  const threeFold = parseOperation('-z,-x+1/2,y', 3);
  expect(() => symmetryElement(threeFold)).toThrow(/no screw of order 3/);
  expect(
    symmetryElement(threeFold, [
      [0, 0, 0],
      [6, 6, 6],
    ]).symbol,
  ).toBe('3_2');

  // And the C-centred plane whose operation carries (a+b)/2 is a mirror, not an
  // n glide: that translation is a lattice translation of its own lattice.
  const plane = parseOperation('x+1/2,y+1/2,-z', 3);
  expect(symmetryElement(plane).symbol).toBe('n');
  expect(
    symmetryElement(plane, [
      [0, 0, 0],
      [6, 6, 0],
    ]).kind,
  ).toBe('mirror');
});

test('the classification refuses a matrix no crystallographic group has', () => {
  const shear = {
    dimension: 3 as const,
    rotation: [[1, 1, 0] as const, [0, 1, 0] as const, [0, 0, 1] as const],
    translation: [0, 0, 0],
  };
  expect(() => symmetryElement(shear)).toThrow(/W\^k ≠ I/);
  expect(() => symmetryElement(parseOperation('x,y,z', 3))).not.toThrow();
});
