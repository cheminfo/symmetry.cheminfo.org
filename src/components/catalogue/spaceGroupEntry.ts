/**
 * One space group's page, in one of its settings.
 *
 * A space group is addressed by its **number**; which of its settings is in
 * force rides in `?setting=`, so 230 addresses are indexed rather than 521 and
 * a link handed out in a lecture still names the group when the setting is
 * dropped. An index past the last setting falls back to the first rather than
 * failing: a link written against another build must still open.
 */

import type { PointGroup } from '../../data/pointGroups.ts';
import { crystallographicPointGroups } from '../../data/pointGroups.ts';
import type { SpaceGroupSetting } from '../../data/spaceGroups.ts';
import { count } from '../../seo/describe.ts';
import type { SymmetryElement } from '../../symmetry/core/index.ts';
import { symmetryElements } from '../../symmetry/core/index.ts';
import {
  absentReflections,
  spaceGroupOperations,
  spaceGroupSettings,
} from '../../symmetry/spaceGroups.ts';

import {
  compactSymbol,
  factsOf,
  settingChoice,
  subtitleOf,
} from './spaceGroupFacts.ts';
import type {
  CatalogueEntryView,
  CatalogueLink,
  EntrySection,
  EntryTableRow,
} from './types.ts';

/** The order the element table is read in: the point operations, then the ones a translation makes. */
const KIND_ORDER = [
  'identity',
  'rotation',
  'mirror',
  'inversion',
  'rotoinversion',
  'screw',
  'glide',
  'translation',
];

/**
 * One space group's page, by the number the address carries.
 * @param id - The second path segment, which must be a number from 1 to 230.
 * @param settingIndex - What `?setting=` asks for.
 * @returns The entry, or `null` when the address names no space group.
 */
export function spaceGroupEntry(
  id: string,
  settingIndex: number,
): CatalogueEntryView | null {
  if (!/^\d+$/.test(id)) return null;
  const number = Number(id);
  if (number < 1 || number > 230) return null;
  const settings = spaceGroupSettings(number);
  const index = Math.min(Math.max(settingIndex, 0), settings.length - 1);
  const setting = settings[index] as SpaceGroupSetting;
  return {
    id,
    symbol: compactSymbol(setting.hmShort),
    subtitle: subtitleOf(setting),
    figure: null,
    facts: factsOf(setting),
    settings: settings.map(settingChoice),
    settingIndex: index,
    open: openLinks(setting),
    sections: [
      positionSection(setting),
      elementSection(setting),
      absenceSection(setting),
    ],
  };
}

/** Where a reader goes next: the cell builder, and the crystal class. */
function openLinks(setting: SpaceGroupSetting): readonly CatalogueLink[] {
  const links: CatalogueLink[] = [
    {
      label: `Build a cell in ${compactSymbol(setting.hmShort)}`,
      detail: 'Fills the cell with the orbit of every atom you put in it.',
      target: {
        page: 'crystals',
        number: setting.number,
        setting: setting.variant,
      },
    },
  ];
  const pointGroup = pointGroupOfClass(setting.crystalClass);
  if (pointGroup !== null) {
    links.push({
      label: `Its crystal class, ${setting.crystalClass}`,
      detail: `The point group ${pointGroup.schoenflies}, with its character table.`,
      target: { page: 'catalogue', tab: 'point-groups', id: pointGroup.slug },
    });
  }
  return links;
}

/**
 * The point group a crystal class names.
 *
 * The two catalogues meet here: `crystalClass` is the Hermann-Mauguin symbol
 * the operations derive, and the 32 crystallographic point groups carry the
 * same ASCII spelling, so the join is an equality rather than a table.
 */
function pointGroupOfClass(crystalClass: string): PointGroup | null {
  for (const group of crystallographicPointGroups()) {
    if (group.hermannMauguin === crystalClass) return group;
  }
  return null;
}

function positionSection(setting: SpaceGroupSetting): EntrySection {
  return {
    id: 'positions',
    title: 'General positions',
    part: 'positions',
    body: {
      kind: 'tokens',
      tokens: setting.operations,
      note: `Every one of the ${count(setting.multiplicity, 'coordinate triplet')} of one cell, the centring expanded.`,
    },
  };
}

function elementSection(setting: SpaceGroupSetting): EntrySection {
  const operations = spaceGroupOperations(setting);
  return {
    id: 'elements',
    title: 'Symmetry elements',
    part: 'operations',
    body: {
      kind: 'table',
      headers: ['Element', 'Along, or normal to', 'How many'],
      rows: elementRows(symmetryElements(operations)),
      note: 'Decomposed from the operations themselves, counted over one cell.',
    },
  };
}

/**
 * One row per distinct element symbol, with the directions it occurs along.
 *
 * Grouping by symbol is what makes a 192-operation group readable: `F m -3 m`
 * has 151 elements and 20 symbols, and the twenty say what the group is.
 */
export function elementRows(
  elements: readonly SymmetryElement[],
): readonly EntryTableRow[] {
  const found = new Map<
    string,
    { kind: string; directions: Set<string>; count: number }
  >();
  for (const element of elements) {
    let entry = found.get(element.symbol);
    if (entry === undefined) {
      entry = { kind: element.kind, directions: new Set(), count: 0 };
      found.set(element.symbol, entry);
    }
    entry.count++;
    const direction = directionOf(element);
    if (direction !== '') entry.directions.add(direction);
  }
  const rows = [...found.entries()].toSorted(
    (first, second) =>
      KIND_ORDER.indexOf(first[1].kind) - KIND_ORDER.indexOf(second[1].kind) ||
      first[0].localeCompare(second[0]),
  );
  return rows.map(([symbol, entry]) => ({
    key: symbol,
    cells: [
      symbol,
      entry.directions.size === 0 ? '—' : [...entry.directions].join(' '),
      String(entry.count),
    ],
  }));
}

/** `[uvw]` for an axis, `(hkl)` for a plane, nothing for a point. */
function directionOf(element: SymmetryElement): string {
  if (element.axis !== null) return `[${element.axis.join(' ')}]`;
  if (element.normal !== null) return `(${element.normal.join(' ')})`;
  return '';
}

function absenceSection(setting: SpaceGroupSetting): EntrySection {
  const conditions = absentReflections(setting);
  if (conditions.length === 0) {
    return {
      id: 'absences',
      title: 'Systematic absences',
      part: 'operations',
      body: {
        kind: 'note',
        lines: [
          'None: no operation of this group leaves a reflection where it is while moving the structure by a fraction of a cell.',
          'Every reflection this lattice allows can be observed.',
        ],
      },
    };
  }
  return {
    id: 'absences',
    title: 'Systematic absences',
    part: 'operations',
    body: {
      kind: 'table',
      headers: ['Reflections', 'Present when', 'Caused by'],
      rows: conditions.map((condition) => ({
        key: `${condition.reflections}|${condition.condition}`,
        cells: [condition.reflections, condition.condition, condition.cause],
      })),
      note: 'Read off the operations. A condition the centring already forces is not restated.',
    },
  };
}
