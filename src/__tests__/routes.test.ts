import { assertRoutes, pageMetaFor } from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import { FIXED_ROUTES, NOSCRIPT_ROUTES, PAGE_ROUTES } from '../seo/routes.ts';

test('the pages that exist whatever the data says are these eleven', () => {
  expect(FIXED_ROUTES.map((route) => route.path)).toStrictEqual([
    '/',
    '/crystals',
    '/plane',
    '/tutorial',
    '/exercises',
    '/cheatsheet',
    '/point-groups',
    '/space-groups',
    '/wallpaper',
    '/frieze',
    '/about',
  ]);
  expect(NOSCRIPT_ROUTES).toStrictEqual(FIXED_ROUTES);
  expect(PAGE_ROUTES.slice(0, FIXED_ROUTES.length)).toStrictEqual(FIXED_ROUTES);
});

test('the route table is one a crawler can be handed', () => {
  expect(() => {
    assertRoutes(PAGE_ROUTES);
  }).not.toThrow();
});

test('no two pages carry the same title or the same description', () => {
  const titles = new Set(PAGE_ROUTES.map((route) => route.title));
  const descriptions = new Set(PAGE_ROUTES.map((route) => route.description));

  expect(titles.size).toBe(PAGE_ROUTES.length);
  expect(descriptions.size).toBe(PAGE_ROUTES.length);
});

test('a description is a sentence a search result shows whole', () => {
  for (const route of PAGE_ROUTES) {
    expect(route.description.length).toBeGreaterThanOrEqual(110);
    expect(route.description.length).toBeLessThanOrEqual(160);
    expect(route.title.length).toBeLessThanOrEqual(60);
    expect(route.description).not.toContain('[[');
  }
});

test('the crawl path reads as a menu, not as a list of search results', () => {
  expect(NOSCRIPT_ROUTES.map((route) => route.short)).toStrictEqual([
    'Molecules',
    'Crystals',
    'Plane',
    'Tutorial',
    'Exercises',
    'Cheatsheet',
    'Point groups',
    'Space groups',
    'Wallpaper groups',
    'Frieze groups',
    'About',
  ]);
});

test('an address the site does not know is described as the home page', () => {
  expect(pageMetaFor(PAGE_ROUTES, '/not-a-page').path).toBe('/');
  expect(pageMetaFor(PAGE_ROUTES, '/crystals/225').path).toBe('/');
});

test('a catalogue answers every address under it, so a stale id still lands', () => {
  // Every id here names no group, which is the case the fallback is for: an id
  // the catalogue does hold — `/point-groups/c2v` — is a page of its own.
  expect(pageMetaFor(PAGE_ROUTES, '/point-groups/c9v').path).toBe(
    '/point-groups',
  );
  expect(pageMetaFor(PAGE_ROUTES, '/space-groups/231').path).toBe(
    '/space-groups',
  );
  expect(pageMetaFor(PAGE_ROUTES, '/wallpaper/p5m').path).toBe('/wallpaper');
  expect(pageMetaFor(PAGE_ROUTES, '/frieze/p1m9').path).toBe('/frieze');
  expect(pageMetaFor(PAGE_ROUTES, '/tutorial/mirror-planes').path).toBe(
    '/tutorial',
  );
  expect(pageMetaFor(PAGE_ROUTES, '/exercises/assign-c2v').path).toBe(
    '/exercises',
  );
});

test('what the page is working on is never a page of its own', () => {
  expect(pageMetaFor(PAGE_ROUTES, '/crystals?spaceGroup=14&embed').path).toBe(
    '/crystals',
  );
  expect(pageMetaFor(PAGE_ROUTES, '/plane?planeGroup=p4g').path).toBe('/plane');
  expect(pageMetaFor(PAGE_ROUTES, '/tutorial/').path).toBe('/tutorial');
});
