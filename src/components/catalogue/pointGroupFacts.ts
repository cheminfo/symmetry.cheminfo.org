/**
 * The line under a point group's symbol, and the definition rows beside its
 * stereogram. Split out of `pointGroupEntry.ts` only because the file would
 * otherwise pass the 250-line limit.
 */

import type { PointGroup } from '../../data/pointGroups.ts';
import { count } from '../../seo/describe.ts';

import type { EntryFact } from './types.ts';

/** The line under the symbol: what the group is, in one sentence. */
export function subtitleOf(group: PointGroup): string {
  const hand = group.chiral
    ? 'Chiral'
    : group.centrosymmetric
      ? 'Centrosymmetric'
      : 'Achiral';
  const polar = group.polar ? 'polar' : 'not polar';
  if (!Number.isFinite(group.order)) {
    return `The symmetry of a linear molecule. ${hand} and ${polar}.`;
  }
  const lattice = group.crystallographic
    ? `one of the 32 crystal classes, ${group.crystalSystem ?? ''}`
    : 'no lattice allows this axis';
  return `Order ${group.order}, ${count(group.classes.length, 'class', 'classes')} — ${lattice}. ${hand} and ${polar}.`;
}

/**
 * The definition rows beside the stereogram.
 * @param group - The group the page is about.
 * @returns One row per property, in the order a chemist reads them.
 */
export function factsOf(group: PointGroup): readonly EntryFact[] {
  return [
    { label: 'Schoenflies', value: group.schoenflies, mono: true },
    {
      label: 'Order',
      value: Number.isFinite(group.order) ? String(group.order) : 'infinite',
    },
    { label: 'Classes', value: String(group.classes.length) },
    { label: 'Principal axis', value: principalAxis(group), mono: true },
    ...latticeFacts(group),
    {
      label: 'Chirality',
      value: group.chiral
        ? 'chiral — every operation is a rotation'
        : 'achiral — it holds an improper operation',
    },
    {
      label: 'Polarity',
      value: group.polar
        ? 'polar — one direction is left free'
        : 'not polar — no direction survives every operation',
    },
    {
      label: 'Inversion',
      value: group.centrosymmetric ? 'it holds i' : 'no inversion centre',
    },
  ];
}

function latticeFacts(group: PointGroup): readonly EntryFact[] {
  if (group.hermannMauguin === null) {
    return [
      {
        label: 'Hermann-Mauguin',
        value: 'none — not one of the 32 crystal classes',
      },
    ];
  }
  const facts: EntryFact[] = [
    { label: 'Hermann-Mauguin', value: group.hermannMauguin, mono: true },
  ];
  if (group.hermannMauguinFull !== group.hermannMauguin) {
    facts.push({
      label: 'In full',
      value: group.hermannMauguinFull ?? '',
      mono: true,
    });
  }
  facts.push(
    { label: 'Crystal system', value: group.crystalSystem ?? '' },
    { label: 'Laue class', value: group.laueClass ?? '', mono: true },
  );
  return facts;
}

function principalAxis(group: PointGroup): string {
  if (!Number.isFinite(group.principalOrder)) return 'C∞';
  return group.principalOrder > 1 ? `C${group.principalOrder}` : 'none';
}
