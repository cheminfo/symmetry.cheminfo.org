/**
 * The printable cheatsheet: eleven blocks, in the order they are taught.
 *
 * Students print this page and take it into an exam room, so every block is
 * short enough to read on paper and nothing on it needs a pointer. A block
 * carries its tutorial level rather than a colour, and the page paints it.
 */

import { CHARACTER_SECTION, FLOWCHART_SECTION } from './assignment.ts';
import { BRAVAIS_SECTION, SYSTEM_SECTION } from './lattices.ts';
import { NUMBER_SECTION } from './numbers.ts';
import { FAMILY_SECTION, OPERATION_SECTION } from './operations.ts';
import { FRIEZE_SECTION, WALLPAPER_SECTION } from './plane.ts';
import { ABSENCE_SECTION, SYMBOL_SECTION } from './symbols.ts';
import type { SymmetrySection } from './types.ts';

export type {
  ReferenceRow,
  ReferenceSection,
  SymmetrySection,
} from './types.ts';
export { spaceGroupsPerSystem } from './lattices.ts';
export { symmetryCounts } from './numbers.ts';
export { FRIEZE_NOTES, WALLPAPER_NOTES } from './plane.ts';

/** Every block of the cheatsheet, in reading order. */
export const REFERENCE_SECTIONS: readonly SymmetrySection[] = [
  OPERATION_SECTION,
  FAMILY_SECTION,
  FLOWCHART_SECTION,
  CHARACTER_SECTION,
  SYSTEM_SECTION,
  BRAVAIS_SECTION,
  SYMBOL_SECTION,
  ABSENCE_SECTION,
  WALLPAPER_SECTION,
  FRIEZE_SECTION,
  NUMBER_SECTION,
];

/** How many lines the whole sheet holds, for the page to say so. */
export const REFERENCE_ROW_COUNT: number = REFERENCE_SECTIONS.reduce(
  (total, section) => total + section.rows.length,
  0,
);
