/**
 * Links already handed out — on course pages, slides and in emails — and what
 * each one opens: framed or not, which parts are left out, which layers are
 * drawn, and the address the bar settles on. These must read the same however
 * the share vocabulary is implemented underneath.
 */

import { beforeEach, expect, test } from 'vitest';

import { DISPLAY_FLAG_KEYS, state } from '../../state/index.ts';
import { formatRoute, parseAddress } from '../../utils/router.ts';
import { applyRoute, currentRoute } from '../route.ts';

/** What a link opens, read off the state it leaves behind. */
interface Opened {
  address: string;
  embedded: boolean;
  hidden: readonly string[];
  layers: string[];
}

/** Apply an address exactly as the shell does on load. */
function open(value: string): Opened {
  applyRoute(parseAddress(value));
  const layers: string[] = [];
  for (const key of DISPLAY_FLAG_KEYS) {
    if (state.preferences.flags[key].value) layers.push(key);
  }
  return {
    address: formatRoute(currentRoute()),
    embedded: state.view.embedded.value,
    hidden: state.view.hidden.value,
    layers,
  };
}

/** The layers a visitor who has changed nothing sees. */
const DEFAULT_LAYERS = ['axes', 'mirrors', 'inversion', 'unitCell', 'labels'];

beforeEach(() => {
  open('/?flags=axes,mirrors,inversion,unitCell,labels');
});

test('a link that dropped the chrome with `hide=header` still opens framed', () => {
  expect(open('/?hide=header')).toStrictEqual({
    address: '/?embed=1',
    embedded: true,
    hidden: [],
    layers: DEFAULT_LAYERS,
  });
  expect(open('/crystals?hide=tabs,header,export&spaceGroup=14')).toStrictEqual(
    {
      address: '/crystals?spaceGroup=14&embed=1&hide=tabs,export',
      embedded: true,
      hidden: ['tabs', 'export'],
      layers: DEFAULT_LAYERS,
    },
  );
  expect(open('/point-groups/c2v?hide=%20header%20,operations')).toStrictEqual({
    address: '/point-groups/c2v?embed=1&hide=operations',
    embedded: true,
    hidden: ['operations'],
    layers: DEFAULT_LAYERS,
  });
});

test('every hand-typed form of the embed switch opens the same page', () => {
  expect(open('/plane?embed').address).toBe('/plane?embed=1');
  expect(open('/plane?embed=yes').address).toBe('/plane?embed=1');
  expect(open('/plane?embed=0&hide=motif')).toStrictEqual({
    address: '/plane?hide=motif',
    embedded: false,
    hidden: ['motif'],
    layers: DEFAULT_LAYERS,
  });
});

test('the layers a link pins are read the way they always were', () => {
  expect(open('/?flags=labels,axes').layers).toStrictEqual(['axes', 'labels']);
  expect(open('/?flags=labels,axes').address).toBe('/?flags=axes,labels');
  expect(open('/?flags=axes,,glides,sidebar').address).toBe(
    '/?flags=axes,glides',
  );
  expect(open('/?flags=none')).toStrictEqual({
    address: '/?flags=none',
    embedded: false,
    hidden: [],
    layers: [],
  });
  expect(open('/?flags=%20axes%20,%20screws').layers).toStrictEqual([
    'axes',
    'screws',
  ]);
  expect(open('/?flags=sidebar')).toStrictEqual({
    address: '/?flags=none',
    embedded: false,
    hidden: [],
    layers: [],
  });
});

test('a link naming no layers, or an empty list, leaves the stored ones', () => {
  open('/?flags=glides');

  expect(open('/crystals?flags=').layers).toStrictEqual(['glides']);
  expect(open('/crystals').address).toBe('/crystals?flags=glides');
});

test('a link of the full configuration reads back exactly', () => {
  expect(
    open(
      '/crystals?spaceGroup=62&setting=2&structure=calcite&supercell=2&flags=axes,glides,screws&embed=1&hide=cell,export',
    ),
  ).toStrictEqual({
    address:
      '/crystals?spaceGroup=62&setting=2&structure=calcite&supercell=2&flags=axes,glides,screws&embed=1&hide=cell,export',
    embedded: true,
    hidden: ['cell', 'export'],
    layers: ['axes', 'glides', 'screws'],
  });
});
