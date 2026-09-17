/**
 * One address per plane group, in two namespaces that must stay apart.
 *
 * `p1` and `p2` each name a wallpaper group **and** a frieze group, and they are
 * different groups. A single `/plane/<id>` namespace would give two pages one
 * address, which `assertRoutes` refuses and a crawler would resolve to whichever
 * came first — so the wallpaper groups live under `/wallpaper` and the frieze
 * groups under `/frieze`. `p1m1` is the same trap once removed: a frieze id, and
 * the full symbol of the wallpaper group `pm`.
 */

import type { RouteMeta } from 'react-cheminfo/core';

import { FRIEZE_GROUPS, FRIEZE_TO_WALLPAPER } from '../data/friezeGroups.ts';
import { WALLPAPER_GROUPS } from '../data/planeGroups.ts';
import type { FriezeGroup, WallpaperGroup } from '../symmetry/planeGroups.ts';

import { count, describe, withArticle } from './describe.ts';

/** `/wallpaper/<id>` for the seventeen ways a pattern repeats in the plane. */
export function wallpaperRoutes(): readonly RouteMeta[] {
  return WALLPAPER_GROUPS.map(wallpaperRoute);
}

/** `/frieze/<id>` for the seven ways a pattern repeats along a strip. */
export function friezeRoutes(): readonly RouteMeta[] {
  return FRIEZE_GROUPS.map(friezeRoute);
}

/** The address, name and sentence of one wallpaper group. */
export function wallpaperRoute(group: WallpaperGroup): RouteMeta {
  const base =
    `Wallpaper group ${group.number} of 17, ${group.id}: ${withArticle(group.lattice)} lattice, ` +
    `point group ${group.pointGroup}, ${count(group.operationsPerCell, 'operation')} per cell, ` +
    `orbifold ${group.orbifold}.`;
  return {
    path: `/wallpaper/${group.id}`,
    title: `${group.id} — wallpaper group ${group.number} of 17, ${group.lattice}`,
    description: describe(base, [
      group.full === group.id ? [] : [`Written ${group.full} in full.`],
      [group.example],
      [group.fundamentalDomain],
    ]),
    short: group.id,
  };
}

/** The address, name and sentence of one frieze group. */
export function friezeRoute(group: FriezeGroup): RouteMeta {
  const base =
    `Frieze group ${group.number} of 7, ${group.id}: Conway's ${group.conway}, ` +
    `point group ${group.pointGroup}, ${count(group.operationsPerPeriod, 'operation')} per period, ` +
    `orbifold ${group.orbifold}.`;
  const wallpaper = FRIEZE_TO_WALLPAPER[group.id];
  return {
    path: `/frieze/${group.id}`,
    title: `${group.id} — frieze group ${group.number} of 7, the ${group.conway}`,
    description: describe(base, [
      [group.example],
      wallpaper === undefined
        ? []
        : [`It is the strip of wallpaper group ${wallpaper}.`],
      [group.fundamentalDomain],
      group.full === group.id ? [] : [`Written ${group.full} in full.`],
    ]),
    short: group.id,
  };
}
