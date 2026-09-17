/**
 * One address per molecular point group: what somebody searching `C2v character
 * table` or `Td symmetry` should land on.
 *
 * Every sentence is read off the group's own record — its operations, its
 * classes, its Hermann-Mauguin symbol, whether it is chiral, and the molecule
 * the library holds for it — so no two of the fifty-three read alike.
 */

import type { RouteMeta } from 'react-cheminfo/core';

import { characterTableOf } from '../data/characterTables.ts';
import { moleculesOfGroup } from '../data/molecules.ts';
import type { PointGroup } from '../data/pointGroups.ts';
import { POINT_GROUPS } from '../data/pointGroups.ts';

import { count, describe } from './describe.ts';

/** `/point-groups/<slug>` for every point group the catalogue holds. */
export function pointGroupRoutes(): readonly RouteMeta[] {
  return POINT_GROUPS.map(pointGroupRoute);
}

/** The address, name and sentence of one point group. */
export function pointGroupRoute(group: PointGroup): RouteMeta {
  return {
    path: `/point-groups/${group.slug}`,
    title: titleOf(group),
    description: describe(baseOf(group), extrasOf(group)),
    short: group.schoenflies,
  };
}

function titleOf(group: PointGroup): string {
  if (!Number.isFinite(group.order)) {
    return `${group.schoenflies} point group — a linear molecule`;
  }
  if (group.hermannMauguin !== null) {
    return `${group.schoenflies} point group — order ${group.order}, Hermann-Mauguin ${group.hermannMauguin}`;
  }
  return `${group.schoenflies} point group — order ${group.order}`;
}

function baseOf(group: PointGroup): string {
  const classes = group.classes.map((entry) => entry.label).join(', ');
  const operations = Number.isFinite(group.order)
    ? count(group.order, 'symmetry operation')
    : 'infinitely many symmetry operations';
  return `The ${group.schoenflies} point group has ${operations} in ${count(group.classes.length, 'class', 'classes')}: ${classes}.`;
}

function extrasOf(group: PointGroup): ReadonlyArray<readonly string[]> {
  return [
    latticeClauses(group),
    moleculeClauses(group),
    shapeClauses(group),
    group.laueClass === null ? [] : [`Laue class ${group.laueClass}.`],
    tableClauses(group),
  ];
}

function latticeClauses(group: PointGroup): readonly string[] {
  if (group.hermannMauguin === null) {
    return [
      'No lattice allows this axis, so it is not one of the 32 crystal classes.',
      'Not one of the 32 crystal classes.',
    ];
  }
  return [
    `Hermann-Mauguin ${group.hermannMauguin}, one of the 32 crystal classes, ${group.crystalSystem ?? ''}.`,
    `Hermann-Mauguin ${group.hermannMauguin}, one of the 32 crystal classes.`,
    `Hermann-Mauguin ${group.hermannMauguin}.`,
  ];
}

function moleculeClauses(group: PointGroup): readonly string[] {
  const [first] = moleculesOfGroup(group.id);
  if (first === undefined) return [];
  return [
    `${first.name} (${first.formula}) belongs to it.`,
    `${first.formula} belongs to it.`,
  ];
}

function shapeClauses(group: PointGroup): readonly string[] {
  const clauses: string[] = [];
  if (group.chiral && group.polar) {
    clauses.push(
      'Chiral and polar: a molecule in it is optically active and may carry a dipole.',
      'Chiral and polar.',
    );
  } else if (group.chiral) {
    clauses.push(
      'Chiral: every operation is a rotation, so a molecule in it is optically active.',
      'Chiral, so a molecule in it is optically active.',
    );
  } else if (group.polar) {
    clauses.push(
      'Polar: one direction is left free, so a molecule in it may carry a dipole.',
      'Polar, so a molecule in it may carry a dipole.',
    );
  }
  if (group.centrosymmetric) {
    clauses.push(
      'Centrosymmetric: it holds the inversion, so every irrep is labelled g or u.',
      'Centrosymmetric, so every irrep is labelled g or u.',
      'Centrosymmetric.',
    );
  } else if (!group.chiral && !group.polar) {
    clauses.push(
      'It holds improper operations but no inversion, so it is neither chiral nor polar.',
      'Neither chiral nor polar, and it holds no inversion.',
    );
  }
  return clauses;
}

function tableClauses(group: PointGroup): readonly string[] {
  if (characterTableOf(group.id) !== undefined) {
    return [
      'Its character table is here, with those classes as the columns.',
      'Its character table is here.',
    ];
  }
  return [
    'The site ships no character table for it, only its operations.',
    'The site ships no character table for it.',
  ];
}
