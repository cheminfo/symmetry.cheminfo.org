/**
 * What each address says in the HTML the server hands out, above the crawl path.
 *
 * All 365 addresses used to ship the same body — this site's menu — so a crawler
 * was handed one text for every point group, every space group and every plane
 * group, and told by the title alone that they were different pages. That is how
 * a catalogue becomes a set of duplicates a search engine folds into one result.
 *
 * Read by the build and by nothing else: `vite.config.ts` calls it once per
 * route, so none of this reaches the bundle a browser downloads.
 *
 * The two big catalogues say what their records say (`pointGroupContent`,
 * `spaceGroupContent`). Every other address falls back to the name and the
 * sentence it is already indexed under, which the route table has written
 * distinctly for each of them — thin, but never a duplicate.
 */

import type { PageContent, RouteMeta } from 'react-cheminfo/core';

import { pointGroupBySlug } from '../data/pointGroups.ts';

import { pointGroupContent } from './pointGroupContent.ts';
import { spaceGroupContent } from './spaceGroupContent.ts';

/** The workbenches and the catalogue indexes, in their own words. */
const PAGES: Record<string, PageContent> = {
  '/': {
    heading: 'The point group of a molecule, in 3D',
    paragraphs: [
      'Load a molecule or build one, and the site assigns its point group: every axis, plane, centre and improper rotation it found, each one drawn on the structure and animated as it acts.',
      'The character table of the group comes with it, and so does the reasoning — which operation ruled out the neighbouring group, and why.',
    ],
  },
  '/crystals': {
    heading: 'Build a cell in any of the 230 space groups',
    paragraphs: [
      'Pick a space group, give it a cell and put atoms in it: the general positions are generated, the glide planes and screw axes are drawn where they fall, and the structure can be exported as a CIF.',
      'The 230 groups are addressed by their International Tables number, and the settings of a group — other axes, another origin — are the same page rather than a near-duplicate of it.',
    ],
  },
  '/plane': {
    heading: 'Name a plane pattern: 17 wallpaper groups and 7 friezes',
    paragraphs: [
      'Draw a repeating pattern and the site names its plane group, with the mirrors, glides and rotation centres marked on the tiling it generates.',
      'The seventeen wallpaper groups cover every way a motif can repeat in two directions; the seven frieze groups cover repetition along one.',
    ],
  },
};

/**
 * What one address says for itself.
 *
 * Read by `cheminfoPrerender` once per route at build time.
 * @param route - The address being written.
 * @returns Its text — generated for a catalogue entry, authored for a
 * workbench, and otherwise the name and sentence the route already carries.
 */
export function pageContent(route: RouteMeta): PageContent {
  const authored = PAGES[route.path];
  if (authored !== undefined) return authored;

  const slug = idUnder('/point-groups/', route.path);
  if (slug !== undefined) {
    const group = pointGroupBySlug(slug);
    if (group !== undefined) return pointGroupContent(group);
  }

  const number = idUnder('/space-groups/', route.path);
  if (number !== undefined && /^\d+$/.test(number)) {
    return spaceGroupContent(Number(number));
  }

  return fromRoute(route);
}

/**
 * The name and the sentence the page is indexed under, as its own text.
 *
 * It repeats the title and the description rather than adding to them, which is
 * thin — but a thin page of its own words is a page, and the identical menu
 * every address shipped before was not.
 */
function fromRoute(route: RouteMeta): PageContent {
  return { heading: route.title, paragraphs: [route.description] };
}

/** The single segment under a section, or `undefined` for anything else. */
function idUnder(section: string, path: string): string | undefined {
  if (!path.startsWith(section)) return undefined;
  const rest = path.slice(section.length);
  return rest === '' || rest.includes('/') ? undefined : rest;
}
