import { expect, test } from 'vitest';

import { descriptorFor } from '../descriptors.ts';
import { EMPTY_FILTER, facetCounts, filterRows, groupRows } from '../filter.ts';
import type { CatalogueFacet, CatalogueRow } from '../types.ts';

const ROWS: readonly CatalogueRow[] = [
  row('a', 'Alpha', 'first', ['colour:red', 'big'], 'alpha red'),
  row('b', 'Beta', 'first', ['colour:blue', 'big'], 'beta blue'),
  row('c', 'Gamma', 'second', ['colour:red'], 'gamma red'),
  row('d', 'Delta', 'second', ['colour:green', 'big'], 'delta green'),
];

const FACETS: readonly CatalogueFacet[] = [
  {
    id: 'colour',
    label: 'Colour',
    allLabel: 'Every colour',
    options: [
      { value: 'colour:red', label: 'red' },
      { value: 'colour:blue', label: 'blue' },
      { value: 'colour:green', label: 'green' },
    ],
  },
  {
    id: 'size',
    label: 'Size',
    allLabel: 'Every size',
    options: [{ value: 'big', label: 'big' }],
  },
];

function row(
  id: string,
  symbol: string,
  group: string,
  tags: readonly string[],
  search: string,
): CatalogueRow {
  return { id, symbol, detail: `the ${symbol}`, group, tags, search };
}

test('an empty filter keeps every row in the catalogue order', () => {
  expect(
    filterRows(ROWS, FACETS, EMPTY_FILTER).map((entry) => entry.id),
  ).toStrictEqual(['a', 'b', 'c', 'd']);
});

test('capsules inside one row are alternatives and between rows are conditions', () => {
  const red = filterRows(ROWS, FACETS, {
    query: '',
    selected: { colour: ['colour:red'] },
  });
  expect(red.map((entry) => entry.id)).toStrictEqual(['a', 'c']);

  const redOrGreen = filterRows(ROWS, FACETS, {
    query: '',
    selected: { colour: ['colour:red', 'colour:green'] },
  });
  expect(redOrGreen.map((entry) => entry.id)).toStrictEqual(['a', 'c', 'd']);

  const redOrGreenAndBig = filterRows(ROWS, FACETS, {
    query: '',
    selected: { colour: ['colour:red', 'colour:green'], size: ['big'] },
  });
  expect(redOrGreenAndBig.map((entry) => entry.id)).toStrictEqual(['a', 'd']);
});

test('the search box and the capsules narrow together', () => {
  const found = filterRows(ROWS, FACETS, {
    query: '  RED ',
    selected: { size: ['big'] },
  });
  expect(found.map((entry) => entry.id)).toStrictEqual(['a']);
  expect(
    filterRows(ROWS, FACETS, { query: 'nothing', selected: {} }),
  ).toStrictEqual([]);
});

test("a row's own counts ignore its own selection, so a capsule says what pressing it does", () => {
  const state = { query: '', selected: { colour: ['colour:red'] } };
  // Blue is not 0 although red is pressed: pressing blue would keep one row.
  expect(facetCounts(ROWS, FACETS, state, 'colour')).toStrictEqual({
    colour: 4,
    'colour:red': 2,
    'colour:blue': 1,
    'colour:green': 1,
  });
  // The other row's counts do respect it: only the two red rows are in play.
  expect(facetCounts(ROWS, FACETS, state, 'size')).toStrictEqual({
    size: 2,
    big: 1,
  });
});

test('counts of a facet nobody declared come back empty rather than throwing', () => {
  expect(facetCounts(ROWS, FACETS, EMPTY_FILTER, 'shape')).toStrictEqual({
    shape: 0,
  });
});

test('rows are blocked under their own heading, in first-appearance order', () => {
  const blocks = groupRows(filterRows(ROWS, FACETS, EMPTY_FILTER));
  expect(blocks.map((block) => block.group)).toStrictEqual(['first', 'second']);
  expect(
    blocks.map((block) => block.rows.map((entry) => entry.id)),
  ).toStrictEqual([
    ['a', 'b'],
    ['c', 'd'],
  ]);
  expect(groupRows([])).toStrictEqual([]);
});

