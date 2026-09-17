import { expect, test } from 'vitest';

import { distinctRotations } from '../group.ts';
import { orbit } from '../operation.ts';
import { parseOperation } from '../parseOperation.ts';
import { pointGroupName, pointGroupSignature } from '../pointGroupName.ts';
import { fixes, siteSymmetry } from '../siteSymmetry.ts';

import { RAW_SETTINGS, p4gOperations, settingOperations } from './fixture.ts';

test('Fm-3m: the origin is four atoms on m-3m, a general position is 192 on nothing', () => {
  const faceCentred = settingOperations(225);
  expect(faceCentred).toHaveLength(192);
  const origin = siteSymmetry([0, 0, 0], faceCentred);
  expect(origin.order).toBe(48);
  expect(origin.multiplicity).toBe(4);
  expect(origin.symbol).toBe('m-3m');
  expect(origin.general).toBe(false);
  const general = siteSymmetry([0.123, 0.234, 0.345], faceCentred);
  expect(general.order).toBe(1);
  expect(general.multiplicity).toBe(192);
  expect(general.symbol).toBe('1');
  expect(general.general).toBe(true);
});

test('Fm-3m: the special positions a chemist puts an atom on', () => {
  const faceCentred = settingOperations(225);
  const at = (position: number[]) => {
    const site = siteSymmetry(position, faceCentred);
    return `${site.multiplicity} ${site.symbol}`;
  };
  // The rock-salt cation and anion, the fluorite anion, and the octahedral edge.
  expect(at([0, 0, 0])).toBe('4 m-3m');
  expect(at([0.5, 0, 0])).toBe('4 m-3m');
  expect(at([0.25, 0.25, 0.25])).toBe('8 -43m');
  expect(at([0.3, 0, 0])).toBe('24 4mm');
});

test('the multiplicity is the orbit, on every special position of three groups', () => {
  for (const [number, positions] of [
    [
      14,
      [
        [0, 0, 0],
        [0, 0.25, 0.25],
        [0.1, 0.2, 0.3],
      ],
    ],
    [
      62,
      [
        [0, 0, 0],
        [0.1, 0.25, 0.3],
        [0.1, 0.2, 0.3],
      ],
    ],
    [
      225,
      [
        [0, 0, 0],
        [0.25, 0.25, 0.25],
        [0.3, 0, 0],
        [0.123, 0.234, 0.345],
      ],
    ],
  ] as Array<[number, number[][]]>) {
    const operations = settingOperations(number);
    for (const position of positions) {
      expect(siteSymmetry(position, operations).multiplicity).toBe(
        orbit(position, operations).length,
      );
    }
  }
});

test('P2_1/c and Pnma: the inversion centre, the mirror and the general position', () => {
  const monoclinic = settingOperations(14);
  expect(siteSymmetry([0, 0, 0], monoclinic).symbol).toBe('-1');
  expect(siteSymmetry([0, 0, 0], monoclinic).multiplicity).toBe(2);
  expect(siteSymmetry([0.1, 0.2, 0.3], monoclinic).multiplicity).toBe(4);
  const orthorhombic = settingOperations(62);
  expect(siteSymmetry([0, 0, 0], orthorhombic).symbol).toBe('-1');
  expect(siteSymmetry([0.1, 0.25, 0.3], orthorhombic).symbol).toBe('m');
  expect(siteSymmetry([0.1, 0.25, 0.3], orthorhombic).multiplicity).toBe(4);
  expect(siteSymmetry([0.1, 0.2, 0.3], orthorhombic).multiplicity).toBe(8);
});

test('p4g in two dimensions: the 4-fold sits on no mirror', () => {
  const p4g = p4gOperations();
  expect(siteSymmetry([0, 0], p4g)).toStrictEqual({
    order: 4,
    multiplicity: 2,
    symbol: '4',
    stabiliser: [0, 1, 2, 3],
    general: false,
  });
  expect(siteSymmetry([0.5, 0], p4g).symbol).toBe('2mm');
  expect(siteSymmetry([0.25, 0.25], p4g).symbol).toBe('m');
  expect(siteSymmetry([0.25, 0.25], p4g).multiplicity).toBe(4);
  expect(siteSymmetry([0.1, 0.2], p4g).multiplicity).toBe(8);
});

test('an operation fixes a position modulo a lattice translation, not exactly', () => {
  const centring = parseOperation('x+1/2,y+1/2,z', 3);
  expect(fixes(centring, [0, 0, 0])).toBe(false);
  expect(fixes(parseOperation('-x,-y,-z', 3), [0.5, 0, 0])).toBe(true);
  expect(fixes(parseOperation('-x,-y,-z', 3), [0.3, 0, 0])).toBe(false);
});

test('the 230 space groups fall into exactly the 32 crystal classes', () => {
  const names = new Map<number, string>();
  for (const setting of RAW_SETTINGS) {
    if (names.has(setting.spaceGroup)) continue;
    const rotations = distinctRotations(
      setting.equivalentArray.map((xyz) => parseOperation(xyz, 3)),
    );
    names.set(setting.spaceGroup, pointGroupName(rotations, 3));
  }
  expect(names.size).toBe(230);
  expect(new Set(names.values()).size).toBe(32);
  expect(names.get(1)).toBe('1');
  expect(names.get(2)).toBe('-1');
  expect(names.get(14)).toBe('2/m');
  expect(names.get(19)).toBe('222');
  expect(names.get(62)).toBe('mmm');
  expect(names.get(143)).toBe('3');
  expect(names.get(186)).toBe('6mm');
  expect(names.get(195)).toBe('23');
  expect(names.get(225)).toBe('m-3m');
});

test('a two-dimensional point group is named from the same signature', () => {
  expect(pointGroupName(distinctRotations(p4gOperations()), 2)).toBe('4mm');
  expect(pointGroupSignature(distinctRotations(p4gOperations()), 2)).toBe(
    '1,1,0,2,0,4',
  );
  expect(pointGroupName(distinctRotations(settingOperations(225)), 3)).toBe(
    'm-3m',
  );
});

test('a set of rotations that is no crystallographic point group is refused', () => {
  expect(() =>
    pointGroupName([parseOperation('-x,y,z', 3).rotation], 3),
  ).toThrow(/no crystallographic point group/);
});
