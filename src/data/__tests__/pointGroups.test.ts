import { expect, test } from 'vitest';

import {
  POINT_GROUPS,
  crystallographicPointGroups,
  finitePointGroups,
  laueClasses,
  parseClasses,
  pointGroupById,
  pointGroupBySlug,
} from '../pointGroups.ts';

test('the catalogue holds 53 groups, 51 of them finite', () => {
  expect(POINT_GROUPS).toHaveLength(53);
  expect(finitePointGroups()).toHaveLength(51);
  expect(POINT_GROUPS.filter((one) => one.order === Infinity)).toHaveLength(2);
});

test('every slug is lowercase ASCII and unique', () => {
  const slugs = POINT_GROUPS.map((one) => one.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+$/);
  expect(pointGroupBySlug('c2v')?.id).toBe('C2v');
  expect(pointGroupBySlug('cinfv')?.id).toBe('Cinfv');
  expect(pointGroupBySlug('dinfh')?.schoenflies).toBe('D∞h');
  expect(pointGroupBySlug('nothing')).toBeUndefined();
});

test('the class sizes of a group add up to its order', () => {
  for (const group of finitePointGroups()) {
    let sum = 0;
    for (const entry of group.classes) sum += entry.size;
    expect([group.id, sum]).toStrictEqual([group.id, group.order]);
  }
  expect(pointGroupById('Oh').classes).toHaveLength(10);
  expect(pointGroupById('Oh').order).toBe(48);
  expect(pointGroupById('Ih').order).toBe(120);
  expect(pointGroupById('D6d').order).toBe(24);
});

test('the chiral groups are exactly C1, Cn, Dn, T, O and I', () => {
  const chiral = POINT_GROUPS.filter((one) => one.chiral).map((one) => one.id);
  expect(chiral).toStrictEqual([
    'C1',
    'C2',
    'C3',
    'C4',
    'C5',
    'C6',
    'C7',
    'C8',
    'D2',
    'D3',
    'D4',
    'D5',
    'D6',
    'D7',
    'D8',
    'T',
    'O',
    'I',
  ]);
});

test('the polar groups are exactly C1, Cs, Cn, Cnv and C∞v', () => {
  const polar = POINT_GROUPS.filter((one) => one.polar).map((one) => one.id);
  expect(polar).toStrictEqual([
    'C1',
    'Cs',
    'C2',
    'C3',
    'C4',
    'C5',
    'C6',
    'C7',
    'C8',
    'C2v',
    'C3v',
    'C4v',
    'C5v',
    'C6v',
    'C7v',
    'C8v',
    'Cinfv',
  ]);
});

test('exactly 32 classes are crystallographic, split 2/3/3/7/5/7/5', () => {
  const crystallographic = crystallographicPointGroups();
  expect(crystallographic).toHaveLength(32);
  const systems = [
    'triclinic',
    'monoclinic',
    'orthorhombic',
    'tetragonal',
    'trigonal',
    'hexagonal',
    'cubic',
  ];
  const counts = systems.map((system) => [
    system,
    crystallographic.filter((one) => one.crystalSystem === system).length,
  ]);
  expect(counts).toStrictEqual([
    ['triclinic', 2],
    ['monoclinic', 3],
    ['orthorhombic', 3],
    ['tetragonal', 7],
    ['trigonal', 5],
    ['hexagonal', 7],
    ['cubic', 5],
  ]);
});

test('11 of the 32 are centrosymmetric, and they name the 11 Laue classes', () => {
  const crystallographic = crystallographicPointGroups();
  const centrosymmetric = crystallographic.filter((one) => one.centrosymmetric);
  expect(centrosymmetric).toHaveLength(11);
  const symbols = centrosymmetric.map((one) => one.hermannMauguin ?? '');
  expect(symbols.toSorted()).toStrictEqual(laueClasses().toSorted());
  expect(laueClasses().toSorted()).toStrictEqual([
    '-1',
    '-3',
    '-3m',
    '2/m',
    '4/m',
    '4/mmm',
    '6/m',
    '6/mmm',
    'm-3',
    'm-3m',
    'mmm',
  ]);
  expect(crystallographic.filter((one) => !one.centrosymmetric)).toHaveLength(
    21,
  );
});

test('the Hermann-Mauguin symbols that are easy to get wrong', () => {
  expect(pointGroupById('D3h').hermannMauguin).toBe('-6m2');
  expect(pointGroupById('Th').hermannMauguin).toBe('m-3');
  expect(pointGroupById('Oh').hermannMauguin).toBe('m-3m');
  expect(pointGroupById('Oh').hermannMauguinFull).toBe('4/m -3 2/m');
  expect(pointGroupById('S4').hermannMauguin).toBe('-4');
  expect(pointGroupById('S6').hermannMauguin).toBe('-3');
  expect(pointGroupById('C3h').hermannMauguin).toBe('-6');
  expect(pointGroupById('C5').hermannMauguin).toBeNull();
  expect(() => pointGroupById('C9')).toThrow('no point group C9');
});

test('a class header carries its own multiplicity', () => {
  expect(parseClasses('E 2C3 3σv')).toStrictEqual([
    { label: 'E', size: 1 },
    { label: '2C3', size: 2 },
    { label: '3σv', size: 3 },
  ]);
  expect(parseClasses('∞σv')).toStrictEqual([{ label: '∞σv', size: Infinity }]);
  expect(pointGroupById('Ih').classes[4]).toStrictEqual({
    label: '15C2',
    size: 15,
  });
});