test('a student who types Pnma finds space group 62, which the data spells P n m a', () => {
  const descriptor = descriptorFor('space-groups');
  for (const [typed, expected] of [
    ['Pnma', '62'],
    ['P n m a', '62'],
    ['P21/c', '14'],
    ['P 21/c', '14'],
    ['Fm-3m', '225'],
    ['F m -3 m', '225'],
    ['R-3c', '167'],
    ['225', '225'],
  ] as const) {
    const found = filterRows(descriptor.rows, descriptor.facets, {
      query: typed,
      selected: {},
    });
    expect(
      found.map((entry) => entry.id),
      typed,
    ).toStrictEqual([expected]);
  }
});

test('a molecule finds its point group, and a Hermann-Mauguin symbol its Schoenflies one', () => {
  const descriptor = descriptorFor('point-groups');
  const search = (query: string) =>
    filterRows(descriptor.rows, descriptor.facets, { query, selected: {} }).map(
      (entry) => entry.id,
    );
  expect(search('water')).toStrictEqual(['c2v']);
  expect(search('m-3m')).toStrictEqual(['oh']);
  // A substring, on purpose: the substituted benzenes are how a student sees
  // what lowering the symmetry of one ring does.
  expect(search('benzene')).toStrictEqual(['d2h', 'd3h', 'd6h']);
  expect(search('Benzene C6H6')).toStrictEqual(['d6h']);
});

test('the crystallographic capsule keeps exactly the 32 crystal classes', () => {
  const descriptor = descriptorFor('point-groups');
  const found = filterRows(descriptor.rows, descriptor.facets, {
    query: '',
    selected: { kind: ['crystallographic'] },
  });
  expect(found).toHaveLength(32);
  for (const entry of found) expect(entry.badge).toBeDefined();
});

test('the space-group capsules reproduce the counts the operations derive', () => {
  const descriptor = descriptorFor('space-groups');
  const counts = facetCounts(
    descriptor.rows,
    descriptor.facets,
    EMPTY_FILTER,
    'kind',
  );
  expect(counts).toStrictEqual({
    kind: 230,
    centrosymmetric: 92,
    sohncke: 65,
    symmorphic: 73,
  });
  const systems = facetCounts(
    descriptor.rows,
    descriptor.facets,
    EMPTY_FILTER,
    'system',
  );
  expect(systems).toStrictEqual({
    system: 230,
    'system:triclinic': 2,
    'system:monoclinic': 13,
    'system:orthorhombic': 59,
    'system:tetragonal': 68,
    'system:trigonal': 25,
    'system:hexagonal': 27,
    'system:cubic': 36,
  });
});

/** The line one catalogue prints under a symbol. */
function detailOf(
  tab: Parameters<typeof descriptorFor>[0],
  id: string,
): string {
  const found = descriptorFor(tab).rows.find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`no row ${id}`);
  return found.detail;
}

test('a group with one of something says one, not "1 operations"', () => {
  expect(detailOf('point-groups', 'c1')).toBe(
    '1 operation, 1 class, triclinic.',
  );
  expect(detailOf('point-groups', 'c2v')).toBe(
    '4 operations, 4 classes, orthorhombic.',
  );
  expect(detailOf('space-groups', '1')).toBe(
    'P lattice, class 1, 1 general position.',
  );
  expect(detailOf('space-groups', '225')).toBe(
    'F lattice, class m-3m, 192 general positions.',
  );
  expect(detailOf('wallpaper', 'p1')).toBe(
    'Point group 1, 1 operation per cell, orbifold ○.',
  );
  expect(detailOf('frieze', 'p1')).toBe(
    "Conway's hop, 1 operation per period, orbifold ∞∞.",
  );
});
