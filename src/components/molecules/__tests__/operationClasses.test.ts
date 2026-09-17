import { expect, test } from 'vitest';

import { MOLECULES, moleculeById } from '../../../data/molecules.ts';
import { characterTableOf } from '../../../symmetry/characterTables.ts';
import type { MoleculeAnalysis } from '../assignment.ts';
import { analyseMolecule } from '../assignment.ts';

/** The workbench's reading of one library molecule. */
function read(id: string): MoleculeAnalysis {
  const entry = moleculeById(id);
  if (entry === undefined) throw new Error(`no molecule ${id}`);
  return analyseMolecule(entry);
}

/** The header of each class, in the order the panel prints them. */
function headers(id: string): string[] {
  return read(id).classes.map((one) => one.header);
}

test('a class of one is headed by its own operation, plane included', () => {
  expect(headers('water')).toStrictEqual(['E', 'C2', 'σv(xz)', 'σv(yz)']);
});

test('a class of several counts them in front of the symbol', () => {
  expect(headers('methane')).toStrictEqual(['E', '8C3', '3C2', '6S4', '6σ']);
  expect(read('methane').classes.map((one) => one.size)).toStrictEqual([
    1, 8, 3, 6, 6,
  ]);
});

test('the identity leads, then the rotations, then the planes', () => {
  expect(headers('ethane-staggered')).toStrictEqual([
    'E',
    '2C3',
    '3C2',
    'i',
    '2S6',
    '3σd',
  ]);
});

test('two classes that would print alike are told apart by a prime', () => {
  expect(headers('benzene')).toStrictEqual([
    'E',
    '2C6',
    '2C3',
    '3C2',
    '3C2′',
    // The principal C2 is C6³ and is a class of its own, so the header is its
    // own name: the axis it turns about, which is what tells it from the six
    // lying in the ring plane.
    'C2(z)',
    'i',
    '2S6',
    '2S3',
    'σh',
    '3σv',
    '3σv′',
  ]);
});

test('every operation lands in exactly one class', () => {
  let checked = 0;
  for (const entry of MOLECULES) {
    const analysis = analyseMolecule(entry);
    let total = 0;
    const named = new Set<string>();
    for (const one of analysis.classes) {
      expect(one.members).toHaveLength(one.size);
      total += one.size;
      for (const member of one.members) named.add(member.name);
    }
    expect(total).toBe(analysis.detection.operations.length);
    expect(named.size).toBe(analysis.detection.operations.length);
    checked++;
  }
  expect(checked).toBe(56);
});

test('a group has as many classes as its table has columns', () => {
  let checked = 0;
  for (const entry of MOLECULES) {
    const analysis = analyseMolecule(entry);
    const table = characterTableOf(analysis.detection.group);
    if (table === undefined) continue;
    expect(analysis.classes).toHaveLength(table.classes.length);
    checked++;
  }
  // The five linear molecules ship no table; the other 51 all do.
  expect(checked).toBe(51);
});
