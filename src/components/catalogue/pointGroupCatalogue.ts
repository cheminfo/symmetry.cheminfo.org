/**
 * The point-group index: the fifty-three, grouped the way a chemist assigns a
 * molecule and narrowed by what a student is looking for.
 *
 * The blocks are the families of the flowchart — no axis, one axis, an axis
 * with mirrors, dihedral, improper, cubic, icosahedral, linear — so the index
 * reads in the order the assignment is made rather than alphabetically.
 */

import { moleculesOfGroup } from '../../data/molecules.ts';
import type { PointGroup, PointGroupFamily } from '../../data/pointGroups.ts';
import { POINT_GROUPS } from '../../data/pointGroups.ts';
import { count } from '../../seo/describe.ts';

import { pointGroupEntry } from './pointGroupEntry.ts';
import type { CatalogueDescriptor, CatalogueRow } from './types.ts';

/** What each family is called, and what puts a molecule in it. */
export const FAMILY_LABELS: Record<PointGroupFamily, string> = {
  nonaxial: 'No axis at all',
  Cn: 'One axis, and nothing else',
  Cnv: 'An axis, with mirrors that contain it',
  Cnh: 'An axis, with a mirror across it',
  Dn: 'An axis, with n two-folds across it',
  Dnh: 'Dihedral, with a horizontal mirror',
  Dnd: 'Dihedral, with diagonal mirrors',
  Sn: 'An improper axis alone',
  cubic: 'Several high-order axes: the cubic groups',
  icosahedral: 'Six five-fold axes: the icosahedral groups',
  linear: 'Linear molecules',
};

/** The catalogue at `/point-groups`. */
export const POINT_GROUP_CATALOGUE: CatalogueDescriptor = {
  tab: 'point-groups',
  title: 'Point groups',
  intro:
    'Every point group a molecule can belong to, with its operations, its classes and its character table.',
  searchHint: 'Search a symbol, a molecule or a formula',
  rows: POINT_GROUPS.map(rowOf),
  facets: [
    {
      id: 'kind',
      label: 'Showing',
      allLabel: 'Every group',
      options: [
        { value: 'crystallographic', label: 'One of the 32' },
        { value: 'chiral', label: 'Chiral' },
        { value: 'polar', label: 'Polar' },
        { value: 'centrosymmetric', label: 'Centrosymmetric' },
        { value: 'molecules', label: 'Has a molecule here' },
      ],
    },
  ],
  entry: (id) => pointGroupEntry(id),
};

/** One group as the index lists it. */
export function rowOf(group: PointGroup): CatalogueRow {
  const molecules = moleculesOfGroup(group.id);
  const tags: string[] = [];
  if (group.crystallographic) tags.push('crystallographic');
  if (group.chiral) tags.push('chiral');
  if (group.polar) tags.push('polar');
  if (group.centrosymmetric) tags.push('centrosymmetric');
  if (molecules.length > 0) tags.push('molecules');
  const names = molecules.map((entry) => `${entry.name} ${entry.formula}`);
  return {
    id: group.slug,
    symbol: group.schoenflies,
    detail: detailOf(group),
    group: FAMILY_LABELS[group.family],
    tags,
    search: [
      group.id,
      group.schoenflies,
      group.hermannMauguin ?? '',
      group.hermannMauguinFull ?? '',
      group.crystalSystem ?? '',
      ...names,
    ]
      .join(' ')
      .toLowerCase(),
    // The short Hermann-Mauguin symbol exists only for the 32 classes a lattice
    // allows, so printing it *is* the flag that this group is one of them.
    ...(group.hermannMauguin === null ? {} : { badge: group.hermannMauguin }),
  };
}

function detailOf(group: PointGroup): string {
  if (!Number.isFinite(group.order)) {
    return 'Infinitely many operations, in infinitely many classes.';
  }
  const counts = `${count(group.order, 'operation')}, ${count(group.classes.length, 'class', 'classes')}`;
  return group.crystalSystem === null
    ? `${counts}.`
    : `${counts}, ${group.crystalSystem}.`;
}
