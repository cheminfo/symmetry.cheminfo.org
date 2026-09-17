/**
 * The library, arranged the way the picker shows it.
 *
 * Molecules are listed under their point group and the groups run in the order
 * the catalogue does — the order a chemist meets them — so scrolling the list
 * is itself a tour from C₁ to I_h.
 */

import type { MoleculeEntry } from '../../data/molecules.ts';
import { MOLECULES, moleculeById } from '../../data/molecules.ts';
import type { PointGroup } from '../../data/pointGroups.ts';
import { POINT_GROUPS } from '../../data/pointGroups.ts';

/**
 * What `/` opens on.
 *
 * Water, because it is the molecule every course starts with: two operations
 * you can see without being told what to look for, and a group small enough
 * that its character table fits beside the structure.
 */
export const DEFAULT_MOLECULE_ID = 'water';

/** One point group, and the molecules the library holds for it. */
export interface LibrarySection {
  readonly group: PointGroup;
  readonly molecules: readonly MoleculeEntry[];
}

/**
 * The molecule on the workbench.
 *
 * @param id - What the address names, or `null` when it names nothing.
 * @returns That molecule, or the default one — an address from a course made
 *   before a rename must open the tool, never an empty page.
 */
export function resolveMolecule(id: string | null): MoleculeEntry {
  const named = id === null ? undefined : moleculeById(id);
  if (named !== undefined) return named;
  const fallback = moleculeById(DEFAULT_MOLECULE_ID);
  if (fallback === undefined) {
    throw new RangeError(`the library has no ${DEFAULT_MOLECULE_ID}`);
  }
  return fallback;
}

/**
 * The library, by point group, keeping only what a search matches.
 *
 * @param query - What the student typed; blank shows everything.
 * @returns The sections that hold at least one match, in catalogue order.
 */
export function librarySections(query: string): readonly LibrarySection[] {
  const needle = query.trim().toLowerCase();
  const sections: LibrarySection[] = [];
  for (const group of POINT_GROUPS) {
    const molecules: MoleculeEntry[] = [];
    for (const entry of MOLECULES) {
      if (entry.pointGroup !== group.id) continue;
      if (matches(entry, group, needle)) molecules.push(entry);
    }
    if (molecules.length > 0) sections.push({ group, molecules });
  }
  return sections;
}

/** Whether a molecule answers a search: its name, formula, id or group. */
function matches(
  entry: MoleculeEntry,
  group: PointGroup,
  needle: string,
): boolean {
  if (needle === '') return true;
  return (
    entry.name.toLowerCase().includes(needle) ||
    entry.formula.toLowerCase().includes(needle) ||
    entry.id.includes(needle) ||
    group.id.toLowerCase().includes(needle) ||
    group.schoenflies.toLowerCase().includes(needle)
  );
}
