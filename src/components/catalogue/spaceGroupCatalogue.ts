/**
 * The space-group index: the 230, by crystal system, each with its number, its
 * Hermann-Mauguin symbol and its centring.
 *
 * One row per **number**, not per setting: the 521 settings are the same 230
 * groups written on other axes, and a list that showed all of them would put
 * nine spellings of `P 21/c` in a row. Which setting a page opens on rides in
 * `?setting=`.
 */

import type { SpaceGroupSetting } from '../../data/spaceGroups.ts';
import { count } from '../../seo/describe.ts';
import { SPACE_GROUP_SETTINGS } from '../../symmetry/spaceGroups.ts';

import { spaceGroupEntry } from './spaceGroupEntry.ts';
import { centringName, compactSymbol } from './spaceGroupFacts.ts';
import type {
  CatalogueDescriptor,
  CatalogueFacetOption,
  CatalogueRow,
} from './types.ts';

/** The seven systems, in the order the International Tables number them. */
const SYSTEMS = [
  'triclinic',
  'monoclinic',
  'orthorhombic',
  'tetragonal',
  'trigonal',
  'hexagonal',
  'cubic',
] as const;

/**
 * The Bravais letters, in the order a symbol may open with.
 *
 * Only the ones a standard setting actually uses reach the index: `A` and `B`
 * centrings exist, but only in the non-standard settings of the monoclinic and
 * orthorhombic groups, which a number's page offers under `?setting=`. A
 * capsule that can never match a row is worse than a missing one.
 */
const CENTRINGS = ['P', 'A', 'B', 'C', 'I', 'F', 'R'] as const;

/** The standard setting of each number: what the index lists. */
const NUMBERS: readonly SpaceGroupSetting[] = SPACE_GROUP_SETTINGS.filter(
  (setting) => setting.variant === 0,
);

/** The catalogue at `/space-groups`. */
export const SPACE_GROUP_CATALOGUE: CatalogueDescriptor = {
  tab: 'space-groups',
  title: 'Space groups',
  intro:
    'All 230 ways symmetry and a lattice fit together, with the general positions, the symmetry elements and the systematic absences of each.',
  searchHint: 'Search a number, a symbol or a Hall symbol',
  rows: NUMBERS.map(rowOf),
  facets: [
    {
      id: 'system',
      label: 'System',
      allLabel: 'Every system',
      options: occurring(SYSTEMS, 'system').map(systemOption),
    },
    {
      id: 'centring',
      label: 'Lattice',
      allLabel: 'Every lattice',
      options: occurring(CENTRINGS, 'centring').map(centringOption),
    },
    {
      id: 'kind',
      label: 'Showing',
      allLabel: 'Every group',
      options: [
        { value: 'centrosymmetric', label: 'Centrosymmetric' },
        { value: 'sohncke', label: 'Sohncke' },
        { value: 'symmorphic', label: 'Symmorphic' },
      ],
    },
  ],
  entry: spaceGroupEntry,
};

/** One number as the index lists it. */
export function rowOf(setting: SpaceGroupSetting): CatalogueRow {
  const tags = [
    `system:${setting.crystalSystem}`,
    `centring:${setting.centring}`,
  ];
  if (setting.centrosymmetric) tags.push('centrosymmetric');
  if (setting.sohncke) tags.push('sohncke');
  if (setting.symmorphic) tags.push('symmorphic');
  const symbols = [
    setting.hmShort,
    setting.hmFull,
    setting.hmLegacy ?? '',
    setting.hall ?? '',
  ];
  return {
    id: String(setting.number),
    symbol: compactSymbol(setting.hmShort),
    detail: `${setting.centring} lattice, class ${setting.crystalClass}, ${count(setting.multiplicity, 'general position')}.`,
    group: blockOf(setting.crystalSystem),
    tags,
    // Both spellings: the data writes `P n m a` and a student types `Pnma`, and
    // a search that only held the first finds nothing for the second.
    search: [
      setting.number,
      ...symbols,
      ...symbols.map(compactSymbol),
      setting.crystalClass,
      setting.crystalSystem,
    ]
      .join(' ')
      .toLowerCase(),
    badge: `No. ${setting.number}`,
    // A number's own page opens on its standard setting, whatever setting the
    // cell builder was left on.
    setting: 0,
  };
}

/** The heading a system's block carries, with the range of numbers in it. */
export function blockOf(system: string): string {
  const numbers = NUMBERS.filter(
    (setting) => setting.crystalSystem === system,
  ).map((setting) => setting.number);
  const first = numbers[0];
  const last = numbers.at(-1);
  const name = `${system[0]?.toUpperCase() ?? ''}${system.slice(1)}`;
  if (first === undefined || last === undefined) return name;
  return `${name} — numbers ${first} to ${last}`;
}

/** The values of one facet that at least one listed number carries. */
function occurring(
  values: readonly string[],
  facet: 'system' | 'centring',
): readonly string[] {
  const held = new Set<string>(
    NUMBERS.map((setting) =>
      facet === 'system' ? setting.crystalSystem : setting.centring,
    ),
  );
  return values.filter((value) => held.has(value));
}

function systemOption(system: string): CatalogueFacetOption {
  return { value: `system:${system}`, label: system };
}

function centringOption(centring: string): CatalogueFacetOption {
  return {
    value: `centring:${centring}`,
    label: centring,
    title: centringName(centring),
  };
}
