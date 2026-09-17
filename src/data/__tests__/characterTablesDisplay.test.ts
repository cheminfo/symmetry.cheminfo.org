import { expect, test } from 'vitest';

import {
  displayRows,
  requireCharacterTable,
} from '../../symmetry/characterTables.ts';
import type { Character, CharacterTable } from '../characterTables.ts';
import { CHARACTER_TABLES, realPart } from '../characterTables.ts';

const ROOT2 = Math.SQRT2;
const A5 = 2 * Math.cos((72 * Math.PI) / 180);
const B5 = 2 * Math.cos((144 * Math.PI) / 180);

/**
 * The combined rows `verify2.mjs` printed, which are what a textbook shows for a
 * group whose `E` is a complex pair. They are **derived** here from the stored
 * pair, so this is the one assertion the combined form carries.
 */
const COMBINED: ReadonlyArray<readonly [string, string, readonly number[]]> = [
  ['C3', 'E', [2, -1, -1]],
  ['C4', 'E', [2, 0, -2, 0]],
  ['C5', 'E1', [2, A5, B5, B5, A5]],
  ['C5', 'E2', [2, B5, A5, A5, B5]],
  ['C6', 'E1', [2, 1, -1, -2, -1, 1]],
  ['C6', 'E2', [2, -1, -1, 2, -1, -1]],
  ['S4', 'E', [2, 0, -2, 0]],
  ['S8', 'E1', [2, ROOT2, 0, -ROOT2, -2, -ROOT2, 0, ROOT2]],
  ['S8', 'E2', [2, 0, -2, 0, 2, 0, -2, 0]],
  ['S8', 'E3', [2, -ROOT2, 0, ROOT2, -2, ROOT2, 0, -ROOT2]],
  ['C3h', 'E′', [2, -1, -1, 2, -1, -1]],
  ['C3h', 'E″', [2, -1, -1, -2, 1, 1]],
  ['C4h', 'Eg', [2, 0, -2, 0, 2, 0, -2, 0]],
  ['C4h', 'Eu', [2, 0, -2, 0, -2, 0, 2, 0]],
  ['C6h', 'E1g', [2, 1, -1, -2, -1, 1, 2, 1, -1, -2, -1, 1]],
  ['C6h', 'E2u', [2, -1, -1, 2, -1, -1, -2, 1, 1, -2, 1, 1]],
  ['S6', 'Eg', [2, -1, -1, 2, -1, -1]],
  ['S6', 'Eu', [2, -1, -1, -2, 1, 1]],
  ['T', 'E', [2, -1, -1, 2]],
  ['Th', 'Eg', [2, -1, -1, 2, 2, -1, -1, 2]],
  ['Th', 'Eu', [2, -1, -1, 2, -2, 1, 1, -2]],
];

test('a complex pair adds up to the real row a textbook prints', () => {
  for (const [group, mulliken, expected] of COMBINED) {
    const row = displayRows(requireCharacterTable(group)).find(
      (one) => one.mulliken === mulliken,
    );
    expect(row?.combined).toBe(true);
    expect(row?.dimension).toBe(2);
    const characters = row?.characters ?? [];
    expect(characters).toHaveLength(expected.length);
    for (let i = 0; i < expected.length; i++) {
      expect([group, mulliken, i, characters[i]]).toStrictEqual([
        group,
        mulliken,
        i,
        expect.closeTo(expected[i] as number, 9),
      ]);
    }
  }
});

test('a real table is displayed exactly as it is stored', () => {
  const oh = displayRows(requireCharacterTable('Oh'));
  expect(oh).toHaveLength(10);
  expect(oh.every((row) => !row.combined)).toBe(true);
  expect(oh[4]?.mulliken).toBe('T2g');
  expect(oh[4]?.characters).toStrictEqual([3, 0, 1, -1, -1, 3, -1, 0, -1, 1]);
});

test('every table accounts for x, y, z, Rx, Ry and Rz exactly once', () => {
  const wanted = ['x', 'y', 'z', 'Rx', 'Ry', 'Rz'];
  for (const table of CHARACTER_TABLES) {
    const seen: string[] = [];
    for (const irrep of table.irreps) seen.push(...irrep.linear);
    expect([table.group, seen.toSorted()]).toStrictEqual([
      table.group,
      wanted.toSorted(),
    ]);
  }
});

test('every table accounts for six quadratic basis functions', () => {
  for (const table of CHARACTER_TABLES) {
    const seen: string[] = [];
    for (const irrep of table.irreps) seen.push(...irrep.quadratic);
    expect([table.group, seen.length, new Set(seen).size]).toStrictEqual([
      table.group,
      6,
      6,
    ]);
  }
});

test('a centrosymmetric table pairs every gerade irrep with an ungerade one', () => {
  for (const table of CHARACTER_TABLES) {
    const gerade = table.irreps.filter((one) => one.mulliken.endsWith('g'));
    if (gerade.length === 0) continue;
    const half = table.classes.length / 2;
    expect([table.group, gerade.length]).toStrictEqual([table.group, half / 1]);
    for (const irrep of gerade) {
      const partner = findUngerade(table, irrep.mulliken, irrep.pairHalf);
      for (let c = 0; c < half; c++) {
        expect(partner[c]).toBeCloseTo(
          realPart(irrep.characters[c] as Character),
          9,
        );
        expect(partner[c + half]).toBeCloseTo(
          -realPart(irrep.characters[c + half] as Character),
          9,
        );
      }
    }
  }
});

/** The `u` partner of a `g` irrep: same symbol, same half of a complex pair. */
function findUngerade(
  table: CharacterTable,
  mulliken: string,
  pairHalf: 1 | 2 | undefined,
): readonly number[] {
  const wanted = `${mulliken.slice(0, -1)}u`;
  const found = table.irreps.find(
    (one) => one.mulliken === wanted && one.pairHalf === pairHalf,
  );
  if (found === undefined) {
    throw new Error(`${table.group} has no ${wanted} for ${mulliken}`);
  }
  return found.characters.map(realPart);
}
