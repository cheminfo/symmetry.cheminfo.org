import { expect, test } from 'vitest';

import type { Route } from '../router.ts';
import { formatRoute, parseAddress, pathOf } from '../router.ts';

const HOME: Route = { tab: 'molecules', id: null, query: {} };

test('an empty address is the molecule workbench', () => {
  expect(parseAddress('')).toStrictEqual(HOME);
  expect(parseAddress('/')).toStrictEqual(HOME);
  expect(parseAddress('#')).toStrictEqual(HOME);
  expect(parseAddress('#/')).toStrictEqual(HOME);
});

test('the molecule workbench is `/`, and `/molecules` is not a second door', () => {
  expect(pathOf('molecules')).toBe('/');
  expect(formatRoute({ tab: 'molecules', id: null, query: {} })).toBe('/');
  expect(formatRoute({ tab: 'molecules', id: 'water', query: {} })).toBe('/');
  // A link that names it anyway still opens the page it means.
  expect(parseAddress('/molecules')).toStrictEqual({
    tab: 'molecules',
    id: null,
    query: {},
  });
});

test('an unknown page falls back to the molecule workbench', () => {
  expect(parseAddress('/groups')).toStrictEqual(HOME);
  expect(parseAddress('/Crystals')).toStrictEqual(HOME);
  expect(parseAddress('/point-group/c2v')).toStrictEqual(HOME);
});

test('every page of the bar is its own address', () => {
  expect(parseAddress('/crystals').tab).toBe('crystals');
  expect(parseAddress('/plane').tab).toBe('plane');
  expect(parseAddress('/tutorial').tab).toBe('tutorial');
  expect(parseAddress('/exercises').tab).toBe('exercises');
  expect(parseAddress('/cheatsheet').tab).toBe('cheatsheet');
  expect(parseAddress('/about').tab).toBe('about');
  expect(formatRoute({ tab: 'crystals', id: null, query: {} })).toBe(
    '/crystals',
  );
  expect(formatRoute({ tab: 'about', id: null, query: {} })).toBe('/about');
});

test('a workbench addresses no entry, a catalogue does', () => {
  // A second segment on a page that addresses nothing is dropped, not kept.
  expect(parseAddress('/molecules/water').id).toBe(null);
  expect(parseAddress('/plane/p4g').id).toBe(null);
  expect(parseAddress('/cheatsheet/mirror').id).toBe(null);
  expect(parseAddress('/about/team').id).toBe(null);
  expect(parseAddress('/crystals/225')).toStrictEqual({
    tab: 'crystals',
    id: null,
    query: {},
  });
});

test('wallpaper and frieze are separate namespaces, so p1 names two groups', () => {
  expect(parseAddress('/wallpaper/p1')).toStrictEqual({
    tab: 'wallpaper',
    id: 'p1',
    query: {},
  });
  expect(parseAddress('/frieze/p1')).toStrictEqual({
    tab: 'frieze',
    id: 'p1',
    query: {},
  });
  expect(parseAddress('/wallpaper/p1m1').tab).toBe('wallpaper');
  expect(parseAddress('/frieze/p1m1').tab).toBe('frieze');
});

test('a catalogue entry keeps its id, and its index keeps none', () => {
  expect(parseAddress('/point-groups/c2v').id).toBe('c2v');
  expect(parseAddress('/point-groups/dinfh').id).toBe('dinfh');
  expect(parseAddress('/space-groups/225').id).toBe('225');
  expect(parseAddress('/space-groups/14/').id).toBe('14');
  expect(parseAddress('/point-groups').id).toBe(null);
  expect(parseAddress('/space-groups/').id).toBe(null);
  expect(parseAddress('/tutorial/mirror-planes').id).toBe('mirror-planes');
  expect(parseAddress('/exercises/assign-c2v').id).toBe('assign-c2v');
});

test('the query is carried whole, and a bare flag survives the parse', () => {
  expect(parseAddress('/crystals?spaceGroup=14&setting=1').query).toStrictEqual(
    { spaceGroup: '14', setting: '1' },
  );
  expect(parseAddress('/?embed').query).toStrictEqual({ embed: '' });
  expect(parseAddress('/?embed=1&hide=tabs,export').query).toStrictEqual({
    embed: '1',
    hide: 'tabs,export',
  });
  // An entry carrying nothing is never written back out.
  expect(
    formatRoute({ tab: 'molecules', id: null, query: { embed: '' } }),
  ).toBe('/');
});

test('a percent escape survives, and a broken one does not throw', () => {
  expect(parseAddress('/point-groups/c%E2%88%9Ev').id).toBe('c∞v');
  expect(parseAddress('/point-groups/c%v').id).toBe('c%v');
  expect(parseAddress('/plane?motif=%E2%88%9E').query.motif).toBe('∞');
  expect(parseAddress('/plane?motif=%').query.motif).toBe('%');
});

test('every address the site answers round-trips through both directions', () => {
  const addresses = [
    '/',
    '/crystals',
    '/crystals?spaceGroup=14',
    '/plane',
    '/plane?planeGroup=p4g&tiles=6',
    '/point-groups',
    '/point-groups/c2v',
    '/space-groups',
    '/space-groups/225?setting=1',
    '/wallpaper',
    '/wallpaper/p4g',
    '/frieze',
    '/frieze/p2mg',
    '/tutorial',
    '/tutorial/mirror-planes',
    '/exercises',
    '/exercises/assign-c2v',
    '/cheatsheet',
    '/about?embed=1',
  ];

  for (const address of addresses) {
    expect(formatRoute(parseAddress(address))).toBe(address);
  }
});
