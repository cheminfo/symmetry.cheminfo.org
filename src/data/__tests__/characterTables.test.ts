import { expect, test } from 'vitest';

import {
  firstOrthogonality,
  groupOrderOf,
  secondOrthogonality,
} from '../../symmetry/characterTables.ts';
import type { Character, CharacterTable } from '../characterTables.ts';
import { CHARACTER_TABLES, realPart } from '../characterTables.ts';
import { POINT_GROUPS, pointGroupById } from '../pointGroups.ts';

/**
 * The checks of `verify.mjs`, run on **every** table including the twelve whose
 * `E` is a complex pair. The report's script fails those eleven of its own
 * tables because it encodes them in the combined real form, which has fewer rows
 * than classes and whose squared dimensions do not add to |G|. The pair is the
 * table; the combined row is display.
 */
const TABLES = CHARACTER_TABLES;

test('41 of the 53 groups ship a table, and the twelve that do not are named', () => {
  expect(TABLES).toHaveLength(41);
  const groups = new Set(TABLES.map((table) => table.group));
  expect(groups.size).toBe(41);
  // The two linear groups have infinitely many irreps and a continuum for a
  // class, so no finite table exists. The other ten are non-crystallographic
  // orders a course does not reach; `characterTableOf` returns undefined and
  // `requireCharacterTable` throws by name, which a page must handle.
  expect(
    POINT_GROUPS.filter((group) => !groups.has(group.id)).map(
      (group) => group.id,
    ),
  ).toStrictEqual([
    'C7',
    'C8',
    'C7v',
    'C8v',
    'C5h',
    'D7',
    'D8',
    'D7h',
    'D8h',
    'D6d',
    'Cinfv',
    'Dinfh',
  ]);
});

test('every table has one irrep per class and one character per class', () => {
  for (const table of TABLES) {
    expect(table.classSizes).toHaveLength(table.classes.length);
    expect(table.irreps).toHaveLength(table.classes.length);
    for (const irrep of table.irreps) {
      expect(irrep.characters).toHaveLength(table.classes.length);
      expect(realPart(irrep.characters[0] as Character)).toBe(irrep.dimension);
    }
  }
});

test('the classes of a table are the classes of its point group', () => {
  for (const table of TABLES) {
    const group = pointGroupById(table.group);
    expect(table.classes).toStrictEqual(group.classes.map((one) => one.label));
    expect(groupOrderOf(table)).toBe(group.order);
  }
});

test('the squared dimensions add to the order of the group', () => {
  for (const table of TABLES) {
    let sum = 0;
    for (const irrep of table.irreps) sum += irrep.dimension * irrep.dimension;
    expect([table.group, sum]).toStrictEqual([
      table.group,
      groupOrderOf(table),
    ]);
  }
});

test('the first orthogonality relation holds for every pair of irreps', () => {
  for (const table of TABLES) {
    for (let i = 0; i < table.irreps.length; i++) {
      for (let j = 0; j < table.irreps.length; j++) {
        const product = firstOrthogonality(table, i, j);
        expect(product.re).toBeCloseTo(i === j ? 1 : 0, 9);
        expect(product.im).toBeCloseTo(0, 9);
      }
    }
  }
});

test('the second orthogonality relation holds for every pair of classes', () => {
  for (const table of TABLES) {
    const order = groupOrderOf(table);
    for (let c = 0; c < table.classes.length; c++) {
      for (let d = 0; d < table.classes.length; d++) {
        const product = secondOrthogonality(table, c, d);
        const size = table.classSizes[c] as number;
        expect(product.re).toBeCloseTo(c === d ? order / size : 0, 9);
        expect(product.im).toBeCloseTo(0, 9);
      }
    }
  }
});

test('every table has exactly one totally symmetric irrep', () => {
  for (const table of TABLES) {
    let symmetric = 0;
    for (const irrep of table.irreps) {
      if (irrep.characters.every((one) => realPart(one) === 1)) symmetric++;
    }
    expect([table.group, symmetric]).toStrictEqual([table.group, 1]);
  }
});

test('a wrong character breaks the orthogonality check', () => {
  const sound = table('Oh');
  expect(firstOrthogonality(sound, 2, 3).re).toBeCloseTo(0, 9);
  const broken = corrupt(sound, 2, 4);
  expect(firstOrthogonality(broken, 2, 2).re).not.toBeCloseTo(1, 9);
  expect(firstOrthogonality(broken, 2, 3).re).not.toBeCloseTo(0, 9);
});

test('a complex pair is stored as two rows of dimension one', () => {
  const paired = TABLES.filter((one) =>
    one.irreps.some((irrep) => irrep.pairHalf !== undefined),
  ).map((one) => one.group);
  expect(paired).toStrictEqual([
    'C3',
    'C4',
    'C5',
    'C6',
    'C3h',
    'C4h',
    'C6h',
    'S4',
    'S6',
    'S8',
    'T',
    'Th',
  ]);
  for (const group of paired) {
    for (const irrep of table(group).irreps) {
      if (irrep.pairHalf === undefined) continue;
      expect(irrep.dimension).toBe(1);
    }
  }
});

/** The table of a group, which every test here knows exists. */
function table(group: string): CharacterTable {
  const found = TABLES.find((one) => one.group === group);
  if (found === undefined) throw new Error(`no table for ${group}`);
  return found;
}

/** The same table with one character replaced, to prove the checks have teeth. */
function corrupt(
  source: CharacterTable,
  irrep: number,
  characterIndex: number,
): CharacterTable {
  const irreps = source.irreps.map((one, index) => {
    if (index !== irrep) return one;
    const characters = [...one.characters];
    characters[characterIndex] =
      realPart(characters[characterIndex] as Character) + 1;
    return { ...one, characters };
  });
  return { ...source, irreps };
}
