/**
 * What the readout says about the group on screen.
 *
 * A wallpaper group and a frieze group answer different questions — one has a
 * lattice, the other a strip — so the two lists differ, and both name the
 * **generators**: the two or three operations everything else on the page was
 * built from.
 */

import { FRIEZE_TO_WALLPAPER } from '../../data/friezeGroups.ts';

import type { PlaneGroupChoice } from './planeGroupRef.ts';

/** One line of the readout: what it is called, and what it says. */
export type PlaneFact = readonly [term: string, value: string];

/**
 * The rows of the readout, in reading order.
 * @param choice - From `resolvePlaneGroup`.
 * @returns The rows; the terms are unique, so each one is its own React key.
 */
export function planeGroupFacts(choice: PlaneGroupChoice): PlaneFact[] {
  if (choice.kind === 'wallpaper') {
    const group = choice.group;
    return [
      ['Number', `${group.number} of 17`],
      ['Full symbol', group.full],
      ['Orbifold', group.orbifold],
      ['Point group', group.pointGroup],
      ['Lattice', latticeText(group.lattice)],
      ['Generators', generatorText(group.generators)],
      ['Operations', `${group.operationsPerCell} per cell`],
      ['Asymmetric unit', group.fundamentalDomain],
    ];
  }
  const group = choice.group;
  return [
    ['Number', `${group.number} of 7`],
    ['Full symbol', group.full],
    ['Orbifold', group.orbifold],
    ["Conway's name", group.conway],
    ['Point group', group.pointGroup],
    ['Generators', generatorText(group.generators)],
    ['Operations', `${group.operationsPerPeriod} per period`],
    ['Asymmetric unit', group.fundamentalDomain],
    ['Strip of', stripOf(group.id)],
  ];
}

/**
 * The generators, as triplets.
 *
 * p1 has none in either namespace: its cell is filled by the lattice
 * translations, which every plane group carries and none of them lists.
 */
export function generatorText(generators: string): string {
  const written: string[] = [];
  for (const triplet of generators.split(';')) {
    const trimmed = triplet.trim();
    if (trimmed.length > 0) written.push(trimmed);
  }
  return written.length === 0
    ? 'None: the lattice translations alone fill the plane.'
    : written.join(' · ');
}

/** A centred lattice repeats every operation at the cell centre as well. */
function latticeText(lattice: string): string {
  return lattice === 'centred-rectangular'
    ? 'centred rectangular, so every operation repeats at (1/2, 1/2)'
    : lattice;
}

/** Which of the seventeen a frieze group becomes once **b** translates too. */
function stripOf(id: string): string {
  return `${FRIEZE_TO_WALLPAPER[id] ?? 'p1'}, once the second translation is added`;
}
