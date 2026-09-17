import type { MoleculeAtom } from './build.ts';

export type { MoleculeAtom } from './build.ts';

/** One molecule of the library, with the geometry a point group is read off. */
export interface MoleculeEntry {
  /** Stable id, what a URL and a `localStorage` key carry. */
  readonly id: string;
  readonly name: string;
  /** The formula, rendered with `react-mf` and never as a bare string. */
  readonly formula: string;
  /** The `PointGroup.id` the detector must return for these coordinates. */
  readonly pointGroup: string;
  /** One clause: why this group and not the neighbouring one. */
  readonly why: string;
  /** The exact ideal geometry, in ångström. */
  readonly atoms: readonly MoleculeAtom[];
  /** Where the bond lengths and angles come from, including what was idealised. */
  readonly geometrySource: string;
  /** For the 2D depiction and the "build your own" path only. */
  readonly smiles?: string;
}

/** The entry, with the atoms built last so a constructor can be written inline. */
export function molecule(
  entry: Omit<MoleculeEntry, 'atoms'>,
  atoms: readonly MoleculeAtom[],
): MoleculeEntry {
  return { ...entry, atoms };
}
