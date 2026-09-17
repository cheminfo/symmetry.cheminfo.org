import { AXIAL_MOLECULES } from './molecules/axial.ts';
import { CAGE_MOLECULES } from './molecules/cages.ts';
import { PLANAR_MOLECULES } from './molecules/planar.ts';
import { POLAR_MOLECULES } from './molecules/polar.ts';
import { SMALL_MOLECULES } from './molecules/small.ts';
import type { MoleculeEntry } from './molecules/types.ts';

export type { MoleculeAtom, MoleculeEntry } from './molecules/types.ts';

/**
 * The molecule library: every geometry is **built**, from the bond lengths and
 * angles quoted in its `geometrySource`, and is therefore exactly symmetric.
 *
 * A structure from a conformer generator is symmetric to about a tenth of an
 * ångström, which is the same tolerance at which a 55° ethane passes for
 * staggered — so a taught example cannot come from one. What a real structure is
 * for is the tolerance slider, where the point being taught is precisely that
 * the answer depends on it.
 */
export const MOLECULES: readonly MoleculeEntry[] = [
  ...SMALL_MOLECULES,
  ...POLAR_MOLECULES,
  ...PLANAR_MOLECULES,
  ...AXIAL_MOLECULES,
  ...CAGE_MOLECULES,
];

const BY_ID = new Map(MOLECULES.map((entry) => [entry.id, entry]));

/** The molecule with this id, or `undefined` for an address nobody minted. */
export function moleculeById(id: string): MoleculeEntry | undefined {
  return BY_ID.get(id);
}

/** Every molecule the library holds for a point group. */
export function moleculesOfGroup(group: string): readonly MoleculeEntry[] {
  return MOLECULES.filter((entry) => entry.pointGroup === group);
}

/**
 * The molecules of §5.2 of the domain report that the library does **not** hold,
 * and why — a coordinate set that is only nearly symmetric teaches the wrong
 * group, so a molecule whose geometry cannot be built exactly is left out rather
 * than approximated.
 */
export const MOLECULES_NOT_BUILT: ReadonlyArray<{
  readonly name: string;
  readonly pointGroup: string;
  readonly reason: string;
}> = [
  {
    name: 'Thiophene',
    pointGroup: 'C2v',
    reason:
      'A five-ring with three different bond lengths: the reported lengths and angles over-determine the ring and no exact closure follows from them.',
  },
  {
    name: 'Corannulene',
    pointGroup: 'C5v',
    reason:
      'The bowl depth is not tabulated anywhere in the report; it needs an optimised structure, which is symmetric only to about a tenth of an ångström.',
  },
  {
    name: 'Tris(ethylenediamine)cobalt(III)',
    pointGroup: 'D3',
    reason:
      'The chelate backbone is described but not tabulated. Ethane at 30° is the exact D3 example the library ships instead.',
  },
  {
    name: 'Cyclooctatetraene, tub',
    pointGroup: 'D2d',
    reason:
      'The tub over-determines the ring, as thiophene does. Biphenyl at 90° is the exact D2d example the library ships instead.',
  },
  {
    name: 'Octafluorotantalate(V)',
    pointGroup: 'D4d',
    reason:
      'No bond length is given, and the square antiprism needs two. The S8 crown covers D4d.',
  },
  {
    name: 'Hexaamminecobalt(III)',
    pointGroup: 'Oh',
    reason:
      'The report treats each ammonia as a cone, which is not a structure. SF6 and cubane cover Oh.',
  },
];
