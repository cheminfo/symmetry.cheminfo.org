/**
 * The two plane-group indexes: the seventeen wallpaper groups by lattice, and
 * the seven frieze groups by point group.
 *
 * They are separate catalogues on separate addresses because `p1`, `p2` and
 * `p1m1` each name a group in both sets. Wallpaper groups are grouped by
 * lattice, which is what a student picks first; the seven friezes all live on
 * the same lattice — a row of translations — so theirs is the point group.
 */

import { FRIEZE_GROUPS } from '../../data/friezeGroups.ts';
import { WALLPAPER_GROUPS } from '../../data/planeGroups.ts';
import { count } from '../../seo/describe.ts';
import type {
  FriezeGroup,
  WallpaperGroup,
} from '../../symmetry/planeGroups.ts';

import { friezeEntry, wallpaperEntry } from './planeEntry.ts';
import type {
  CatalogueDescriptor,
  CatalogueFacetOption,
  CatalogueRow,
} from './types.ts';

/** What each of the five plane lattices is called, as a block heading. */
const LATTICE_LABELS: Record<string, string> = {
  oblique: 'Oblique — no angle and no length forced',
  rectangular: 'Rectangular — the two axes at 90°',
  'centred-rectangular': 'Centred rectangular — a lattice point in the middle',
  square: 'Square — equal axes at 90°',
  hexagonal: 'Hexagonal — equal axes at 120°',
};

/** The catalogue at `/wallpaper`. */
export const WALLPAPER_CATALOGUE: CatalogueDescriptor = {
  tab: 'wallpaper',
  title: 'Wallpaper groups',
  intro:
    'The seventeen ways a pattern can repeat in the plane, each with its lattice, its operations and its element diagram.',
  searchHint: 'Search a symbol, an orbifold or a lattice',
  rows: WALLPAPER_GROUPS.map(wallpaperRow),
  facets: [
    {
      id: 'lattice',
      label: 'Lattice',
      allLabel: 'Every lattice',
      options: uniqueOptions(
        WALLPAPER_GROUPS.map((group) => group.lattice),
        'lattice',
      ),
    },
    {
      id: 'point',
      label: 'Point group',
      allLabel: 'Every point group',
      options: uniqueOptions(
        WALLPAPER_GROUPS.map((group) => group.pointGroup),
        'point',
      ),
    },
  ],
  entry: (id) => wallpaperEntry(id),
};

/** The catalogue at `/frieze`. */
export const FRIEZE_CATALOGUE: CatalogueDescriptor = {
  tab: 'frieze',
  title: 'Frieze groups',
  intro:
    'The seven ways a pattern can repeat along a strip, from a plain row of footprints to one with mirrors both ways.',
  searchHint: 'Search a symbol, an orbifold or a name',
  rows: FRIEZE_GROUPS.map(friezeRow),
  facets: [
    {
      id: 'point',
      label: 'Point group',
      allLabel: 'Every point group',
      options: uniqueOptions(
        FRIEZE_GROUPS.map((group) => group.pointGroup),
        'point',
      ),
    },
  ],
  entry: (id) => friezeEntry(id),
};

/** One of the seventeen as the index lists it. */
export function wallpaperRow(group: WallpaperGroup): CatalogueRow {
  return {
    id: group.id,
    symbol: group.id,
    detail: `Point group ${group.pointGroup}, ${count(group.operationsPerCell, 'operation')} per cell, orbifold ${group.orbifold}.`,
    group: LATTICE_LABELS[group.lattice] ?? group.lattice,
    tags: [`lattice:${group.lattice}`, `point:${group.pointGroup}`],
    search: [group.id, group.full, group.orbifold, group.lattice, group.example]
      .join(' ')
      .toLowerCase(),
    badge: `No. ${group.number}`,
  };
}

/** One of the seven as the index lists it. */
export function friezeRow(group: FriezeGroup): CatalogueRow {
  return {
    id: group.id,
    symbol: group.id,
    detail: `Conway's ${group.conway}, ${count(group.operationsPerPeriod, 'operation')} per period, orbifold ${group.orbifold}.`,
    group: `Point group ${group.pointGroup}`,
    tags: [`point:${group.pointGroup}`],
    search: [group.id, group.full, group.orbifold, group.conway, group.example]
      .join(' ')
      .toLowerCase(),
    badge: `No. ${group.number}`,
  };
}

/** One capsule per distinct value, in the order the groups are numbered. */
function uniqueOptions(
  values: readonly string[],
  prefix: string,
): readonly CatalogueFacetOption[] {
  const seen = new Set<string>();
  const options: CatalogueFacetOption[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    options.push({ value: `${prefix}:${value}`, label: value });
  }
  return options;
}
