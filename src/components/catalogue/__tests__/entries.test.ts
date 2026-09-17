import { expect, test } from 'vitest';

import { pointGroupEntry } from '../pointGroupEntry.ts';
import { spaceGroupEntry } from '../spaceGroupEntry.ts';

import { fact, section } from './entryReaders.ts';

test('C2v says its four operations, its four classes and its character table', () => {
  const view = pointGroupEntry('c2v');
  if (view === null) throw new Error('no c2v');
  expect(view.symbol).toBe('C2v');
  expect(view.subtitle).toBe(
    'Order 4, 4 classes — one of the 32 crystal classes, orthorhombic. Achiral and polar.',
  );
  expect(fact(view, 'Order')).toBe('4');
  expect(fact(view, 'Hermann-Mauguin')).toBe('mm2');
  expect(fact(view, 'Crystal system')).toBe('orthorhombic');
  expect(fact(view, 'Inversion')).toBe('no inversion centre');

  const operations = section(view, 'operations');
  if (operations.kind !== 'operations') throw new Error('not operations');
  expect(operations.names).toStrictEqual(['E', 'C2', 'σv(xz)', 'σv(yz)']);

  const classes = section(view, 'classes');
  if (classes.kind !== 'table') throw new Error('not a table');
  expect(classes.rows.map((row) => row.cells)).toStrictEqual([
    ['E', '1'],
    ['C2', '1'],
    ['σv(xz)', '1'],
    ['σv\u2032(yz)', '1'],
  ]);

  const characters = section(view, 'characters');
  if (characters.kind !== 'characters') throw new Error('no table');
  if (characters.table === null) throw new Error('no C2v table');
  expect(characters.schoenflies).toBe('C2v');
  expect(characters.table.classes).toHaveLength(4);
  expect(characters.table.irreps.map((irrep) => irrep.mulliken)).toStrictEqual([
    'A1',
    'A2',
    'B1',
    'B2',
  ]);
  expect(view.figure?.kind).toBe('stereogram');
});

test('the ten groups with no character table say so instead of crashing', () => {
  for (const slug of [
    'c7',
    'c8',
    'c7v',
    'c8v',
    'c5h',
    'd7',
    'd8',
    'd7h',
    'd8h',
    'd6d',
  ]) {
    const view = pointGroupEntry(slug);
    if (view === null) throw new Error(`no ${slug}`);
    const characters = section(view, 'characters');
    if (characters.kind !== 'characters') throw new Error('not characters');
    expect(characters.table, slug).toBeNull();
    // Its operations are still listed, which is what the page is for.
    const operations = section(view, 'operations');
    if (operations.kind !== 'operations') throw new Error('not operations');
    expect(operations.names[0], slug).toBe('E');
  }
});

test('the two linear groups list no operations and draw no stereogram', () => {
  for (const slug of ['cinfv', 'dinfh']) {
    const view = pointGroupEntry(slug);
    if (view === null) throw new Error(`no ${slug}`);
    expect(view.figure, slug).toBeNull();
    expect(fact(view, 'Order')).toBe('infinite');
    expect(section(view, 'operations').kind).toBe('note');
    const characters = section(view, 'characters');
    if (characters.kind !== 'characters') throw new Error('not characters');
    expect(characters.table, slug).toBeNull();
  }
});

test('Fm-3m states 192 general positions and the absences F centring forces', () => {
  const view = spaceGroupEntry('225', 0);
  if (view === null) throw new Error('no 225');
  expect(view.symbol).toBe('Fm-3m');
  expect(fact(view, 'Short symbol')).toBe('F m -3 m');
  expect(fact(view, 'Full symbol')).toBe('F 4/m -3 2/m');
  expect(fact(view, 'Crystal class')).toBe('m-3m');
  expect(fact(view, 'General positions')).toBe('192');
  expect(fact(view, 'Cell')).toBe('a = b = c, α = β = γ = 90°');

  const positions = section(view, 'positions');
  if (positions.kind !== 'tokens') throw new Error('not tokens');
  expect(positions.tokens).toHaveLength(192);
  expect(positions.tokens[0]).toBe('x,y,z');

  const absences = section(view, 'absences');
  if (absences.kind !== 'table') throw new Error('not a table');
  expect(absences.rows.map((row) => row.cells)).toStrictEqual([
    ['hkl', 'h + k = 2n', 't(1/2,1/2,0) centring'],
    ['hkl', 'h + l = 2n', 't(1/2,0,1/2) centring'],
    ['hkl', 'k + l = 2n', 't(0,1/2,1/2) centring'],
  ]);
});

test('Pnma states the five conditions the International Tables give it', () => {
  const view = spaceGroupEntry('62', 0);
  if (view === null) throw new Error('no 62');
  expect(view.symbol).toBe('Pnma');
  const absences = section(view, 'absences');
  if (absences.kind !== 'table') throw new Error('not a table');
  expect(
    absences.rows.map((row) => [row.cells[0], row.cells[1]]),
  ).toStrictEqual([
    ['0kl', 'k + l = 2n'],
    ['hk0', 'h = 2n'],
    ['00l', 'l = 2n'],
    ['0k0', 'k = 2n'],
    ['h00', 'h = 2n'],
  ]);
  // The full symbol repeats the short one here, so it is not a second row.
  expect(fact(view, 'Full symbol')).toBeUndefined();
  expect(fact(view, 'Short symbol')).toBe('P n m a');
});

test('a group with one class says one class, not "1 classes"', () => {
  expect(pointGroupEntry('c1')?.subtitle).toBe(
    'Order 1, 1 class — one of the 32 crystal classes, triclinic. Chiral and polar.',
  );
});

test('P1 has no systematic absence at all, and says so', () => {
  const view = spaceGroupEntry('1', 0);
  if (view === null) throw new Error('no 1');
  expect(section(view, 'absences').kind).toBe('note');
  expect(view.settings).toHaveLength(1);
});

test('a space group opens on the setting asked for, and clamps a stale one', () => {
  const standard = spaceGroupEntry('14', 0);
  const third = spaceGroupEntry('14', 2);
  const stale = spaceGroupEntry('14', 99);
  if (standard === null || third === null || stale === null) {
    throw new Error('no 14');
  }
  expect(standard.settings).toHaveLength(9);
  expect(standard.settingIndex).toBe(0);
  expect(standard.settings[0]?.label).toBe('P 1 21/c 1');
  expect(third.settingIndex).toBe(2);
  expect(third.settings[2]?.label).not.toBe(standard.settings[0]?.label);
  // A link written against another build still opens the group.
  expect(stale.settingIndex).toBe(8);
  // The address names the number, so the symbol above it never moves.
  expect([standard.symbol, third.symbol, stale.symbol]).toStrictEqual([
    'P21/c',
    'P21/c',
    'P21/c',
  ]);
});

test("Fd-3m's two origin choices are offered by name", () => {
  const view = spaceGroupEntry('227', 1);
  if (view === null) throw new Error('no 227');
  // Variant 0 is origin choice 2, the one with the inversion centre at 0,0,0.
  expect(view.settings.map((setting) => setting.detail)).toStrictEqual([
    'origin choice 2',
    'origin choice 1',
  ]);
  expect(view.settingIndex).toBe(1);
  expect(fact(view, 'Origin')).toBe('choice 1');
});
