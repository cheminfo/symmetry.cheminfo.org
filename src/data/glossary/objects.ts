/**
 * How a step, an exercise and a glossary example all name the thing they show.
 *
 * One string, so clicking an example opens exactly what the sentence talks
 * about. The part after the colon is the **id the site addresses the object
 * by** — a molecule id, a point-group slug, a space-group number, a plane-group
 * id — and never a Hermann–Mauguin string, whose spelling in the wild is not
 * stable enough to be an identity.
 */

import { FRIEZE_GROUPS } from '../friezeGroups.ts';
import { MOLECULES } from '../molecules.ts';
import { WALLPAPER_GROUPS } from '../planeGroups.ts';
import { POINT_GROUPS } from '../pointGroups.ts';

/** The highest International Tables space-group number. */
const SPACE_GROUP_COUNT = 230;

/** An object the site can open, named the way an address names it. */
export type ObjectRef =
  | `molecule:${string}`
  | `pointGroup:${string}`
  | `spaceGroup:${number}`
  | `wallpaper:${string}`
  | `frieze:${string}`;

/** Which workbench an object opens in. */
export type ObjectMode = 'molecule' | 'crystal' | 'plane';

const MOLECULE_IDS = new Set(MOLECULES.map((entry) => entry.id));
const POINT_GROUP_SLUGS = new Set(POINT_GROUPS.map((group) => group.slug));
const WALLPAPER_IDS = new Set(WALLPAPER_GROUPS.map((group) => group.id));
const FRIEZE_IDS = new Set(FRIEZE_GROUPS.map((group) => group.id));

/**
 * Whether the object a reference names exists.
 *
 * The content tests run every reference through this, so a molecule renamed in
 * the library breaks the build rather than a link.
 * @param ref - The reference, from a glossary example or a tutorial step.
 * @returns True when the site can open it.
 */
export function objectRefExists(ref: ObjectRef): boolean {
  const { kind, id } = splitObjectRef(ref);
  switch (kind) {
    case 'molecule': {
      return MOLECULE_IDS.has(id);
    }
    case 'pointGroup': {
      return POINT_GROUP_SLUGS.has(id);
    }
    case 'spaceGroup': {
      const number = Number(id);
      return (
        Number.isInteger(number) && number >= 1 && number <= SPACE_GROUP_COUNT
      );
    }
    case 'wallpaper': {
      return WALLPAPER_IDS.has(id);
    }
    case 'frieze': {
      return FRIEZE_IDS.has(id);
    }
    default: {
      return false;
    }
  }
}

/** The workbench a reference opens, so a step needs no second field for it. */
export function objectRefMode(ref: ObjectRef): ObjectMode {
  const { kind } = splitObjectRef(ref);
  if (kind === 'spaceGroup') return 'crystal';
  if (kind === 'wallpaper' || kind === 'frieze') return 'plane';
  return 'molecule';
}

/** The two halves of a reference: what kind of object, and which one. */
export function splitObjectRef(ref: string): { kind: string; id: string } {
  const colon = ref.indexOf(':');
  if (colon === -1) return { kind: '', id: ref };
  return { kind: ref.slice(0, colon), id: ref.slice(colon + 1) };
}
