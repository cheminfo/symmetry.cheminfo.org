/**
 * The four catalogues, by the page that is open.
 *
 * One component serves all four; this is the whole of what tells them apart.
 */

import type { CatalogueTabId } from '../../state/index.ts';

import { FRIEZE_CATALOGUE, WALLPAPER_CATALOGUE } from './planeCatalogue.ts';
import { POINT_GROUP_CATALOGUE } from './pointGroupCatalogue.ts';
import { SPACE_GROUP_CATALOGUE } from './spaceGroupCatalogue.ts';
import type { CatalogueDescriptor } from './types.ts';

/** Every catalogue, keyed by the page it answers on. */
export const CATALOGUES: Record<CatalogueTabId, CatalogueDescriptor> = {
  'point-groups': POINT_GROUP_CATALOGUE,
  'space-groups': SPACE_GROUP_CATALOGUE,
  wallpaper: WALLPAPER_CATALOGUE,
  frieze: FRIEZE_CATALOGUE,
};

/**
 * The catalogue a page shows.
 * @param tab - One of the four catalogue pages.
 * @returns Its descriptor.
 */
export function descriptorFor(tab: CatalogueTabId): CatalogueDescriptor {
  return CATALOGUES[tab];
}
