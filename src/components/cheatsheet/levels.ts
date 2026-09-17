/**
 * How a block of the printed sheet is coloured.
 *
 * A block carries the level of the tutorial steps that taught it, and the
 * colour is derived from the family's own level palette rather than from three
 * hexes typed here — so the sheet, the tutorial strip and the exercise tags
 * name a difficulty in the same colour on every site.
 */

import type { ExerciseLevel } from 'react-cheminfo/core';
import { TUTORIAL_LEVEL_COLOURS } from 'react-cheminfo/ui';

import type {
  ReferenceSection,
  SymmetrySection,
} from '../../data/reference/index.ts';

/**
 * The cheatsheet's blocks, each carrying the colour of its level.
 * @param sections - From `REFERENCE_SECTIONS`.
 * @returns The same blocks, ready for `ReferenceGrid`.
 */
export function colouredSections(
  sections: readonly SymmetrySection[],
): ReferenceSection[] {
  const coloured: ReferenceSection[] = [];
  for (const section of sections) {
    coloured.push({ ...section, color: levelColour(section.level) });
  }
  return coloured;
}

/**
 * How much of the pale level colour survives once it is darkened enough to be
 * read as text. At 45 % the hue is still obvious and the contrast on white is
 * past 6:1, which a 13 px heading needs.
 */
const INK = 45;

/**
 * The colour a heading of that level is set in.
 *
 * The family's level shades are made to sit *behind* a strip of buttons, so a
 * heading set in one is unreadable. Mixing towards black keeps the hue and buys
 * the contrast, and invents no fourth colour.
 * @param level - Which of the three.
 * @returns A CSS colour, ready for an inline style.
 */
export function levelColour(level: ExerciseLevel): string {
  const pale = TUTORIAL_LEVEL_COLOURS[level].activeBackground;
  return `color-mix(in oklab, ${pale} ${INK}%, black)`;
}

/** One entry of the legend: a level, what it is called, and what it covers here. */
export interface LevelLegendEntry {
  readonly level: ExerciseLevel;
  readonly label: string;
  /** What that level covers on this sheet, for the printed line. */
  readonly covers: string;
}

/** The three levels in teaching order, as the legend names them. */
export const LEVEL_LEGEND: readonly LevelLegendEntry[] = [
  {
    level: 'beginner',
    label: 'Beginner',
    covers: 'operations and point groups',
  },
  { level: 'intermediate', label: 'Intermediate', covers: 'character tables' },
  { level: 'advanced', label: 'Advanced', covers: 'crystals and patterns' },
];

/** The one line the paper carries in place of the legend on screen. */
export function printedLegend(): string {
  const parts: string[] = [];
  for (const entry of LEVEL_LEGEND) {
    parts.push(`${entry.label}: ${entry.covers}`);
  }
  return parts.join(' · ');
}
