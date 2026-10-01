/**
 * What a space group's page says in the HTML, before anything runs.
 *
 * Two hundred and thirty addresses shipped one body between them, so a crawler
 * was handed the same text for P1 and for Fm-3m. Everything below is read off
 * the group's own setting record, which is also what the page shows.
 */

import type { PageContent, PageTable } from 'react-cheminfo/core';

import type { Centring, SpaceGroupSetting } from '../data/spaceGroups.ts';
import { spaceGroup, spaceGroupSettings } from '../symmetry/spaceGroups.ts';

import { count } from './describe.ts';

const CENTRING_WORD: Readonly<Record<Centring, string>> = {
  P: 'primitive',
  A: 'A-centred',
  B: 'B-centred',
  C: 'C-centred',
  I: 'body-centred',
  F: 'face-centred',
  R: 'rhombohedrally centred',
};

/**
 * The text of one space group's page.
 * @param number - The International Tables number, 1 to 230.
 * @returns What the page says.
 * @throws {RangeError} When it is not one of the 230.
 */
export function spaceGroupContent(number: number): PageContent {
  const setting = spaceGroup(number);
  const compact = setting.hmShort.replaceAll(' ', '');

  return {
    heading: `Space group ${number}: ${compact}`,
    paragraphs: paragraphsOf(setting, compact),
    table: settingTable(number),
  };
}

function paragraphsOf(setting: SpaceGroupSetting, compact: string): string[] {
  const full =
    setting.hmFull === setting.hmShort
      ? ''
      : ` It is written ${setting.hmFull} in full, which spells out the direction of every element.`;

  const paragraphs = [
    `${compact} is number ${setting.number} of the 230 space groups: a ${CENTRING_WORD[setting.centring]} ${setting.crystalSystem} lattice carrying the point-group class ${setting.crystalClass}. A general position in its cell is repeated ${count(setting.multiplicity, 'time')}.${full}`,
    character(setting),
    `A diffraction pattern from a crystal in it shows the Laue symmetry ${setting.laueClass}, so that is the most the symmetry of the intensities can tell you before the structure is solved.`,
  ];

  if (setting.hmLegacy !== null) {
    paragraphs.push(
      `Older literature spells it ${setting.hmLegacy}; the International Tables renamed it in 2002, and both names mean this group.`,
    );
  }
  return paragraphs;
}

/** What its operation list means for a structure solved in it. */
function character(setting: SpaceGroupSetting): string {
  const clauses = [
    setting.sohncke
      ? 'It holds only proper operations, so a single enantiomer can crystallise in it — which is why it is one of the groups a chiral molecule is found in.'
      : 'It holds an improper operation, so a single enantiomer cannot crystallise in it.',
  ];
  if (setting.centrosymmetric) {
    clauses.push(
      'It contains the inversion, which halves the number of independent reflections and settles the phase problem differently from a non-centrosymmetric group.',
    );
  }
  clauses.push(
    setting.symmorphic
      ? 'It is symmorphic: some origin removes every glide plane and screw axis.'
      : 'It is not symmorphic: no choice of origin removes its glide planes and screw axes, so systematic absences give it away in the diffraction pattern.',
  );
  return clauses.join(' ');
}

/** Every setting the International Tables tabulate for the number. */
function settingTable(number: number): PageTable {
  const settings = spaceGroupSettings(number);
  const rows: string[][] = [];
  for (const setting of settings) {
    rows.push([
      setting.hmSetting,
      setting.hall ?? '—',
      setting.uniqueAxis ?? setting.axes ?? '—',
      setting.originChoice === null ? '—' : String(setting.originChoice),
    ]);
  }
  return {
    columns: ['Setting', 'Hall symbol', 'Axes', 'Origin'],
    rows,
    caption:
      settings.length === 1
        ? 'One setting is tabulated, so the axes of this group are never in doubt.'
        : `${count(settings.length, 'setting')} are tabulated: the same group written on other axes or about another origin. The address carries the number, never the setting.`,
  };
}
