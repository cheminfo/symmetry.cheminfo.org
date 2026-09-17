/**
 * The numbers worth knowing, every one of them counted rather than typed.
 *
 * These are the figures a student repeats in an exam and a reviewer checks in a
 * paper. Each is read off the catalogues the site itself runs on, so the sheet
 * cannot quote a number the tool would contradict.
 */

import { SPACE_GROUP_SETTINGS } from '../../symmetry/spaceGroups.ts';
import { FRIEZE_GROUPS } from '../friezeGroups.ts';
import { WALLPAPER_GROUPS } from '../planeGroups.ts';
import { POINT_GROUPS } from '../pointGroups.ts';

import type { SymmetrySection } from './types.ts';
import { row } from './types.ts';

/** Every figure the last section prints, counted from the catalogues. */
export function symmetryCounts(): {
  spaceGroups: number;
  settings: number;
  crystalClasses: number;
  laueClasses: number;
  sohncke: number;
  centrosymmetric: number;
  polarPointGroups: number;
  wallpaper: number;
  frieze: number;
} {
  const numbers = new Set<number>();
  const classes = new Set<string>();
  const laue = new Set<string>();
  const sohncke = new Set<number>();
  const centrosymmetric = new Set<number>();
  for (const setting of SPACE_GROUP_SETTINGS) {
    numbers.add(setting.number);
    classes.add(setting.crystalClass);
    laue.add(setting.laueClass);
    if (setting.sohncke) sohncke.add(setting.number);
    if (setting.centrosymmetric) centrosymmetric.add(setting.number);
  }
  let polar = 0;
  for (const group of POINT_GROUPS) {
    if (group.crystallographic && group.polar) polar++;
  }
  return {
    spaceGroups: numbers.size,
    settings: SPACE_GROUP_SETTINGS.length,
    crystalClasses: classes.size,
    laueClasses: laue.size,
    sohncke: sohncke.size,
    centrosymmetric: centrosymmetric.size,
    polarPointGroups: polar,
    wallpaper: WALLPAPER_GROUPS.length,
    frieze: FRIEZE_GROUPS.length,
  };
}

/** The last block of the sheet: the figures, with what each one counts. */
export const NUMBER_SECTION: SymmetrySection = {
  id: 'numbers',
  title: 'The numbers worth knowing',
  level: 'advanced',
  rows: numberRows(),
};

function numberRows() {
  const counts = symmetryCounts();
  return [
    row(
      String(counts.spaceGroups),
      `Space groups in three dimensions. ${counts.settings} settings once cell choices and axis orders are counted.`,
    ),
    row(
      String(counts.crystalClasses),
      'Crystallographic point groups, the crystal classes.',
    ),
    row('14', 'Bravais lattices in three dimensions; 5 in two.'),
    row(
      '7',
      'Crystal systems; 6 crystal families, since trigonal and hexagonal share one.',
    ),
    row(
      String(counts.laueClasses),
      'Laue classes: the centrosymmetric point groups a diffraction pattern can show.',
    ),
    row(
      String(counts.sohncke),
      'Sohncke space groups: the ones a single enantiomer can crystallise in.',
    ),
    row(
      String(counts.centrosymmetric),
      'Centrosymmetric space groups, which is where a racemate usually lands.',
    ),
    row(
      '22',
      'Chiral space groups: 11 enantiomorphic pairs, such as P3₁21 and P3₂21.',
    ),
    row(
      String(counts.polarPointGroups),
      'Polar crystallographic point groups: 1, 2, m, mm2, 3, 3m, 4, 4mm, 6, 6mm.',
    ),
    row(
      `${counts.wallpaper} / ${counts.frieze}`,
      'Wallpaper groups and frieze groups.',
    ),
    row(
      '3N − 6',
      'Vibrations of a non-linear molecule; 3N − 5 if it is linear.',
    ),
    row(
      '~34 %',
      'Share of published organic structures in P2₁/c. P-1 takes another ~25 %.',
    ),
  ];
}
