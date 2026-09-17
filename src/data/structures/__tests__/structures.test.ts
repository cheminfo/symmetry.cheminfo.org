import { expect, test } from 'vitest';

import { describeSites, expandStructure } from '../../../crystal/expand.ts';
import { resolveStructureSetting } from '../../../crystal/resolve.ts';
import { spaceGroupOperations } from '../../../symmetry/spaceGroups.ts';
import {
  STRUCTURES,
  structureById,
  structureCif,
  structureOf,
  structureSetting,
} from '../index.ts';

test('the library holds sixteen structures, each with a distinct id', () => {
  expect(STRUCTURES).toHaveLength(16);
  expect(new Set(STRUCTURES.map((entry) => entry.id)).size).toBe(16);
  expect(structureById('halite')?.title).toBe('Halite');
  expect(structureById('nothing-of-the-sort')).toBeUndefined();
  expect(() => structureCif('nothing-of-the-sort')).toThrow(
    'no structure is called "nothing-of-the-sort"',
  );
});

test('every file parses, and names the group its entry records', () => {
  const resolvedIds: string[] = [];
  for (const entry of STRUCTURES) {
    const structure = structureOf(entry.id);
    const resolved = resolveStructureSetting(structure);
    expect(resolved.setting).not.toBeNull();
    expect(resolved.setting?.number).toBe(entry.spaceGroupNumber);
    expect(resolved.setting?.variant).toBe(entry.variant);
    // A file that carries its own operations must agree with the symbol it
    // also carries; one that carries none says nothing either way.
    expect(resolved.agrees === null || resolved.agrees).toBe(true);
    expect(structureSetting(entry)).toStrictEqual(resolved.setting);
    resolvedIds.push(entry.id);
  }
  expect(resolvedIds).toHaveLength(16);
});

test('the library spans all seven crystal systems', () => {
  const systems = new Set(
    STRUCTURES.map((entry) => structureSetting(entry).crystalSystem),
  );
  expect([...systems].toSorted(byText)).toStrictEqual([
    'cubic',
    'hexagonal',
    'monoclinic',
    'orthorhombic',
    'tetragonal',
    'triclinic',
    'trigonal',
  ]);
  const centrings = new Set(
    STRUCTURES.map((entry) => structureSetting(entry).centring),
  );
  expect([...centrings].toSorted(byText)).toStrictEqual([
    'C',
    'F',
    'I',
    'P',
    'R',
  ]);
});

test('the symmetry fills each cell with the number of atoms it should', () => {
  const counts: Array<[string, number]> = [];
  for (const entry of STRUCTURES) {
    const structure = structureOf(entry.id);
    const operations = spaceGroupOperations(structureSetting(entry));
    counts.push([
      entry.id,
      expandStructure(structure.sites, operations).length,
    ]);
  }
  expect(counts).toStrictEqual([
    ['copper', 4],
    ['iron-alpha', 2],
    ['halite', 8],
    ['caesium-chloride', 2],
    ['fluorite', 12],
    ['sphalerite', 8],
    ['diamond', 8],
    ['strontium-titanate', 5],
    ['rutile', 6],
    ['graphite', 4],
    ['wurtzite', 4],
    ['quartz', 9],
    ['calcite', 30],
    ['perovskite', 20],
    ['gypsum', 48],
    ['chalcanthite', 42],
  ]);
});

test('the site readout is the multiplicity and the site symmetry', () => {
  expect(sitesOf('halite')).toStrictEqual(['4 m-3m', '4 m-3m']);
  // The same group as halite, and a different structure: the fluorine sits on
  // -43m with multiplicity 8, which is what makes it CaF₂ rather than CaF.
  expect(sitesOf('fluorite')).toStrictEqual(['4 m-3m', '8 -43m']);
  expect(sitesOf('quartz')).toStrictEqual(['3 2', '6 1']);
});

test('diamond is on origin choice 2, with its carbon at an eighth of the cell', () => {
  expect(structureSetting(entryOf('diamond')).originChoice).toBe(2);
  expect(structureOf('diamond').sites[0]?.x).toBe(0.125);
});

test('a structure taken from the COD records the entry it came from', () => {
  const fromCod = STRUCTURES.filter((entry) => entry.source.kind === 'cod');
  expect(fromCod.map((entry) => entry.id)).toStrictEqual([
    'wurtzite',
    'quartz',
    'calcite',
    'perovskite',
    'gypsum',
    'chalcanthite',
  ]);
  for (const entry of fromCod) {
    const source = entry.source;
    if (source.kind !== 'cod') throw new Error('the filter just said it is');
    expect(structureOf(entry.id).source.cod).toBe(source.cod);
  }
});

test('what each structure teaches is one clause, and says something', () => {
  for (const entry of STRUCTURES) {
    expect(entry.teaches.length).toBeLessThanOrEqual(90);
    expect(entry.teaches.length).toBeGreaterThan(20);
    expect(entry.teaches.endsWith('.')).toBe(true);
    expect(entry.formula.length).toBeGreaterThan(0);
  }
  expect(new Set(STRUCTURES.map((entry) => entry.teaches)).size).toBe(16);
});

/** The library entry with this id. */
function entryOf(id: string) {
  const entry = structureById(id);
  if (entry === undefined) throw new Error(`no structure is called "${id}"`);
  return entry;
}

/** Each site of a structure as `multiplicity site-symmetry`. */
function sitesOf(id: string): string[] {
  const entry = entryOf(id);
  const reports = describeSites(
    structureOf(id).sites,
    spaceGroupOperations(structureSetting(entry)),
  );
  return reports.map(
    (report) => `${report.multiplicity} ${report.siteSymmetry}`,
  );
}

function byText(a: string, b: string): number {
  return a < b ? -1 : 1;
}
