/**
 * One point group's page: everything the data layer knows about it, said here
 * rather than linked to.
 *
 * Nothing is transcribed. The operations are generated and closed, the classes
 * and the character table come from the catalogue the tables were written
 * against, and the molecules are the library's own — so this page cannot
 * disagree with the workbench on the tab next to it.
 */

import { characterTableOf } from '../../data/characterTables.ts';
import type { MoleculeEntry } from '../../data/molecules.ts';
import { moleculesOfGroup } from '../../data/molecules.ts';
import type { PointGroup } from '../../data/pointGroups.ts';
import { pointGroupBySlug } from '../../data/pointGroups.ts';
import { count } from '../../seo/describe.ts';
import { operationsOf } from '../../symmetry/pointGroups.ts';
import { groupOperationNames } from '../../symmetry/validate.ts';

import { factsOf, subtitleOf } from './pointGroupFacts.ts';
import type {
  CatalogueEntryView,
  CatalogueLink,
  EntrySection,
} from './types.ts';

/** What a page says for the ten finite groups the site ships no table for. */
const NO_TABLE_NOTE =
  'The site ships no character table for this group. Its operations and its classes are above.';

/**
 * One group's page, by the slug the address carries.
 * @param slug - Lowercase Schoenflies symbol, e.g. `c2v`.
 * @returns The entry, or `null` when no group answers to that address.
 */
export function pointGroupEntry(slug: string): CatalogueEntryView | null {
  const group = pointGroupBySlug(slug);
  if (group === undefined) return null;
  const molecules = moleculesOfGroup(group.id);
  const first = molecules[0];
  return {
    id: group.slug,
    symbol: group.schoenflies,
    subtitle: subtitleOf(group),
    figure: Number.isFinite(group.order)
      ? {
          kind: 'stereogram',
          operations: operationsOf(group.id),
          caption: `Stereogram of ${group.schoenflies}: a filled mark is above the plane, an open one below, and a comma marks a point of the opposite hand.`,
        }
      : null,
    facts: factsOf(group),
    settings: [],
    settingIndex: 0,
    open:
      first === undefined
        ? []
        : [
            {
              label: `Open ${first.name} in the workbench`,
              detail: first.why,
              target: { page: 'molecules', moleculeId: first.id },
            },
          ],
    sections: sectionsOf(group, molecules.map(moleculeLink)),
  };
}

function sectionsOf(
  group: PointGroup,
  molecules: readonly CatalogueLink[],
): readonly EntrySection[] {
  return [
    operationSection(group),
    {
      id: 'classes',
      title: 'Classes',
      part: 'operations',
      body: {
        kind: 'table',
        headers: ['Class', 'Operations in it'],
        rows: group.classes.map((entry) => ({
          key: entry.label,
          cells: [
            entry.label,
            Number.isFinite(entry.size) ? String(entry.size) : 'a continuum',
          ],
        })),
        note: 'These are the columns of the character table.',
      },
    },
    characterSection(group),
    {
      id: 'molecules',
      title: 'Molecules in this group',
      part: null,
      body:
        molecules.length === 0
          ? {
              kind: 'note',
              lines: [
                'The library holds no molecule in this group.',
                'The stereogram above is still the whole of its symmetry.',
              ],
            }
          : { kind: 'links', links: molecules },
    },
  ];
}

function operationSection(group: PointGroup): EntrySection {
  if (!Number.isFinite(group.order)) {
    return {
      id: 'operations',
      title: 'Operations',
      part: 'operations',
      body: {
        kind: 'note',
        lines: [
          `${group.schoenflies} turns by every angle about the molecular axis, so its operations cannot be listed.`,
          'Each rotation class below is a continuum rather than a count.',
        ],
      },
    };
  }
  return {
    id: 'operations',
    title: 'Operations',
    part: 'operations',
    body: {
      kind: 'tokens',
      // Named, not labelled: C2v holds two operations a chemist writes `σv`,
      // and Oh twelve written `C3`. The name carries the plane or the axis, and
      // is the spelling the exercises ask for.
      tokens: groupOperationNames(group.id),
      note: `Every one of the ${count(group.order, 'operation')}, closed from the generators, with the principal axis along z.`,
    },
  };
}

function characterSection(group: PointGroup): EntrySection {
  const table = characterTableOf(group.id);
  if (table !== undefined) {
    return {
      id: 'characters',
      title: 'Character table',
      part: 'characters',
      body: {
        kind: 'characters',
        table,
        ...(table.conventionNote === undefined
          ? {}
          : { note: table.conventionNote }),
      },
    };
  }
  return {
    id: 'characters',
    title: 'Character table',
    part: 'characters',
    body: {
      kind: 'note',
      lines: Number.isFinite(group.order)
        ? [NO_TABLE_NOTE]
        : [
            `${group.schoenflies} has infinitely many irreducible representations, so it is not a table of numbers.`,
            'Its Σ, Π, Δ and Φ labels come from the angular momentum about the axis.',
          ],
    },
  };
}

function moleculeLink(entry: MoleculeEntry): CatalogueLink {
  return {
    label: `${entry.name} — ${entry.formula}`,
    detail: entry.why,
    target: { page: 'molecules', moleculeId: entry.id },
  };
}
