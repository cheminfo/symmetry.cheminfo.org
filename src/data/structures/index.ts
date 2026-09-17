/**
 * The structures the crystal workbench ships, as CIF files.
 *
 * They are real files, not TypeScript literals, so the site's own examples go
 * through exactly the import path a dropped file takes: a parser that broke
 * would fail the test suite rather than fail in front of a class. The text is
 * bundled, the parse is done once per structure and then kept.
 */

import type { CrystalStructure } from '../../crystal/cif/index.ts';
import { readCif } from '../../crystal/cif/index.ts';
import type { SpaceGroupSetting } from '../../symmetry/spaceGroups.ts';
import { spaceGroup } from '../../symmetry/spaceGroups.ts';

import { STRUCTURE_ENTRIES } from './entries.ts';
import type { StructureEntry } from './types.ts';

export type { StructureEntry, StructureSource } from './types.ts';

const CIF_TEXT: Record<string, string> = import.meta.glob('./*.cif', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Every structure the picker offers, simplest first. */
export const STRUCTURES: readonly StructureEntry[] = STRUCTURE_ENTRIES;

const BY_ID = new Map(STRUCTURES.map((entry) => [entry.id, entry]));
const PARSED = new Map<string, CrystalStructure>();

/** The entry with this id, or `undefined` for an address nobody minted. */
export function structureById(id: string): StructureEntry | undefined {
  return BY_ID.get(id);
}

/**
 * The CIF text of one structure, exactly as the file holds it.
 *
 * @param id - A {@link StructureEntry} id.
 * @throws When no structure has that id.
 */
export function structureCif(id: string): string {
  const text = CIF_TEXT[`./${id}.cif`];
  if (text === undefined) {
    throw new RangeError(`no structure is called "${id}"`);
  }
  return text;
}

/**
 * One structure, read from its file. The parse is kept, so opening it again
 * costs nothing.
 *
 * @param id - A {@link StructureEntry} id.
 * @throws When no structure has that id.
 */
export function structureOf(id: string): CrystalStructure {
  const known = PARSED.get(id);
  if (known !== undefined) return known;
  const structure = readCif(structureCif(id));
  PARSED.set(id, structure);
  return structure;
}

/**
 * The setting one structure is written in — its symbol, its system, its
 * centring and the rest, read off the catalogue rather than off the record.
 *
 * @param entry - A library entry.
 * @throws When the entry names a setting that does not exist, which its own
 *   test makes impossible.
 */
export function structureSetting(entry: StructureEntry): SpaceGroupSetting {
  return spaceGroup(entry.spaceGroupNumber, entry.variant);
}
