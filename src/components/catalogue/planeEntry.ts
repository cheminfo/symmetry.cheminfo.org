/**
 * One plane group's page — a wallpaper group over a cell, or a frieze group
 * along a strip.
 *
 * The two catalogues stay apart because `p1`, `p2` and `p1m1` each name a group
 * in both sets and they are different groups. Everything drawn and listed here
 * is decomposed from the group's own coset list, so the hexagonal groups —
 * the ones nobody checks — are as right as p2.
 */

import { FRIEZE_TO_WALLPAPER } from '../../data/friezeGroups.ts';
import { count } from '../../seo/describe.ts';
import type { PlaneElementTable } from '../../symmetry/planeElements.ts';
import { planeElementTable } from '../../symmetry/planeElements.ts';
import type {
  FriezeGroup,
  WallpaperGroup,
} from '../../symmetry/planeGroups.ts';
import {
  cellShifts,
  friezeById,
  friezeOperations,
  latticeCell,
  wallpaperById,
  wallpaperOperations,
} from '../../symmetry/planeGroups.ts';

import { stripShifts } from './friezeDiagram.ts';
import { cellElementLabels, elementLegend } from './planeElementList.ts';
import type { CatalogueEntryView, EntryFact, EntrySection } from './types.ts';

/** How many cells of the element table are searched for the ones in the first. */
const SEARCH_CELLS = 2;

/** One of the seventeen, by the id the address carries. */
export function wallpaperEntry(id: string): CatalogueEntryView | null {
  const group = wallpaperById(id);
  if (group === undefined) return null;
  const operations = wallpaperOperations(group);
  const table = planeElementTable(operations, cellShifts(SEARCH_CELLS));
  return {
    id: group.id,
    symbol: group.id,
    subtitle: `Wallpaper group ${group.number} of 17 — ${group.lattice} lattice, point group ${group.pointGroup}, ${count(group.operationsPerCell, 'operation')} per cell.`,
    figure: {
      kind: 'wallpaper',
      operations,
      cell: latticeCell(group.lattice, 100),
      caption: captionOf(group.id, 'four cells', table),
    },
    facts: wallpaperFacts(group),
    settings: [],
    settingIndex: 0,
    open: [
      {
        label: `Draw a pattern in ${group.id}`,
        detail: 'Put a motif in the cell and watch the group repeat it.',
        target: { page: 'plane', planeGroup: group.id },
      },
    ],
    sections: sectionsOf(
      group.generalPositions,
      group.generators,
      table,
      'cell',
    ),
  };
}

/** One of the seven, by the id the address carries. */
export function friezeEntry(id: string): CatalogueEntryView | null {
  const group = friezeById(id);
  if (group === undefined) return null;
  const operations = friezeOperations(group);
  const table = planeElementTable(operations, stripShifts(SEARCH_CELLS));
  return {
    id: group.id,
    symbol: group.id,
    subtitle: `Frieze group ${group.number} of 7 — Conway's ${group.conway}, point group ${group.pointGroup}, ${count(group.operationsPerPeriod, 'operation')} per period.`,
    figure: {
      kind: 'frieze',
      operations,
      caption: captionOf(group.id, 'three periods', table),
    },
    facts: friezeFacts(group),
    settings: [],
    settingIndex: 0,
    open: wallpaperLink(group),
    sections: sectionsOf(
      group.generalPositions,
      group.generators,
      table,
      'period',
    ),
  };
}

/**
 * Where a frieze page sends a reader.
 *
 * It is the wallpaper group the strip belongs to, and not the frieze group
 * itself: the plane workbench names a group by one `planeGroup` value, and
 * `p1`, `p2`, `p2mg`, `p2mm` and `p1m1` each answer to a wallpaper group there.
 * A link that opened the wrong group would be worse than none.
 */
function wallpaperLink(group: FriezeGroup): CatalogueEntryView['open'] {
  const wallpaper = FRIEZE_TO_WALLPAPER[group.id];
  if (wallpaper === undefined) return [];
  return [
    {
      label: `Draw wallpaper group ${wallpaper}`,
      detail: `Its strip along one direction is ${group.id}.`,
      target: { page: 'plane', planeGroup: wallpaper },
    },
  ];
}

function wallpaperFacts(group: WallpaperGroup): readonly EntryFact[] {
  const facts: EntryFact[] = [
    { label: 'Number', value: `${group.number} of 17` },
    { label: 'Short symbol', value: group.id, mono: true },
  ];
  if (group.full !== group.id) {
    facts.push({ label: 'Full symbol', value: group.full, mono: true });
  }
  facts.push(
    { label: 'Orbifold', value: group.orbifold, mono: true },
    { label: 'Lattice', value: `${group.lattice} lattice` },
    { label: 'Point group', value: group.pointGroup, mono: true },
    { label: 'Operations per cell', value: String(group.operationsPerCell) },
    { label: 'Asymmetric unit', value: group.fundamentalDomain },
    { label: 'Where you see it', value: group.example },
  );
  return facts;
}

function friezeFacts(group: FriezeGroup): readonly EntryFact[] {
  const facts: EntryFact[] = [
    { label: 'Number', value: `${group.number} of 7` },
    { label: 'Short symbol', value: group.id, mono: true },
  ];
  if (group.full !== group.id) {
    facts.push({ label: 'Full symbol', value: group.full, mono: true });
  }
  facts.push(
    { label: 'Orbifold', value: group.orbifold, mono: true },
    { label: "Conway's name", value: group.conway },
    { label: 'Point group', value: group.pointGroup, mono: true },
    {
      label: 'Operations per period',
      value: String(group.operationsPerPeriod),
    },
    { label: 'Asymmetric unit', value: group.fundamentalDomain },
    { label: 'Where you see it', value: group.example },
  );
  const wallpaper = FRIEZE_TO_WALLPAPER[group.id];
  if (wallpaper !== undefined) {
    facts.push({ label: 'Strip of', value: `wallpaper group ${wallpaper}` });
  }
  return facts;
}

/** The two sections both plane catalogues carry. */
/** What the picture draws, said in the glyphs it actually uses. */
function captionOf(id: string, span: string, table: PlaneElementTable): string {
  const legend = elementLegend(table);
  return legend === ''
    ? `${id} over ${span}: it has nothing but its translations, so only the cell is drawn.`
    : `The symmetry elements of ${id} over ${span}: ${legend}.`;
}

function sectionsOf(
  generalPositions: string,
  generators: string,
  table: PlaneElementTable,
  unit: 'cell' | 'period',
): readonly EntrySection[] {
  const elements = cellElementLabels(table);
  return [
    {
      id: 'positions',
      title: 'General positions',
      part: 'operations',
      body: {
        kind: 'tokens',
        tokens: generalPositions.split(';').map((triplet) => triplet.trim()),
        note:
          generators === ''
            ? 'The lattice translations alone generate it.'
            : `Closed from the generators ${generators.replaceAll(';', ' and ')}.`,
      },
    },
    {
      id: 'elements',
      title: 'Symmetry elements',
      part: 'operations',
      body:
        elements.length === 0
          ? {
              kind: 'note',
              lines: [
                `Only the translations: nothing is left fixed anywhere in the ${unit}.`,
              ],
            }
          : {
              kind: 'tokens',
              tokens: elements,
              note: `One entry per element of a ${unit}, decomposed from the operations themselves. The diagram repeats each at every lattice point.`,
            },
    },
  ];
}
