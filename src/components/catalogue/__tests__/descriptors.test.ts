import { expect, test } from 'vitest';

import { FRIEZE_GROUPS } from '../../../data/friezeGroups.ts';
import { WALLPAPER_GROUPS } from '../../../data/planeGroups.ts';
import { POINT_GROUPS } from '../../../data/pointGroups.ts';
import type { CatalogueTabId } from '../../../state/index.ts';
import { SPACE_GROUP_COUNT } from '../../../symmetry/spaceGroups.ts';
import { CATALOGUES, descriptorFor } from '../descriptors.ts';

const TABS: readonly CatalogueTabId[] = [
  'point-groups',
  'space-groups',
  'wallpaper',
  'frieze',
];

test('the four catalogues list every group exactly once', () => {
  const sizes = TABS.map((tab) => descriptorFor(tab).rows.length);
  expect(sizes).toStrictEqual([53, 230, 17, 7]);
  expect(sizes).toStrictEqual([
    POINT_GROUPS.length,
    SPACE_GROUP_COUNT,
    WALLPAPER_GROUPS.length,
    FRIEZE_GROUPS.length,
  ]);
  for (const tab of TABS) {
    const ids = descriptorFor(tab).rows.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  }
});

test('every row of every catalogue opens an entry under its own id', () => {
  for (const tab of TABS) {
    const descriptor = descriptorFor(tab);
    for (const row of descriptor.rows) {
      const entry = descriptor.entry(row.id, row.setting ?? 0);
      expect(entry, `${tab}/${row.id}`).not.toBeNull();
      expect(entry?.id).toBe(row.id);
      expect(entry?.symbol).toBe(row.symbol);
      expect(entry?.sections.length).toBeGreaterThanOrEqual(2);
    }
  }
});

test('an address nobody minted returns null rather than throwing', () => {
  expect(descriptorFor('point-groups').entry('c9v', 0)).toBeNull();
  expect(descriptorFor('space-groups').entry('231', 0)).toBeNull();
  expect(descriptorFor('space-groups').entry('0', 0)).toBeNull();
  expect(descriptorFor('space-groups').entry('P 21/c', 0)).toBeNull();
  expect(descriptorFor('space-groups').entry('14x', 0)).toBeNull();
  expect(descriptorFor('wallpaper').entry('p5m', 0)).toBeNull();
  expect(descriptorFor('frieze').entry('p4g', 0)).toBeNull();
});

test('wallpaper and frieze stay two namespaces, because p1 and p2 name both', () => {
  const wallpaper = descriptorFor('wallpaper');
  const frieze = descriptorFor('frieze');
  expect(wallpaper.entry('p1', 0)?.subtitle).toContain(
    'Wallpaper group 1 of 17',
  );
  expect(frieze.entry('p1', 0)?.subtitle).toContain('Frieze group 1 of 7');
  expect(wallpaper.entry('p2', 0)?.subtitle).toContain(
    'Wallpaper group 2 of 17',
  );
  expect(frieze.entry('p2', 0)?.subtitle).toContain('Frieze group 5 of 7');
  // p1m1 is a frieze id and only the full symbol of the wallpaper group pm.
  expect(frieze.rows.map((row) => row.id)).toContain('p1m1');
  expect(wallpaper.rows.map((row) => row.id)).not.toContain('p1m1');
});

test('every facet capsule matches at least one row of its own catalogue', () => {
  for (const tab of TABS) {
    const descriptor = descriptorFor(tab);
    for (const facet of descriptor.facets) {
      expect(facet.options.length, `${tab} ${facet.id}`).toBeGreaterThan(0);
      for (const option of facet.options) {
        const matched = descriptor.rows.filter((row) =>
          row.tags.includes(option.value),
        );
        expect(matched.length, `${tab} ${option.value}`).toBeGreaterThan(0);
      }
    }
  }
});

test('the catalogues are keyed by the tab they answer on', () => {
  for (const tab of TABS) expect(CATALOGUES[tab].tab).toBe(tab);
  expect(Object.keys(CATALOGUES)).toHaveLength(4);
});
