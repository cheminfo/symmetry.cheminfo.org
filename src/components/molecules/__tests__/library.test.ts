import { expect, test } from 'vitest';

import { MOLECULES } from '../../../data/molecules.ts';
import {
  DEFAULT_MOLECULE_ID,
  librarySections,
  resolveMolecule,
} from '../library.ts';

/** The ids of every molecule a query keeps, in the order the picker shows them. */
function found(query: string): string[] {
  const ids: string[] = [];
  for (const section of librarySections(query)) {
    for (const entry of section.molecules) ids.push(entry.id);
  }
  return ids;
}

test('the workbench opens on water, named or not', () => {
  expect(DEFAULT_MOLECULE_ID).toBe('water');
  expect(resolveMolecule(null).id).toBe('water');
  expect(resolveMolecule('benzene').id).toBe('benzene');
});

test('an id nobody minted opens the tool rather than an empty page', () => {
  expect(resolveMolecule('nonesuch').id).toBe('water');
  expect(resolveMolecule('').id).toBe('water');
});

test('the whole library is 56 molecules over 28 groups, in catalogue order', () => {
  const sections = librarySections('');
  expect(sections).toHaveLength(28);
  expect(sections.map((one) => one.group.id).slice(0, 5)).toStrictEqual([
    'C1',
    'Cs',
    'Ci',
    'C2',
    'C2v',
  ]);
  expect(sections.at(-1)?.group.id).toBe('Dinfh');
  expect(found('')).toHaveLength(MOLECULES.length);
  expect(MOLECULES).toHaveLength(56);
});

test('a name search crosses the groups and keeps their order', () => {
  expect(found('benz')).toStrictEqual([
    'dichlorobenzene',
    'trichlorobenzene',
    'benzene',
  ]);
});

test('a formula matches wherever it occurs in one', () => {
  expect(found('CH4')).toStrictEqual(['methane']);
  // H2O is in H2O2 and in CH2O as well, and a student who typed it is better
  // served by three candidates than by one exact hit.
  expect(found('H2O')).toStrictEqual([
    'hydrogen-peroxide',
    'water',
    'formaldehyde',
  ]);
});

test('a group symbol lists that group, whatever the case and spacing', () => {
  expect(found(' C2V ')).toStrictEqual([
    'water',
    'sulfur-dioxide',
    'formaldehyde',
    'cis-dichloroethene',
    'sulfur-tetrafluoride',
  ]);
  expect(found('d6h')).toStrictEqual(['benzene']);
});

test('a query that matches nothing keeps no section at all', () => {
  expect(librarySections('zzz')).toStrictEqual([]);
});
