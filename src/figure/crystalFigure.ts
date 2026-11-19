/**
 * What a figure of the viewer carries, so a drawing or a document can hand it
 * back and it opens as it was drawn: the file itself, how the cell was filled,
 * which bonds were drawn, and where the camera stood.
 *
 * The file goes in whole rather than as a library name or an address: a CIF
 * somebody dropped has no address, and a figure must open long after the page
 * that drew it has been closed.
 */

import type { FigureStates } from 'react-cheminfo/core';
import type { Molecule3DCamera } from 'react-cheminfo/molecule3d';
import {
  formatMolecule3DCamera,
  parseMolecule3DCamera,
} from 'react-cheminfo/molecule3d';

import type { ViewerBonds, ViewerPacking } from '../state/index.ts';
import {
  SUPERCELL_RANGE,
  VIEWER_BONDS,
  VIEWER_PACKINGS,
  clampToRange,
} from '../state/index.ts';

/** The version of {@link CrystalFigure}, as its `data` part says it. */
export const CRYSTAL_FIGURE_VERSION = 1;

/** The version of {@link CrystalFigureView}, as its `view` part says it. */
export const CRYSTAL_VIEW_VERSION = 1;

/** What the figure is: the file, and what to call it. */
export interface CrystalFigure {
  /** What the viewer called it, e.g. `aspirin` or a file name without `.cif`. */
  readonly name: string;
  /** The CIF, exactly as it was opened. */
  readonly cif: string;
  /** The library structure it is, or `null` for a file somebody opened. */
  readonly structureId: string | null;
}

/** How it was drawn. */
export interface CrystalFigureView {
  /** Cells drawn along each axis. */
  readonly supercell: number;
  readonly packing: ViewerPacking;
  /** Which bonds were drawn; a figure saved before there was a choice drew all. */
  readonly bonds: ViewerBonds;
  /** Whether the box of the cell was drawn. */
  readonly unitCell: boolean;
  /** Where the camera stood, or `null` for the framing a new structure gets. */
  readonly camera: Molecule3DCamera | null;
}

/**
 * The state a figure of the viewer carries.
 * @param figure - What it is.
 * @param view - How it was drawn.
 * @returns The state, in the family's envelope.
 */
export function crystalFigureStates(
  figure: CrystalFigure,
  view: CrystalFigureView,
): FigureStates {
  return {
    data: { version: CRYSTAL_FIGURE_VERSION, value: figure },
    view: {
      version: CRYSTAL_VIEW_VERSION,
      value: {
        supercell: view.supercell,
        packing: view.packing,
        bonds: view.bonds,
        unitCell: view.unitCell,
        camera:
          view.camera === null ? null : formatMolecule3DCamera(view.camera),
      },
    },
  };
}

/** A figure read back, ready to open. */
export interface OpenedCrystalFigure {
  readonly figure: CrystalFigure;
  readonly view: CrystalFigureView;
}

/**
 * Read what a figure of the viewer carries.
 *
 * A view part this version cannot read opens on the viewer's own defaults: the
 * crystal is what the figure is, and it still opens.
 * @param states - What the figure carries.
 * @returns The figure and its view.
 * @throws {Error} When the figure carries no crystal this version reads.
 */
export function readCrystalFigure(states: FigureStates): OpenedCrystalFigure {
  const data = states.data;
  if (data?.version !== CRYSTAL_FIGURE_VERSION || !isRecord(data.value)) {
    throw new Error(
      'This figure carries no crystal this version of the site can read.',
    );
  }
  const { name, cif, structureId } = data.value;
  if (typeof cif !== 'string' || cif.trim() === '') {
    throw new Error('This figure carries no CIF to open.');
  }
  return {
    figure: {
      name: typeof name === 'string' ? name : 'crystal',
      cif,
      structureId: typeof structureId === 'string' ? structureId : null,
    },
    view: readView(states.view),
  };
}

function readView(part: FigureStates['view']): CrystalFigureView {
  const fallback: CrystalFigureView = {
    supercell: SUPERCELL_RANGE.initial,
    packing: 'molecules',
    bonds: 'all',
    unitCell: true,
    camera: null,
  };
  if (part?.version !== CRYSTAL_VIEW_VERSION || !isRecord(part.value)) {
    return fallback;
  }
  const { supercell, packing, bonds, unitCell, camera } = part.value;
  return {
    supercell:
      typeof supercell === 'number' && Number.isFinite(supercell)
        ? clampToRange(Math.round(supercell), SUPERCELL_RANGE)
        : fallback.supercell,
    packing: VIEWER_PACKINGS.find((known) => known === packing) ?? 'molecules',
    bonds: VIEWER_BONDS.find((known) => known === bonds) ?? fallback.bonds,
    unitCell: typeof unitCell === 'boolean' ? unitCell : fallback.unitCell,
    camera: typeof camera === 'string' ? parseMolecule3DCamera(camera) : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
