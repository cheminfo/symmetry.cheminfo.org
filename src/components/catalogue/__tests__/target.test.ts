import { beforeEach, expect, test } from 'vitest';

import { setActiveTab, setCatalogueItem, state } from '../../../state/index.ts';
import { formatRoute, parseAddress } from '../../../utils/router.ts';
import { descriptorFor } from '../descriptors.ts';
import { openTarget, routeOf, targetHref } from '../target.ts';
import type { CatalogueTarget } from '../types.ts';

beforeEach(() => {
  setActiveTab('molecules');
  setCatalogueItem(null);
});

test('a catalogue target is written as the address it names', () => {
  const cases: ReadonlyArray<[CatalogueTarget, string]> = [
    [
      { page: 'catalogue', tab: 'point-groups', id: 'c2v' },
      '/point-groups/c2v',
    ],
    [{ page: 'catalogue', tab: 'point-groups', id: null }, '/point-groups'],
    [
      { page: 'catalogue', tab: 'space-groups', id: '225' },
      '/space-groups/225',
    ],
    [{ page: 'catalogue', tab: 'wallpaper', id: 'p4g' }, '/wallpaper/p4g'],
    [{ page: 'catalogue', tab: 'frieze', id: 'p2mg' }, '/frieze/p2mg'],
    [{ page: 'molecules', moleculeId: 'water' }, '/?molecule=water'],
    [{ page: 'plane', planeGroup: 'p4g' }, '/plane?planeGroup=p4g'],
  ];
  for (const [target, address] of cases) {
    expect(targetHref(target), address).toBe(address);
  }
});

test('a setting already at its default is left out of the address', () => {
  expect(
    targetHref({
      page: 'catalogue',
      tab: 'space-groups',
      id: '14',
      setting: 0,
    }),
  ).toBe('/space-groups/14');
  expect(
    targetHref({
      page: 'catalogue',
      tab: 'space-groups',
      id: '14',
      setting: 3,
    }),
  ).toBe('/space-groups/14?setting=3');
  // 225 is the workbench's own default, so the link to it stays a plain link.
  expect(targetHref({ page: 'crystals', number: 225, setting: 0 })).toBe(
    '/crystals',
  );
  expect(targetHref({ page: 'crystals', number: 62, setting: 0 })).toBe(
    '/crystals?spaceGroup=62',
  );
  expect(targetHref({ page: 'crystals', number: 14, setting: 2 })).toBe(
    '/crystals?spaceGroup=14&setting=2',
  );
});

test('opening a target leaves the router at the address the link named', () => {
  const targets: readonly CatalogueTarget[] = [
    { page: 'catalogue', tab: 'space-groups', id: '225' },
    { page: 'catalogue', tab: 'space-groups', id: '14', setting: 3 },
    { page: 'catalogue', tab: 'wallpaper', id: 'p4g' },
    { page: 'catalogue', tab: 'point-groups', id: null },
    { page: 'plane', planeGroup: 'pmg' },
    { page: 'molecules', moleculeId: 'ammonia' },
  ];
  for (const target of targets) {
    openTarget(target);
    const route = { ...routeOf(target) };
    expect(state.view.activeTab.value, formatRoute(route)).toBe(route.tab);
    // The address the router would write is the one the anchor carried.
    expect(formatRoute(route)).toBe(targetHref(target));
  }
});

test('opening a crystal target sets the number before the setting', () => {
  openTarget({ page: 'crystals', number: 14, setting: 3 });
  expect(state.view.activeTab.value).toBe('crystals');
  expect(state.view.crystals.spaceGroupNumber.value).toBe(14);
  expect(state.view.crystals.settingIndex.value).toBe(3);
  // A second group resets the index, because it means nothing across numbers.
  openTarget({ page: 'crystals', number: 225, setting: 0 });
  expect(state.view.crystals.settingIndex.value).toBe(0);
});

test('every address the catalogues hand out parses back to the same route', () => {
  for (const tab of [
    'point-groups',
    'space-groups',
    'wallpaper',
    'frieze',
  ] as const) {
    const descriptor = descriptorFor(tab);
    for (const row of descriptor.rows) {
      const target: CatalogueTarget = {
        page: 'catalogue',
        tab,
        id: row.id,
        ...(row.setting === undefined ? {} : { setting: row.setting }),
      };
      const address = targetHref(target);
      const parsed = parseAddress(address);
      expect(parsed.tab, address).toBe(tab);
      expect(parsed.id, address).toBe(row.id);
    }
  }
});
