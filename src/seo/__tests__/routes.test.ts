import { assertRoutes, pageMetaFor } from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import { FRIEZE_GROUPS } from '../../data/friezeGroups.ts';
import { WALLPAPER_GROUPS } from '../../data/planeGroups.ts';
import { POINT_GROUPS } from '../../data/pointGroups.ts';
import { DESCRIPTION_MAX, DESCRIPTION_MIN } from '../describe.ts';
import { exerciseRoutes, tutorialRoutes } from '../lessonRoutes.ts';
import { friezeRoutes, wallpaperRoutes } from '../planeGroupRoutes.ts';
import { pointGroupRoutes } from '../pointGroupRoutes.ts';
import { FIXED_ROUTES, GENERATED_ROUTES, PAGE_ROUTES } from '../routes.ts';
import { spaceGroupRoutes } from '../spaceGroupRoutes.ts';

test('the site answers 365 addresses, and each section contributes its own', () => {
  expect(pointGroupRoutes()).toHaveLength(53);
  expect(spaceGroupRoutes()).toHaveLength(230);
  expect(wallpaperRoutes()).toHaveLength(17);
  expect(friezeRoutes()).toHaveLength(7);
  expect(
    PAGE_ROUTES.filter((route) => route.path.startsWith('/tutorial/')),
  ).toHaveLength(18);
  expect(
    PAGE_ROUTES.filter((route) => route.path.startsWith('/exercises/')),
  ).toHaveLength(29);
  expect(FIXED_ROUTES).toHaveLength(11);
  expect(GENERATED_ROUTES).toHaveLength(354);
  expect(PAGE_ROUTES).toHaveLength(365);
});

test('the whole table is one a build can read as a set of file names', () => {
  expect(() => {
    assertRoutes(PAGE_ROUTES);
  }).not.toThrow();
});

test('p1 is a wallpaper group and a frieze group, and they are two pages', () => {
  const wallpaper = PAGE_ROUTES.find((route) => route.path === '/wallpaper/p1');
  const frieze = PAGE_ROUTES.find((route) => route.path === '/frieze/p1');

  expect(wallpaper?.title).toBe('p1 — wallpaper group 1 of 17, oblique');
  expect(frieze?.title).toBe('p1 — frieze group 1 of 7, the hop');
  for (const id of ['p1', 'p2']) {
    expect(
      PAGE_ROUTES.filter((route) => route.path.endsWith(`/${id}`)),
    ).toHaveLength(2);
  }
});

