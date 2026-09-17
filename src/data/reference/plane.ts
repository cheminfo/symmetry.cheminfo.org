/**
 * The 17 and the 7, built from the catalogues.
 *
 * Only the teaching clause is authored here. The orbifold symbol, the lattice
 * and Conway's name come from the group records, so the printed sheet and the
 * tool can never disagree — and a group missing its clause fails the tests
 * rather than printing a blank.
 */

import { FRIEZE_GROUPS } from '../friezeGroups.ts';
import { WALLPAPER_GROUPS } from '../planeGroups.ts';

import type { SymmetrySection } from './types.ts';
import { row } from './types.ts';

/** What to look for in each wallpaper group, one clause each. */
export const WALLPAPER_NOTES: Record<string, string> = {
  p1: 'translation only',
  p2: 'four inequivalent twofold centres, no mirror',
  pm: 'mirrors one way, no rotation',
  pg: 'glides only, and no mirror at all',
  cm: 'a mirror, with a glide line between each pair',
  pmm: 'mirrors both ways, twofold centres where they cross',
  pmg: 'mirrors one way, glides the other',
  pgg: 'glides both ways, and no mirror at all',
  cmm: 'mirrors both ways, plus twofold centres off every mirror',
  p4: 'fourfold centres, no mirror',
  p4m: 'every fourfold centre where two mirrors cross',
  p4g: 'fourfold centres off the mirrors, glides between them',
  p3: 'threefold centres, no mirror',
  p3m1: 'all three threefold centres on mirror lines',
  p31m: 'one threefold centre off every mirror line',
  p6: 'sixfold centres, no mirror',
  p6m: 'the most symmetric of the seventeen',
};

/** What repeats along the strip, one clause each. */
export const FRIEZE_NOTES: Record<string, string> = {
  p1: 'translation only',
  p11g: 'a glide along the strip — footprints',
  p1m1: 'mirrors across the strip',
  p11m: 'one mirror running along the strip',
  p2: 'half-turns, no mirror',
  p2mg: 'vertical mirrors, a glide, and half-turns',
  p2mm: 'mirrors both ways, and half-turns',
};

/** The 17, each with its orbifold symbol and lattice. */
export const WALLPAPER_SECTION: SymmetrySection = {
  id: 'wallpaper',
  title: 'The 17 wallpaper groups',
  level: 'advanced',
  rows: WALLPAPER_GROUPS.map((group) =>
    row(
      group.id,
      `${group.orbifold} · ${group.lattice} · ${WALLPAPER_NOTES[group.id] ?? ''}`,
    ),
  ),
};

/** The 7, each with its orbifold symbol and Conway's name. */
export const FRIEZE_SECTION: SymmetrySection = {
  id: 'frieze',
  title: 'The 7 frieze groups',
  level: 'advanced',
  rows: FRIEZE_GROUPS.map((group) =>
    row(
      group.id,
      `${group.orbifold} · ${group.conway} · ${FRIEZE_NOTES[group.id] ?? ''}`,
    ),
  ),
};
