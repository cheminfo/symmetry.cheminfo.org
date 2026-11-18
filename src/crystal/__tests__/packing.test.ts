import { expect, test } from 'vitest';

import {
  structureById,
  structureOf,
  structureSetting,
} from '../../data/structures/index.ts';
import { createLattice } from '../../symmetry/core/index.ts';
import { spaceGroupOperations } from '../../symmetry/spaceGroups.ts';
import { bondLimit } from '../../viewer/bondRule.ts';
import { expandStructure } from '../expand.ts';
import type { PackedAtom } from '../packing.ts';
import { MAX_PACKED_ATOMS, packMolecules } from '../packing.ts';

test('naphthalene: two whole molecules, centred on the inversion centres', () => {
  const { atoms, lattice } = cellOf('naphthalene');
  const packed = packMolecules(atoms, lattice, bondLimit);

  expect(packed.molecules).toBe(2);
  expect(packed.extended).toBe(false);
  expect(packed.atoms).toHaveLength(36);
  expect(centres(packed.atoms, 18)).toStrictEqual([
    [0, 0, 0],
    [0, 0.5, 0.5],
  ]);
});

test('aspirin: four whole molecules, each centred inside the cell', () => {
  const { atoms, lattice } = cellOf('aspirin');
  const packed = packMolecules(atoms, lattice, bondLimit);

  expect(packed.molecules).toBe(4);
  expect(packed.extended).toBe(false);
  expect(packed.atoms).toHaveLength(84);
  for (const centre of centres(packed.atoms, 21)) {
    for (const value of centre) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  }
});

test('quartz is one network, left as the cell holds it', () => {
  const { atoms, lattice } = cellOf('quartz');
  const packed = packMolecules(atoms, lattice, bondLimit);

  expect(packed.extended).toBe(true);
  expect(packed.molecules).toBe(0);
  // The same atoms, where the cell put them, in the order they were reached.
  expect(packed.atoms).toHaveLength(atoms.length);
  expect(new Set(packed.atoms)).toStrictEqual(new Set(atoms));
});

test('halite holds ions, not molecules', () => {
  const { atoms, lattice } = cellOf('halite');
  const packed = packMolecules(atoms, lattice, bondLimit);

  expect(packed.molecules).toBe(0);
  expect(packed.extended).toBe(false);
  expect(packed.atoms).toHaveLength(8);
});

test('a cell too large to search is drawn as it is', () => {
  const { lattice } = cellOf('halite');
  const atoms: PackedAtom[] = [];
  for (let index = 0; index <= MAX_PACKED_ATOMS; index++) {
    atoms.push({ element: 'C', position: [index / 10_000, 0, 0] });
  }
  const packed = packMolecules(atoms, lattice, bondLimit);

  expect(packed.atoms).toBe(atoms);
  expect(packed.molecules).toBe(0);
});

/** One cell of a library structure, every atom wrapped into it. */
function cellOf(id: string) {
  const entry = structureById(id);
  if (entry === undefined) throw new Error(`no structure is called "${id}"`);
  const structure = structureOf(id);
  const operations = spaceGroupOperations(structureSetting(entry));
  return {
    atoms: expandStructure(structure.sites, operations),
    lattice: createLattice(structure.cell),
  };
}

/** The centre of each run of `size` atoms, rounded to a thousandth. */
function centres(atoms: readonly PackedAtom[], size: number): number[][] {
  const result: number[][] = [];
  for (let start = 0; start < atoms.length; start += size) {
    const sum = [0, 0, 0];
    for (let index = start; index < start + size; index++) {
      const position = atoms[index]?.position ?? [0, 0, 0];
      for (let axis = 0; axis < 3; axis++) {
        sum[axis] = (sum[axis] ?? 0) + (position[axis] ?? 0);
      }
    }
    result.push(
      sum.map((value) => Math.round((value / size) * 1000) / 1000 || 0),
    );
  }
  return result.toSorted((a, b) => (a[1] ?? 0) - (b[1] ?? 0));
}
