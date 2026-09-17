import { expect, test } from 'vitest';

import {
  displayRows,
  groupOrderOf,
  reduceRepresentation,
  requireCharacterTable,
} from '../characterTables.ts';

test('the 3N representation of water reduces to what a textbook prints', () => {
  const table = requireCharacterTable('C2v');
  // Water drawn in the yz plane: 3 atoms unmoved by E, one by C2 and by σv(xz),
  // all three by the molecular plane; χ = N_unmoved × (±1 + 2cos θ).
  expect(reduceRepresentation(table, [9, -1, 1, 3])).toStrictEqual([
    3, 1, 2, 3,
  ]);
});

test('the 3N representation of methane reduces to what a textbook prints', () => {
  const table = requireCharacterTable('Td');
  // E 15, 8C3 0, 3C2 −1, 6S4 −1, 6σd 3.
  expect(reduceRepresentation(table, [15, 0, -1, -1, 3])).toStrictEqual([
    1, 0, 1, 1, 3,
  ]);
});

test('a reduction needs one character per class', () => {
  expect(() =>
    reduceRepresentation(requireCharacterTable('C2v'), [1, 1]),
  ).toThrow('needs 4 characters');
});

test('the order of a table is the order of its group', () => {
  expect(groupOrderOf(requireCharacterTable('Oh'))).toBe(48);
  expect(groupOrderOf(requireCharacterTable('C3'))).toBe(3);
  expect(groupOrderOf(requireCharacterTable('Ih'))).toBe(120);
});

test('a table the site does not ship is refused by name', () => {
  expect(() => requireCharacterTable('Cinfv')).toThrow(
    'no character table for Cinfv',
  );
  expect(() => requireCharacterTable('D7')).toThrow(
    'no character table for D7',
  );
});

test('a group with no complex pair has one display row per irrep', () => {
  const rows = displayRows(requireCharacterTable('C2v'));
  expect(rows.map((one) => one.mulliken)).toStrictEqual([
    'A1',
    'A2',
    'B1',
    'B2',
  ]);
  expect(rows.every((one) => !one.combined)).toBe(true);
});

test('a complex pair is one display row carrying both halves of the basis', () => {
  const rows = displayRows(requireCharacterTable('C3'));
  expect(rows.map((one) => one.mulliken)).toStrictEqual(['A', 'E']);
  expect(rows[1]?.linear).toStrictEqual(['x', 'y', 'Rx', 'Ry']);
  const characters = rows[1]?.characters ?? [];
  expect(characters).toHaveLength(3);
  expect(characters[0]).toBeCloseTo(2, 12);
  expect(characters[1]).toBeCloseTo(-1, 12);
  expect(characters[2]).toBeCloseTo(-1, 12);
});
