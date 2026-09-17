/**
 * Naming an answer so a student and the engine mean the same thing.
 *
 * A student writes `D∞h`, `Dinfh`, `D*h` or `d oo h`; the catalogue calls it
 * `Dinfh`. And two operations of a group can share a label — C₂ᵥ has two `σv` —
 * so an exercise that names one needs a name the group cannot repeat.
 */

import { FRIEZE_GROUPS } from '../../data/friezeGroups.ts';
import { WALLPAPER_GROUPS } from '../../data/planeGroups.ts';
import { POINT_GROUPS } from '../../data/pointGroups.ts';
import type { PointOperation } from '../operations.ts';
import { operationDisplayNames } from '../point/naming.ts';
import { operationsOf } from '../pointGroups.ts';

/** Subscripts and the other spellings a student types, folded to ASCII. */
const FOLDED: ReadonlyMap<string, string> = new Map([
  ['₀', '0'],
  ['₁', '1'],
  ['₂', '2'],
  ['₃', '3'],
  ['₄', '4'],
  ['₅', '5'],
  ['₆', '6'],
  ['₇', '7'],
  ['₈', '8'],
  ['₉', '9'],
  ['ᵥ', 'v'],
  ['ₕ', 'h'],
  ['ₛ', 's'],
  ['ᵢ', 'i'],
  ['ᵈ', 'd'],
  ['ₔ', 'd'],
  ['∞', 'inf'],
  ['*', 'inf'],
]);

const GROUP_BY_KEY = new Map(
  POINT_GROUPS.map((group) => [group.slug, group.id]),
);

/**
 * The `PointGroup.id` a written Schoenflies symbol names.
 *
 * `D∞h`, `Dinfh`, `D*h`, `d oo h` and `D ∞ h` all come back `Dinfh`.
 * @param text - What the student typed.
 * @returns The id, or `null` when it names no group this site knows.
 */
export function canonicalSchoenflies(text: string): string | null {
  let folded = '';
  for (const character of text) folded += FOLDED.get(character) ?? character;
  const key = folded
    .toLowerCase()
    .replaceAll(/[\s_·.-]/g, '')
    .replaceAll('oo', 'inf');
  return GROUP_BY_KEY.get(key) ?? null;
}

/** Names are a pure function of the group, and a class partition is not cheap. */
const NAMES_BY_GROUP = new Map<string, readonly string[]>();

/**
 * One unique name per operation of a group, in the order `operationsOf` gives
 * them.
 *
 * The spelling is `operationDisplayNames`'s, so an exercise, the workbench and
 * the catalogue all name an operation the same way: a label the group carries
 * once is the name, and one it repeats is named from its class — `σv(xz)` and
 * `σv(yz)` for the two mirrors of C₂ᵥ, `C2(z)` for the principal two-fold of
 * D₆ₕ against the `C2^′` and `C2^″` in the ring plane.
 * @param group - A `PointGroup.id` with finitely many operations.
 * @returns The names, one per operation.
 */
export function groupOperationNames(group: string): readonly string[] {
  const known = NAMES_BY_GROUP.get(group);
  if (known !== undefined) return known;
  const names = operationDisplayNames(operationsOf(group));
  NAMES_BY_GROUP.set(group, names);
  return names;
}

/** The operation of a group with this name, or `undefined`. */
export function operationByName(
  group: string,
  name: string,
): PointOperation | undefined {
  const index = groupOperationNames(group).indexOf(name);
  return index === -1 ? undefined : operationsOf(group)[index];
}

/**
 * The plane-group id a written answer names, inside one namespace.
 *
 * The long and short IUCr forms fold together — `p4mm` and `p4m`, `c2mm` and
 * `cmm`, `p112` and `p2` — and the orbifold symbol is accepted as well, so a
 * student who reads `*442` off the picture is right.
 * @param text - What the student typed.
 * @param namespace - Wallpaper and frieze are separate: `p2` names one in each.
 * @returns The id, or `null` when it names no group of that namespace.
 */
export function canonicalPlaneGroup(
  text: string,
  namespace: 'wallpaper' | 'frieze',
): string | null {
  const written = text
    .trim()
    .toLowerCase()
    .replaceAll(/[\s_-]/g, '');
  if (written === '') return null;
  const groups =
    namespace === 'wallpaper'
      ? WALLPAPER_GROUPS.map((group) => ({
          id: group.id,
          full: group.full,
          orbifold: group.orbifold,
        }))
      : FRIEZE_GROUPS.map((group) => ({
          id: group.id,
          full: group.full,
          orbifold: group.orbifold,
        }));
  for (const group of groups) {
    if (
      written === group.id.toLowerCase() ||
      written === group.full.toLowerCase() ||
      written === group.orbifold.replaceAll(' ', '').toLowerCase()
    ) {
      return group.id;
    }
  }
  return null;
}
