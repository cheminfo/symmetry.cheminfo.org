import { expect, test } from 'vitest';

import { DISPLAY_FLAGS, DISPLAY_FLAG_KEYS } from '../displayFlags.ts';
import {
  CATALOGUE_TAB_IDS,
  DEFAULT_TAB,
  NAV_TAB_IDS,
  TAB_IDS,
  TAB_LABELS,
  isCatalogueTab,
  isTabId,
} from '../tabs.ts';
import {
  selectSetting,
  selectSpaceGroup,
  setSupercell,
  setTiles,
  view,
} from '../view.ts';

test('the bar lists six pages, and the site routes eleven', () => {
  expect(NAV_TAB_IDS).toStrictEqual([
    'molecules',
    'crystals',
    'plane',
    'tutorial',
    'exercises',
    'cheatsheet',
  ]);
  expect(CATALOGUE_TAB_IDS).toStrictEqual([
    'point-groups',
    'space-groups',
    'wallpaper',
    'frieze',
  ]);
  expect(TAB_IDS).toHaveLength(11);
  expect(DEFAULT_TAB).toBe('molecules');
  expect(Object.keys(TAB_LABELS)).toHaveLength(11);
});

test('a page name is narrowed, and a catalogue is told apart', () => {
  expect(isTabId('crystals')).toBe(true);
  expect(isTabId('molecule')).toBe(false);
  expect(isCatalogueTab('wallpaper')).toBe(true);
  expect(isCatalogueTab('plane')).toBe(false);
});

test('the twelve layers are named once, and each starts somewhere', () => {
  expect(DISPLAY_FLAG_KEYS).toHaveLength(12);
  expect(DISPLAY_FLAGS.map((meta) => meta.key)).toStrictEqual([
    ...DISPLAY_FLAG_KEYS,
  ]);
  expect(
    DISPLAY_FLAGS.filter((meta) => meta.initial).map((meta) => meta.key),
  ).toStrictEqual(['axes', 'mirrors', 'inversion', 'unitCell', 'labels']);
});

test('a number a control asks for beyond the ceiling is clamped there too', () => {
  selectSpaceGroup(9999);

  expect(view.crystals.spaceGroupNumber.value).toBe(230);

  selectSpaceGroup(0);

  expect(view.crystals.spaceGroupNumber.value).toBe(1);

  selectSetting(-4);

  expect(view.crystals.settingIndex.value).toBe(0);

  setSupercell(12);

  expect(view.crystals.supercell.value).toBe(4);

  setTiles(0);

  expect(view.plane.tiles.value).toBe(1);

  setTiles(Number.NaN);

  expect(view.plane.tiles.value).toBe(4);
});
