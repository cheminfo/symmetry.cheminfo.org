/**
 * The cheatsheet, in the family's own shape.
 *
 * A section is a `ReferenceSection` from `react-cheminfo/ui`, so `ReferenceGrid`
 * draws it with no adapter. The one field this site adds is the **level**: a
 * section is coloured like the tutorial steps that taught it, and carrying the
 * level rather than a colour keeps every hex out of the content.
 */

import type { ExerciseLevel } from 'react-cheminfo/core';
import type { ReferenceRow, ReferenceSection } from 'react-cheminfo/ui';

export type { ReferenceRow, ReferenceSection } from 'react-cheminfo/ui';

/** One block of the printable reference. */
export interface SymmetrySection extends ReferenceSection {
  /** Which coloured group of tutorial steps this block belongs to. */
  level: ExerciseLevel;
}

/** A row with no rich tooltip: plain text, and enriched later. */
export function row(syntax: string, description: string): ReferenceRow {
  return { syntax, description };
}