test('a merged plane namespace would be refused, which is why there are two', () => {
  const merged = PAGE_ROUTES.map((route) => ({
    ...route,
    path: route.path.replace(/^\/(?:wallpaper|frieze)\//, '/plane/'),
  }));

  expect(() => {
    assertRoutes(merged);
  }).toThrow('a route path is written once: "/plane/p1"');
});

test('no two pages carry the same address, title or description', () => {
  const paths = new Set(PAGE_ROUTES.map((route) => route.path));
  const titles = new Set(PAGE_ROUTES.map((route) => route.title));
  const descriptions = new Set(PAGE_ROUTES.map((route) => route.description));

  expect(paths.size).toBe(365);
  expect(titles.size).toBe(365);
  expect(descriptions.size).toBe(365);
});

test('every description is a sentence a search result shows whole', () => {
  let checked = 0;
  for (const route of PAGE_ROUTES) {
    expect(route.description.length).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
    expect(route.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    checked++;
  }
  expect(checked).toBe(365);
});

test('a title leaves room for the site name, which is appended to it', () => {
  let longest = '';
  let checked = 0;
  for (const route of PAGE_ROUTES) {
    expect(route.title.startsWith('SymmeTry')).toBe(false);
    if (route.title.length > longest.length) longest = route.title;
    checked++;
  }
  expect(checked).toBe(365);
  expect(longest).toBe(
    'Symmetry exercises — point groups, characters, space groups',
  );
  expect(longest.length).toBe(59);
  for (const route of PAGE_ROUTES) {
    expect(route.title.length).toBeLessThanOrEqual(59);
  }

  let widest = '';
  for (const route of GENERATED_ROUTES) {
    if (route.title.length > widest.length) widest = route.title;
  }
  expect(widest).toBe(
    'Classes, irreps and dimensions in Td — symmetry exercise 13',
  );
  expect(widest.length).toBe(59);
});

test('every catalogue entry has an address, and the space groups are 1 to 230', () => {
  const paths = new Set(PAGE_ROUTES.map((route) => route.path));
  for (const group of POINT_GROUPS) {
    expect(paths.has(`/point-groups/${group.slug}`)).toBe(true);
  }
  for (const group of WALLPAPER_GROUPS) {
    expect(paths.has(`/wallpaper/${group.id}`)).toBe(true);
  }
  for (const group of FRIEZE_GROUPS) {
    expect(paths.has(`/frieze/${group.id}`)).toBe(true);
  }
  for (let number = 1; number <= 230; number++) {
    expect(paths.has(`/space-groups/${number}`)).toBe(true);
  }
  expect(paths.has('/space-groups/0')).toBe(false);
  expect(paths.has('/space-groups/231')).toBe(false);
});

test('a setting is a query, never an address of its own', () => {
  for (const route of PAGE_ROUTES) {
    if (!route.path.startsWith('/space-groups/')) continue;
    expect(route.path).not.toContain('setting');
  }
  expect(pageMetaFor(PAGE_ROUTES, '/space-groups/227?setting=1').path).toBe(
    '/space-groups/227',
  );
});

function meta(path: string) {
  return PAGE_ROUTES.find((route) => route.path === path);
}

test('the sentence of an entry is read off that entry, not off a template', () => {
  expect(meta('/point-groups/c2v')?.description).toBe(
    'The C2v point group has 4 symmetry operations in 4 classes: E, C2, σv(xz), σv′(yz). Hermann-Mauguin mm2, one of the 32 crystal classes, orthorhombic.',
  );
  expect(meta('/space-groups/225')?.description).toBe(
    'Space group 225, F m -3 m (Fm-3m): cubic, face-centred lattice, class m-3m, 192 general positions. Centrosymmetric and symmorphic. Written F 4/m -3 2/m in full.',
  );
  expect(meta('/space-groups/227')?.description).toBe(
    'Space group 227, F d -3 m (Fd-3m): cubic, face-centred lattice, class m-3m, 192 general positions. Centrosymmetric, with a glide plane or a screw axis.',
  );
  expect(meta('/wallpaper/p4g')?.title).toBe(
    'p4g — wallpaper group 12 of 17, square',
  );
  expect(meta('/frieze/p2mg')?.description).toBe(
    "Frieze group 6 of 7, p2mg: Conway's spinning sidle, point group 2mm, 4 operations per period, orbifold 2*∞. It is the strip of wallpaper group pmg.",
  );
});

test('a catalogue entry is its own page, and a stale id still lands in its section', () => {
  expect(pageMetaFor(PAGE_ROUTES, '/point-groups/c2v').path).toBe(
    '/point-groups/c2v',
  );
  expect(pageMetaFor(PAGE_ROUTES, '/space-groups/62').path).toBe(
    '/space-groups/62',
  );
  expect(pageMetaFor(PAGE_ROUTES, '/point-groups/c9v').path).toBe(
    '/point-groups',
  );
  expect(pageMetaFor(PAGE_ROUTES, '/space-groups/231').path).toBe(
    '/space-groups',
  );
  expect(pageMetaFor(PAGE_ROUTES, '/wallpaper/p5m').path).toBe('/wallpaper');
  expect(pageMetaFor(PAGE_ROUTES, '/not-a-page').path).toBe('/');
});

const LESSONS = [
  {
    id: 'mirror-planes',
    title: 'Mirror planes',
    summary:
      'Find the mirror planes of a molecule by reflecting it and watching which atoms land on an atom of the same element.',
  },
  {
    id: 'the-inversion-centre',
    title: 'The inversion centre',
    summary:
      'Send every atom through the centre to its opposite point, and see which molecules come back to themselves.',
  },
];

test('a tutorial step takes its id as its address and its own sentence', () => {
  expect(tutorialRoutes(LESSONS)).toStrictEqual([
    {
      path: '/tutorial/mirror-planes',
      title: 'Mirror planes',
      description:
        'Find the mirror planes of a molecule by reflecting it and watching which atoms land on an atom of the same element. Step 1 of 2 of the symmetry tutorial.',
      short: 'Mirror planes',
    },
    {
      path: '/tutorial/the-inversion-centre',
      title: 'The inversion centre',
      description:
        'Send every atom through the centre to its opposite point, and see which molecules come back to themselves. Step 2 of 2 of the symmetry tutorial.',
      short: 'The inversion centre',
    },
  ]);
});

test('an exercise takes its id as its address and says it is checked', () => {
  const [first] = exerciseRoutes([
    {
      id: 'assign-c2v',
      title: 'Assign water',
      summary: 'Assign the point group of water from its two mirror planes.',
    },
  ]);

  expect(first?.path).toBe('/exercises/assign-c2v');
  expect(first?.title).toBe('Assign water — symmetry exercise 1');
  expect(first?.description).toBe(
    'Assign the point group of water from its two mirror planes. Exercise 1 of 1, checked as you type, with hints and an answer you can reveal.',
  );
});
