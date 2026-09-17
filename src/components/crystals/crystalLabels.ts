/**
 * What the crystal workbench calls things.
 *
 * The names are derived from the same objects the view draws, so a rod in the
 * scene, a row in the list beside it and a line in the caption can never
 * disagree about which element they are talking about.
 */

import { SUPERCELL_ATOM_CAP } from '../../crystal/supercell.ts';
import type { SpaceGroupSetting } from '../../data/spaceGroups.ts';
import type { SymmetryElement } from '../../symmetry/core/index.ts';

/**
 * How one element is named on screen: its Hermann-Mauguin symbol and the
 * direction it runs in, which is what an International Tables diagram labels.
 *
 * @param element - The element, from `symmetryElements`.
 */
export function elementLabel(element: SymmetryElement): string {
  if (element.axis !== null) {
    return `${element.symbol} along [${element.axis.join(' ')}]`;
  }
  if (element.normal !== null) {
    return `${element.symbol} ⟂ (${element.normal.join(' ')})`;
  }
  return element.symbol;
}

/** How many elements of each kind the cell holds, in a fixed order. */
export function elementTally(
  elements: readonly SymmetryElement[],
): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const element of elements) {
    if (element.kind === 'identity' || element.kind === 'translation') continue;
    counts.set(element.kind, (counts.get(element.kind) ?? 0) + 1);
  }
  const tally: Array<[string, number]> = [];
  for (const kind of KIND_ORDER) {
    const count = counts.get(kind);
    if (count !== undefined) tally.push([kind, count]);
  }
  return tally;
}

/**
 * How one setting is named in a list: its own symbol, then what makes it
 * different from its siblings — the origin, the axes, the unique axis.
 *
 * @param setting - The setting.
 */
export function settingLabel(setting: SpaceGroupSetting): string {
  const marks: string[] = [];
  if (setting.originChoice !== null) {
    marks.push(`origin ${setting.originChoice}`);
  }
  if (setting.axes !== null) marks.push(`${setting.axes} axes`);
  if (setting.uniqueAxis !== null) {
    marks.push(`unique axis ${setting.uniqueAxis}`);
  }
  return marks.length === 0
    ? setting.hmSetting
    : `${setting.hmSetting} — ${marks.join(', ')}`;
}

/** The layers a cell has. The molecular ones belong to a free-standing shape. */
export const CRYSTAL_LAYERS = [
  'unitCell',
  'axes',
  'screws',
  'mirrors',
  'glides',
  'inversion',
  'improper',
  'asymmetricUnit',
  'labels',
] as const;

/** The kinds, in the order a readout lists them. */
export const KIND_ORDER: readonly string[] = [
  'rotation',
  'screw',
  'rotoinversion',
  'mirror',
  'glide',
  'inversion',
];

/** What the caption under the canvas has to say. */
export interface SceneCaption {
  readonly name: string;
  readonly atomsPerCell: number;
  /** Cells drawn along each axis. */
  readonly cells: number;
  /** Cells asked for, which is more when the stack would pass the ceiling. */
  readonly asked: number;
  /** How many symmetry elements are on screen. */
  readonly elements: number;
  /** Whether they carry their names. */
  readonly named: boolean;
}

/**
 * One line under the canvas: what it is, and what had to give way to draw it.
 *
 * @param about - See {@link SceneCaption}.
 */
export function sceneCaption(about: SceneCaption): string {
  const { name, atomsPerCell, cells, asked, elements, named } = about;
  const stack = cells === 1 ? 'one cell' : `${cells}×${cells}×${cells} cells`;
  const parts = [
    `${name} — ${atomsPerCell} atoms in the cell, drawn over ${stack}.`,
  ];
  if (cells !== asked) {
    parts.push(
      `${asked}×${asked}×${asked} would pass ${SUPERCELL_ATOM_CAP} atoms.`,
    );
  }
  if (cells > 1 && elements > 0) {
    parts.push('The elements are drawn in the first cell.');
  }
  if (elements > 0 && !named) {
    parts.push(`${elements} elements, too many to name on screen.`);
  }
  return parts.join(' ');
}
