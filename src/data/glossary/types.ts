/**
 * The shape of a definition on this site.
 *
 * The family's `GlossaryEntry` is generic in its example, and here an example
 * is not a line of code: it is **an object plus what to look at in it**. That is
 * what lets a definition be clicked — the term opens the molecule, the cell or
 * the pattern the sentence is about, with the thing it names already drawn.
 */

import type { Glossary, GlossaryEntry } from 'react-cheminfo/core';

import type { ObjectRef } from './objects.ts';

export type { ObjectMode, ObjectRef } from './objects.ts';
export { objectRefExists, objectRefMode, splitObjectRef } from './objects.ts';

/** One worked example: an object, and what it shows. */
export interface SymmetryExample {
  /** What clicking the example opens. */
  readonly object: ObjectRef;
  /** What to look at, in one clause. */
  readonly observation: string;
  /**
   * Why it is worth looking at, in one sentence.
   * @default undefined
   */
  readonly note?: string;
}

/** One term of this site's glossary. */
export type SymmetryGlossaryEntry = GlossaryEntry<SymmetryExample>;

/** Every term, keyed by the lowercased text inside a `[[marker]]`. */
export type SymmetryGlossary = Glossary<SymmetryExample>;
