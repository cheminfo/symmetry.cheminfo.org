import { expect, test } from 'vitest';

import { supercellAtoms } from '../supercell.ts';
import type { UnitCell, ViewerAtom } from '../types.ts';

const CUBIC: UnitCell = { a: 4, b: 4, c: 4, alpha: 90, beta: 90, gamma: 90 };

/** Two atoms of a rock-salt cell, enough to see the order the copies come in. */
const CELL: ViewerAtom[] = [
  { element: 'Na', position: [0, 0, 0] },
  { element: 'Cl', position: [2, 0, 0] },
];

test('one cell is the atoms themselves, in the order they were given', () => {
  expect(supercellAtoms(CELL, CUBIC)).toStrictEqual(CELL);
});

test('a 2×2×2 stack holds eight copies of every atom', () => {
  const atoms = supercellAtoms(CELL, CUBIC, [2, 2, 2]);
  expect(atoms).toHaveLength(16);
  expect(atoms.filter((atom) => atom.element === 'Na')).toHaveLength(8);
});

test('the copies are translated by whole cells, never wrapped back in', () => {
  const atoms = supercellAtoms(CELL, CUBIC, [2, 1, 1]);
  expect(atoms).toHaveLength(4);
  expect(atoms[0]?.position[0]).toBeCloseTo(0, 10);
  expect(atoms[2]?.element).toBe('Na');
  expect(atoms[2]?.position[0]).toBeCloseTo(4, 10);
  expect(atoms[3]?.position[0]).toBeCloseTo(6, 10);
});

test('a repeat below one draws one cell', () => {
  expect(supercellAtoms(CELL, CUBIC, [0, 0, 0])).toHaveLength(2);
});

test('no atoms stay no atoms, whatever the repeat', () => {
  expect(supercellAtoms([], CUBIC, [3, 3, 3])).toStrictEqual([]);
});
