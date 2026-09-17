import { expect, test } from 'vitest';

import { orbitAtoms } from '../../data/molecules/build.ts';
import { ethane } from '../../data/molecules/frames.ts';
import type { MoleculeAtom } from '../../data/molecules.ts';
import { MOLECULES } from '../../data/molecules.ts';
import { finitePointGroups } from '../../data/pointGroups.ts';
import {
  DEFAULT_TOLERANCE,
  detectPointGroup,
  detectWithOptions,
} from '../detect.ts';
import {
  applyMatrix,
  multiplyMatrices,
  rotationMatrix,
} from '../point/mat3.ts';
import { operationsOf } from '../pointGroups.ts';

/** Four points in general position: their orbit under G has exactly G. */
/**
 * Long enough for a sweep over every group to survive running beside the rest
 * of the suite under coverage, where 5 s has already been too little.
 */
const SWEEP_TIMEOUT = 30_000;

const SEED: readonly MoleculeAtom[] = [
  { element: 'C', position: [0.9137, 0.4271, 1.2831] },
  { element: 'N', position: [1.7213, -0.6132, 0.3117] },
  { element: 'O', position: [0.2119, 1.9312, -0.7734] },
  { element: 'F', position: [-0.8814, 0.7731, 1.5522] },
];

/** An arbitrary rotation, so no test can pass by sitting in the standard frame. */
const TILT = multiplyMatrices(
  rotationMatrix([0.3714, 0.5571, 0.7428], 0.7),
  rotationMatrix([0.8018, -0.5345, 0.2673], 1.9),
);

test(
  'every finite group is detected from the orbit of four general points',
  () => {
    for (const group of finitePointGroups()) {
      const atoms = orbitAtoms(SEED, operationsOf(group.id));
      const found = detect(atoms, 1e-4);
      expect([group.id, found.group, found.order, found.closed]).toStrictEqual([
        group.id,
        group.id,
        group.order,
        true,
      ]);
    }
  },
  SWEEP_TIMEOUT,
);

test(
  'the same orbit in an arbitrary frame gives the same group',
  () => {
    for (const group of finitePointGroups()) {
      const atoms = orbitAtoms(SEED, operationsOf(group.id)).map((atom) => ({
        element: atom.element,
        position: applyMatrix(TILT, atom.position),
      }));
      expect([group.id, detect(atoms, 1e-4).group]).toStrictEqual([
        group.id,
        group.id,
      ]);
    }
  },
  SWEEP_TIMEOUT,
);

test('every molecule of the library is the group its record claims', () => {
  for (const entry of MOLECULES) {
    const found = detect(entry.atoms, DEFAULT_TOLERANCE);
    expect([entry.id, found.group]).toStrictEqual([entry.id, entry.pointGroup]);
  }
});

test('and is still that group at a tolerance of a millionth of an ångström', () => {
  for (const entry of MOLECULES) {
    const found = detect(entry.atoms, 1e-6);
    expect([entry.id, found.group, found.closed]).toStrictEqual([
      entry.id,
      entry.pointGroup,
      true,
    ]);
  }
});

test('the order the detector reports is the order of the group it names', () => {
  const benzene = detect(molecule('benzene'), DEFAULT_TOLERANCE);
  expect(benzene.group).toBe('D6h');
  expect(benzene.order).toBe(24);
  expect(benzene.operations.filter((one) => one.kind === 'sigma')).toHaveLength(
    7,
  );
  expect(benzene.principalAxis).not.toBeNull();
});

test('a linear molecule is detected without counting an axis at all', () => {
  const dioxide = detect(molecule('carbon-dioxide'), DEFAULT_TOLERANCE);
  expect([dioxide.group, dioxide.order, dioxide.operations]).toStrictEqual([
    'Dinfh',
    Infinity,
    [],
  ]);
  expect(detect(molecule('carbonyl-sulfide'), DEFAULT_TOLERANCE).group).toBe(
    'Cinfv',
  );
});

test('ethane is D3 until the tolerance is loose enough to call it staggered', () => {
  // 30° off staggered moves a hydrogen by half an ångström: D3 at any tolerance
  // a structure could justify.
  expect(detect(molecule('ethane-skew'), 0.1).group).toBe('D3');
  // 2° off staggered moves it by 0.036 Å, so the answer turns over between a
  // tolerance of 0.02 Å and one of 0.1 — which is why the tolerance is part of
  // the answer and not a setting hidden in the code.
  const nearlyStaggered = ethane(58);
  expect(detect(nearlyStaggered, 0.02).group).toBe('D3');
  const loose = detect(nearlyStaggered, 0.1);
  expect(loose.group).toBe('D3d');
  expect(loose.closed).toBe(false);
});

test('an element is never mapped onto another, whatever the geometry', () => {
  const carbonDioxide = molecule('carbon-dioxide');
  const disguised = carbonDioxide.map((atom, index) => ({
    element: index === 0 ? 'S' : atom.element,
    position: atom.position,
  }));
  expect(detect(disguised, DEFAULT_TOLERANCE).group).toBe('Cinfv');
});

test('the tolerance the answer holds at comes back with it', () => {
  const water = molecule('water');
  expect(
    detectPointGroup(
      water.map((atom) => atom.position),
      water.map((atom) => atom.element),
    ).tolerance,
  ).toBe(DEFAULT_TOLERANCE);
  expect(
    detectPointGroup(
      water.map((atom) => atom.position),
      water.map((atom) => atom.element),
      0.01,
    ).tolerance,
  ).toBe(0.01);
});

test('a position without an element is refused', () => {
  expect(() => detectPointGroup([[0, 0, 0]], [])).toThrow(
    'every position needs an element symbol',
  );
});

/** The detector, on a list of atoms. */
function detect(atoms: readonly MoleculeAtom[], tolerance: number) {
  return detectWithOptions(
    atoms.map((atom) => atom.position),
    atoms.map((atom) => atom.element),
    { tolerance },
  );
}

/** The atoms of a library molecule. */
function molecule(id: string): readonly MoleculeAtom[] {
  const entry = MOLECULES.find((one) => one.id === id);
  if (entry === undefined) throw new Error(`no molecule ${id}`);
  return entry.atoms;
}
