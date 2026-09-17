/**
 * Every term this site defines, keyed by the lowercased text of a `[[marker]]`.
 *
 * The files are split by subject rather than by page, because a term belongs to
 * the chemistry and not to the screen it happens to be read on: `[[class]]` is
 * linked from a tutorial step, an exercise and a cheatsheet row alike.
 */

import { CRYSTAL_TERMS } from './crystals.ts';
import { GROUP_TERMS } from './groups.ts';
import { LATTICE_TERMS } from './lattices.ts';
import { OPERATION_TERMS } from './operations.ts';
import { PLANE_TERMS } from './plane.ts';
import { REPRESENTATION_TERMS } from './representations.ts';
import type { SymmetryGlossary } from './types.ts';

export type {
  ObjectMode,
  ObjectRef,
  SymmetryExample,
  SymmetryGlossary,
  SymmetryGlossaryEntry,
} from './types.ts';
export { objectRefExists, objectRefMode, splitObjectRef } from './objects.ts';
export { CRYSTAL_TERMS } from './crystals.ts';
export { GROUP_TERMS } from './groups.ts';
export { LATTICE_TERMS } from './lattices.ts';
export { OPERATION_TERMS } from './operations.ts';
export { PLANE_TERMS } from './plane.ts';
export { REPRESENTATION_TERMS } from './representations.ts';

/** The glossary, merged in reading order. */
export const GLOSSARY: SymmetryGlossary = {
  ...OPERATION_TERMS,
  ...GROUP_TERMS,
  ...REPRESENTATION_TERMS,
  ...LATTICE_TERMS,
  ...CRYSTAL_TERMS,
  ...PLANE_TERMS,
};

/** Every term, in the order the glossary page lists them. */
export const GLOSSARY_TERMS: readonly string[] = Object.keys(GLOSSARY);
