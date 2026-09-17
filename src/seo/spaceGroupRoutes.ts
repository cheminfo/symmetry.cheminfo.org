/**
 * One address per space group: `/space-groups/62` is Pnma, whatever axes it is
 * written on.
 *
 * The **number** is the address, never a setting — the six settings of Pnma are
 * the same group in different axes, and carrying them in `?setting=` is what
 * keeps 230 pages indexed instead of 521 near-duplicates.
 *
 * The sentence is read off the group: its system, its centring, its class, how
 * many general positions the cell carries, whether an enantiomer can crystallise
 * in it and whether some origin removes every glide and screw. Two groups that
 * share a crystal class — 225 and 227 are both cubic m-3m — are told apart by
 * the clauses after the first, which is the point of writing them from the data.
 */

import type { RouteMeta } from 'react-cheminfo/core';

import type { Centring, SpaceGroupSetting } from '../data/spaceGroups.ts';
import {
  SPACE_GROUP_COUNT,
  spaceGroup,
  spaceGroupSettings,
} from '../symmetry/spaceGroups.ts';

import { count, describe } from './describe.ts';

const CENTRING_WORD: Readonly<Record<Centring, string>> = {
  P: 'primitive',
  A: 'A-centred',
  B: 'B-centred',
  C: 'C-centred',
  I: 'body-centred',
  F: 'face-centred',
  R: 'rhombohedrally centred',
};

/** `/space-groups/<number>` for all 230, in International Tables order. */
export function spaceGroupRoutes(): readonly RouteMeta[] {
  const routes: RouteMeta[] = [];
  for (let number = 1; number <= SPACE_GROUP_COUNT; number++) {
    routes.push(spaceGroupRoute(number));
  }
  return routes;
}

/**
 * The address, name and sentence of one space group, described from the setting
 * the page opens on.
 * @param number - The International Tables number, 1 to 230.
 * @throws {RangeError} When it is not one of the 230.
 */
export function spaceGroupRoute(number: number): RouteMeta {
  const setting = spaceGroup(number);
  const compact = setting.hmShort.replaceAll(' ', '');
  return {
    path: `/space-groups/${number}`,
    title: `${compact} — space group ${number}, ${setting.crystalSystem}`,
    description: describe(baseOf(setting, compact), extrasOf(setting)),
    short: compact,
  };
}

function baseOf(setting: SpaceGroupSetting, compact: string): string {
  return (
    `Space group ${setting.number}, ${setting.hmShort} (${compact}): ${setting.crystalSystem}, ` +
    `${CENTRING_WORD[setting.centring]} lattice, class ${setting.crystalClass}, ` +
    `${count(setting.multiplicity, 'general position')}.`
  );
}

function extrasOf(
  setting: SpaceGroupSetting,
): ReadonlyArray<readonly string[]> {
  return [
    characterClauses(setting),
    setting.hmFull === setting.hmShort
      ? []
      : [`Written ${setting.hmFull} in full.`],
    settingClauses(setting),
    [`Laue class ${setting.laueClass}.`],
  ];
}

/**
 * What the operation list makes of the group: whether one enantiomer can
 * crystallise in it, whether it holds the inversion, and whether some origin
 * removes every glide and screw.
 */
function characterClauses(setting: SpaceGroupSetting): readonly string[] {
  if (setting.sohncke) {
    return setting.symmorphic
      ? [
          'Symmorphic and Sohncke: no glide, no screw, and one enantiomer can crystallise in it.',
          'Symmorphic and Sohncke, so one enantiomer can crystallise in it.',
          'Symmorphic and Sohncke.',
        ]
      : [
          'Sohncke and not symmorphic: it carries a screw axis, and an enantiomer can crystallise in it.',
          'Sohncke and not symmorphic, so one enantiomer can crystallise in it.',
          'Sohncke and not symmorphic.',
        ];
  }
  if (setting.centrosymmetric) {
    return setting.symmorphic
      ? [
          'Centrosymmetric and symmorphic: it holds the inversion and carries no glide or screw.',
          'Centrosymmetric and symmorphic.',
        ]
      : [
          'Centrosymmetric, with a glide plane or a screw axis that no origin removes.',
          'Centrosymmetric, with a glide plane or a screw axis.',
          'Centrosymmetric and not symmorphic.',
        ];
  }
  return setting.symmorphic
    ? [
        'Symmorphic, and neither centrosymmetric nor Sohncke: improper operations, but no inversion.',
        'Symmorphic, and neither centrosymmetric nor Sohncke.',
      ]
    : [
        'Neither centrosymmetric nor Sohncke, and it carries a glide plane or a screw axis.',
        'Neither centrosymmetric nor Sohncke, and not symmorphic.',
      ];
}

function settingClauses(setting: SpaceGroupSetting): readonly string[] {
  const settings = spaceGroupSettings(setting.number).length;
  if (settings === 1) return ['One setting, so the axes are never in doubt.'];
  return [
    `${count(settings, 'setting')} of it are tabulated, on other axes or origins.`,
    `${count(settings, 'setting')} of it are tabulated.`,
  ];
}
