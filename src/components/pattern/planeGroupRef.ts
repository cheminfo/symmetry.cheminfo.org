/**
 * Which plane group a link names, across two namespaces that share symbols.
 *
 * `p1` and `p2` name a group in **both** sets, and `p1m1` is a frieze group as
 * well as the full symbol of the wallpaper group `pm`. So `?planeGroup=` cannot
 * be a bare symbol: a frieze id carries the `f:` prefix and a wallpaper id does
 * not. The catalogue addresses stay `/wallpaper/<id>` and `/frieze/<id>`, which
 * separate the two the same way.
 */

import { DEFAULT_PLANE_GROUP } from '../../state/index.ts';
import type {
  CrystalOperation,
  UnitCell2D,
} from '../../symmetry/core/index.ts';
import type {
  FriezeGroup,
  WallpaperGroup,
} from '../../symmetry/planeGroups.ts';
import {
  friezeById,
  friezeOperations,
  latticeCell,
  wallpaperById,
  wallpaperOperations,
} from '../../symmetry/planeGroups.ts';

/** What marks a frieze id apart from a wallpaper one in `?planeGroup=`. */
export const FRIEZE_PREFIX = 'f:';

/** The frieze group the workbench opens on when the strip is chosen. */
export const DEFAULT_FRIEZE_GROUP = 'p2mm';

/** One plane group, resolved from what a link carries. */
export type PlaneGroupChoice =
  | {
      readonly kind: 'wallpaper';
      /** What `?planeGroup=` carries for it. */
      readonly id: string;
      readonly group: WallpaperGroup;
    }
  | {
      readonly kind: 'frieze';
      readonly id: string;
      readonly group: FriezeGroup;
    };

/**
 * The group an id names, falling back to the default rather than throwing.
 *
 * A link written before a symbol was spelled another way must still open a
 * page, so nothing here refuses: an id naming no group of either set gives the
 * wallpaper group the workbench opens on.
 * @param value - What `?planeGroup=` carried, trimmed and clamped already.
 * @returns The group, and which namespace it came from.
 */
export function resolvePlaneGroup(value: string): PlaneGroupChoice {
  const wanted = value.trim().toLowerCase();
  if (wanted.startsWith(FRIEZE_PREFIX)) {
    const frieze = friezeById(wanted.slice(FRIEZE_PREFIX.length));
    if (frieze !== undefined) {
      return {
        kind: 'frieze',
        id: planeGroupId('frieze', frieze.id),
        group: frieze,
      };
    }
  }
  const wallpaper = wallpaperById(wanted) ?? wallpaperById(DEFAULT_PLANE_GROUP);
  if (wallpaper === undefined) {
    throw new Error(
      `the default wallpaper group ${DEFAULT_PLANE_GROUP} is missing`,
    );
  }
  return { kind: 'wallpaper', id: wallpaper.id, group: wallpaper };
}

/**
 * What `?planeGroup=` carries for one group.
 * @param kind - Which namespace it belongs to.
 * @param id - Its short symbol.
 * @returns The id, prefixed when it is a frieze group.
 */
export function planeGroupId(
  kind: PlaneGroupChoice['kind'],
  id: string,
): string {
  return kind === 'frieze' ? `${FRIEZE_PREFIX}${id}` : id;
}

/**
 * Every coset representative of the chosen group.
 * @param choice - From {@link resolvePlaneGroup}.
 * @returns The operations, the identity first.
 */
export function planeGroupOperations(
  choice: PlaneGroupChoice,
): Array<CrystalOperation<2>> {
  return choice.kind === 'wallpaper'
    ? wallpaperOperations(choice.group)
    : friezeOperations(choice.group);
}

/**
 * The cell the chosen group is drawn in.
 *
 * A frieze has one translation, not a lattice, so its cell is the period along
 * **a** and the height of the strip across it; the square one keeps a motif
 * drawn in fractional coordinates the shape it was drawn in.
 * @param choice - From {@link resolvePlaneGroup}.
 * @param size - Length of **a**, in the picture's own units.
 * @returns The cell.
 */
export function planeGroupCell(
  choice: PlaneGroupChoice,
  size: number,
): UnitCell2D {
  return choice.kind === 'wallpaper'
    ? latticeCell(choice.group.lattice, size)
    : { a: size, b: size, gamma: 90 };
}
