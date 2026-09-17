/**
 * Every address the site answers, with the name and the sentence it is indexed
 * under.
 *
 * One table, read by three things: the build, which writes an HTML file per
 * entry and the sitemap listing them; the head injector; and the running app,
 * which retitles the tab after an in-app move. A page missing from here is a
 * page a search engine only ever sees as the home page.
 *
 * The machinery that reads it is `react-cheminfo/core` and
 * `react-cheminfo/vite`; what belongs to this site is the prose below, and the
 * addresses composed from the catalogues, the tutorial and the exercises —
 * every point group, space group, wallpaper group and frieze group is what
 * somebody searches for by name, so each is a page of its own.
 */

import type { RouteMeta } from 'react-cheminfo/core';

import { EXERCISES } from '../data/exercises/index.ts';
import { TUTORIAL_STEPS } from '../data/tutorial/index.ts';

import { exerciseRoutes, tutorialRoutes } from './lessonRoutes.ts';
import { firstSentence, plainProse } from './lessonSummary.ts';
import { friezeRoutes, wallpaperRoutes } from './planeGroupRoutes.ts';
import { pointGroupRoutes } from './pointGroupRoutes.ts';
import { spaceGroupRoutes } from './spaceGroupRoutes.ts';

export type { LessonEntry } from './lessonRoutes.ts';
export { exerciseRoutes, tutorialRoutes } from './lessonRoutes.ts';

/**
 * The pages that exist whatever the data says: the three workbenches, the four
 * catalogue indexes, the tutorial, the exercises, the cheatsheet and the About.
 *
 * They are also the crawl path — a menu names the space groups, not all 230 of
 * them — so each carries the label it is known by and a note saying what it is
 * for.
 */
export const FIXED_ROUTES: readonly RouteMeta[] = [
  {
    path: '/',
    title: 'Point groups, space groups and wallpaper groups',
    description:
      'Assign the point group of a molecule in 3D, watch each symmetry operation act on it, and read the character table that comes with it.',
    short: 'Molecules',
    note: 'the point group of a molecule, in 3D',
  },
  {
    path: '/crystals',
    title: 'Crystal symmetry — the 230 space groups in 3D',
    description:
      'Pick any of the 230 space groups, place atoms in the cell and see the structure generated: general positions, glides, screw axes and CIF export.',
    short: 'Crystals',
    note: 'build a cell in any of the 230 space groups',
  },
  {
    path: '/plane',
    title: 'Plane symmetry — the 17 wallpaper and 7 frieze groups',
    description:
      'Draw a repeating pattern and name its plane group: 17 wallpaper groups and 7 frieze groups, with their mirrors, glides and rotation centres drawn on.',
    short: 'Plane',
    note: 'name the symmetry of a repeating pattern',
  },
  {
    path: '/tutorial',
    title: 'Symmetry tutorial — from a mirror plane to a space group',
    description:
      'Eighteen guided steps: symmetry operations, point groups, character tables, Bravais lattices, plane groups and the 230 space groups, in a live 3D view.',
    short: 'Tutorial',
    note: 'from a mirror plane to a space group',
    // A step id the deck no longer has reads as the tutorial rather than as the
    // home page, so a link from a slide of last year still lands in the tour.
    prefix: true,
  },
  {
    path: '/exercises',
    title: 'Symmetry exercises — point groups, characters, space groups',
    description:
      'Checked exercises: assign a point group, complete a character table row, name a wallpaper group, and count the general positions of a space group.',
    short: 'Exercises',
    note: 'checked, with hints and an answer',
    prefix: true,
  },
  {
    path: '/cheatsheet',
    title: 'Symmetry cheatsheet — point groups, lattices, space groups',
    description:
      'A printable reference: the symmetry operations, the point-group flowchart, the 14 Bravais lattices, Hermann-Mauguin symbols and the 17 wallpaper groups.',
    short: 'Cheatsheet',
    note: 'printable, one page',
  },
  {
    path: '/point-groups',
    title: 'Molecular point groups, one page each',
    description:
      'Every molecular point group in one list: the operations it carries, its order, its character table and the molecules that belong to it.',
    short: 'Point groups',
    note: 'operations, order and character table',
    // An unknown slug reads as this index rather than as the home page, so a
    // mistyped or renamed group still lands on the catalogue it belongs to.
    prefix: true,
  },
  {
    path: '/space-groups',
    title: 'The 230 space groups, by number and symbol',
    description:
      'All 230 space groups by number and Hermann-Mauguin symbol: crystal system, lattice centring, general positions, and the cell you can build in each.',
    short: 'Space groups',
    note: 'all 230, by number and symbol',
    prefix: true,
  },
  {
    path: '/wallpaper',
    title: 'The 17 wallpaper groups, drawn',
    description:
      'The seventeen ways a pattern repeats in the plane, each with its orbifold name, its lattice, and its mirrors, glides and rotation centres drawn on.',
    short: 'Wallpaper groups',
    note: 'the seventeen, drawn',
    prefix: true,
  },
  {
    path: '/frieze',
    title: 'The 7 frieze groups, drawn',
    description:
      'The seven ways a pattern repeats along a strip, each with its orbifold name and the translations, mirrors, glides and half-turns that generate it.',
    short: 'Frieze groups',
    note: 'the seven, drawn',
    prefix: true,
  },
  {
    path: '/about',
    title: 'About — what this tool computes and what it borrows',
    description:
      'What this tool derives from a structure and where it stops, the tables and libraries it borrows, how to cite it, and where to report a problem.',
    short: 'About',
    note: 'what it computes, and what it borrows',
  },
];

/**
 * The addresses composed from the site's own data: one page per point group,
 * per space group, and per wallpaper and frieze group.
 *
 * It is a separate table so that composing them never touches the prose above.
 * Every sentence is read off the entry — its symbol, its order, its lattice,
 * what a search for it would say — so every page here is a different page to
 * a crawler rather than one template repeated.
 *
 * Wallpaper and frieze stay in **separate** namespaces: `p1` and `p2` each name
 * a different group in the two sets, so a merged `/plane/<id>` would give two
 * groups one address. `p1m1` is a third: the frieze group of that id, and the
 * full symbol of the wallpaper group `pm`.
 *
 * A tutorial step and an exercise are pages of the same kind: each is one thing
 * a student is sent to by a link, so each carries its own sentence. What is
 * indexed is a step's `observe` line and an exercise's opening sentence — the
 * one-clause summaries, not the several-sentence prose the page itself shows,
 * which would overrun what a search result can display.
 */
export const GENERATED_ROUTES: readonly RouteMeta[] = [
  ...pointGroupRoutes(),
  ...spaceGroupRoutes(),
  ...wallpaperRoutes(),
  ...friezeRoutes(),
  ...tutorialRoutes(
    TUTORIAL_STEPS.map((step) => ({
      id: step.id,
      title: step.title,
      summary: plainProse(step.observe),
    })),
  ),
  ...exerciseRoutes(
    EXERCISES.map((exercise) => ({
      id: exercise.id,
      title: exercise.title,
      summary: firstSentence(exercise.description),
    })),
  ),
];

/** Every routed address: the fixed pages, then everything composed from data. */
export const PAGE_ROUTES: readonly RouteMeta[] = [
  ...FIXED_ROUTES,
  ...GENERATED_ROUTES,
];

/**
 * The pages the crawl path lists, for a visitor or a crawler with no
 * JavaScript. A crawl path is a menu: it names the four catalogues, the tour
 * and the exercise list, not the pages under them, which `sitemap.xml` carries.
 */
export const NOSCRIPT_ROUTES: readonly RouteMeta[] = FIXED_ROUTES;
