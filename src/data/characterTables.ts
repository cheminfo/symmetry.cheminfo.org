import { CNH_TABLES, CNV_TABLES } from './characterTables/axial.ts';
import { CUBIC_TABLES } from './characterTables/cubic.ts';
import { CYCLIC_TABLES } from './characterTables/cyclic.ts';
import { DNH_TABLES, DN_TABLES } from './characterTables/dihedral.ts';
import { DND_TABLES, SN_TABLES } from './characterTables/improper.ts';
import type { CharacterTable } from './characterTables/types.ts';

export type {
  Character,
  CharacterTable,
  Complex,
  Irrep,
} from './characterTables/types.ts';
export {
  imaginaryPart,
  isComplex,
  omega,
  realPart,
} from './characterTables/types.ts';

/**
 * Every character table the site ships, one per point group.
 *
 * The two linear groups are absent on purpose: `C∞v` and `D∞h` have infinitely
 * many irreps and a continuum for a class, so they are not tables of numbers and
 * none of the finite checks apply to them.
 */
export const CHARACTER_TABLES: readonly CharacterTable[] = [
  ...CYCLIC_TABLES,
  ...CNV_TABLES,
  ...CNH_TABLES,
  ...DN_TABLES,
  ...DNH_TABLES,
  ...DND_TABLES,
  ...SN_TABLES,
  ...CUBIC_TABLES,
];

const BY_GROUP = new Map(CHARACTER_TABLES.map((table) => [table.group, table]));

/** The table of a group, or `undefined` when the site ships none for it. */
export function characterTableOf(group: string): CharacterTable | undefined {
  return BY_GROUP.get(group);
}
