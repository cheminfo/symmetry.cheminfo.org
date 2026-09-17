import { expect, test } from 'vitest';

import type { MoleculeAtom } from '../molecules.ts';
import {
  MOLECULES,
  MOLECULES_NOT_BUILT,
  moleculeById,
  moleculesOfGroup,
} from '../molecules.ts';
import { pointGroupById } from '../pointGroups.ts';

test('the library holds 56 molecules with distinct ids', () => {
  expect(MOLECULES).toHaveLength(56);
  const ids = MOLECULES.map((one) => one.id);
  expect(new Set(ids).size).toBe(56);
  for (const id of ids) expect(id).toMatch(/^[a-z][a-z\d-]*$/);
  expect(moleculeById('benzene')?.formula).toBe('C6H6');
  expect(moleculeById('nothing')).toBeUndefined();
});

test('every molecule names a group the catalogue holds', () => {
  const covered = new Set<string>();
  for (const entry of MOLECULES) {
    expect(() => pointGroupById(entry.pointGroup)).not.toThrow();
    covered.add(entry.pointGroup);
  }
  expect(covered.size).toBe(28);
  expect(moleculesOfGroup('C2v').map((one) => one.id)).toStrictEqual([
    'water',
    'sulfur-dioxide',
    'formaldehyde',
    'cis-dichloroethene',
    'sulfur-tetrafluoride',
  ]);
});

test('every molecule says where its geometry comes from, in one clause', () => {
  for (const entry of MOLECULES) {
    expect([entry.id, entry.geometrySource.length > 8]).toStrictEqual([
      entry.id,
      true,
    ]);
    expect([entry.id, entry.why.length <= 100]).toStrictEqual([entry.id, true]);
    expect([entry.id, entry.why.endsWith('.')]).toStrictEqual([entry.id, true]);
  }
});

test('benzene is a regular hexagon with the bond length it claims', () => {
  const benzene = atoms('benzene');
  const carbons = benzene.filter((atom) => atom.element === 'C');
  expect(carbons).toHaveLength(6);
  expect(benzene.filter((atom) => atom.element === 'H')).toHaveLength(6);
  for (const carbon of carbons) {
    const bonded = neighbours(carbons, carbon, 1.5);
    expect(bonded).toHaveLength(2);
    for (const other of bonded) {
      expect(distance(carbon, other)).toBeCloseTo(1.397, 9);
    }
  }
});

test('methane is a regular tetrahedron of the bond length it claims', () => {
  const methane = atoms('methane');
  const centre = methane[0] as MoleculeAtom;
  expect(centre.element).toBe('C');
  const hydrogens = methane.filter((atom) => atom.element === 'H');
  expect(hydrogens).toHaveLength(4);
  for (const hydrogen of hydrogens) {
    expect(distance(centre, hydrogen)).toBeCloseTo(1.087, 9);
  }
  expect(
    angle(hydrogens[0] as MoleculeAtom, centre, hydrogens[1] as MoleculeAtom),
  ).toBeCloseTo(109.4712, 3);
});

test('the fullerene has 60 carbons and 90 bonds of one length', () => {
  const carbons = atoms('buckminsterfullerene');
  expect(carbons).toHaveLength(60);
  let bonds = 0;
  for (let i = 0; i < carbons.length; i++) {
    for (let j = i + 1; j < carbons.length; j++) {
      const apart = distance(
        carbons[i] as MoleculeAtom,
        carbons[j] as MoleculeAtom,
      );
      if (apart > 1.5) continue;
      expect(apart).toBeCloseTo(1.4326, 4);
      bonds++;
    }
  }
  expect(bonds).toBe(90);
});

test('the sulfur crown reproduces the bond and the angle it was solved from', () => {
  const sulfur = atoms('sulfur-crown');
  expect(sulfur).toHaveLength(8);
  const centre = sulfur[0] as MoleculeAtom;
  const bonded = neighbours(sulfur, centre, 2.2);
  expect(bonded).toHaveLength(2);
  expect(distance(centre, bonded[0] as MoleculeAtom)).toBeCloseTo(2.055, 4);
  // The radius and the half-height are published to four decimals, which fixes
  // the angle to about a thousandth of a degree.
  expect(
    angle(bonded[0] as MoleculeAtom, centre, bonded[1] as MoleculeAtom),
  ).toBeCloseTo(108, 2);
});

test('cyclohexane in the chair reproduces the bond and the angle it was solved from', () => {
  const ring = atoms('cyclohexane-chair').filter(
    (atom) => atom.element === 'C',
  );
  expect(ring).toHaveLength(6);
  for (const carbon of ring) {
    const bonded = neighbours(ring, carbon, 1.6);
    expect(bonded).toHaveLength(2);
    expect(distance(carbon, bonded[0] as MoleculeAtom)).toBeCloseTo(1.536, 9);
    expect(
      angle(bonded[0] as MoleculeAtom, carbon, bonded[1] as MoleculeAtom),
    ).toBeCloseTo(111.4, 9);
  }
});

test('the molecules that cannot be built exactly are listed with a reason', () => {
  expect(MOLECULES_NOT_BUILT).toHaveLength(6);
  const built = new Set(MOLECULES.map((one) => one.name));
  for (const missing of MOLECULES_NOT_BUILT) {
    expect(missing.reason.length > 40).toBe(true);
    expect(built.has(missing.name)).toBe(false);
  }
});

/** The atoms of a library molecule. */
function atoms(id: string): readonly MoleculeAtom[] {
  const entry = moleculeById(id);
  if (entry === undefined) throw new Error(`no molecule ${id}`);
  return entry.atoms;
}

/** The atoms within `cutoff` of `centre`, which is never its own neighbour. */
function neighbours(
  candidates: readonly MoleculeAtom[],
  centre: MoleculeAtom,
  cutoff: number,
): readonly MoleculeAtom[] {
  return candidates.filter((atom) => {
    const apart = distance(atom, centre);
    return apart > 1e-6 && apart < cutoff;
  });
}

function distance(a: MoleculeAtom, b: MoleculeAtom): number {
  return Math.hypot(
    a.position[0] - b.position[0],
    a.position[1] - b.position[1],
    a.position[2] - b.position[2],
  );
}

/** The angle a–b–c, in degrees. */
function angle(a: MoleculeAtom, b: MoleculeAtom, c: MoleculeAtom): number {
  const first = [0, 1, 2].map(
    (i) => (a.position[i] as number) - (b.position[i] as number),
  );
  const second = [0, 1, 2].map(
    (i) => (c.position[i] as number) - (b.position[i] as number),
  );
  let dot = 0;
  for (let i = 0; i < 3; i++) {
    dot += (first[i] as number) * (second[i] as number);
  }
  const cosine = dot / (Math.hypot(...first) * Math.hypot(...second));
  return (Math.acos(Math.min(1, Math.max(-1, cosine))) * 180) / Math.PI;
}
