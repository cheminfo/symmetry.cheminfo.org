/**
 * The crystal the viewer draws, derived from the file on screen: read once per
 * file, expanded once per file, then packed and repeated by react-cheminfo's
 * `crystalView` once per packing and stack of cells.
 */

import { useSignals } from '@preact/signals-react/runtime';
import { useMemo } from 'react';
import type { CrystalScene, CrystalView } from 'react-cheminfo/crystal3d';
import { crystalView, useCrystalCaption } from 'react-cheminfo/crystal3d';
import { bondLimit } from 'react-cheminfo/molstar/bonds';

import type { OpenedCif } from '../../crystal/openCif.ts';
import { openCif } from '../../crystal/openCif.ts';
import { figureCamera } from '../../figure/figurePage.ts';
import { state } from '../../state/index.ts';
import type { CrystalAnalysis } from '../crystals/crystalScene.ts';
import { analyseCrystal } from '../crystals/crystalScene.ts';

import type { ViewerSource } from './viewerSource.ts';
import { viewerSource } from './viewerSource.ts';

/** A crystal on screen. */
export interface ViewerCrystal {
  readonly source: ViewerSource;
  readonly opened: OpenedCif;
  readonly analysis: CrystalAnalysis;
  /** What is drawn: the atoms, and how many cells of them. */
  readonly view: CrystalView;
  readonly scene: CrystalScene;
  /** One line saying what is on screen. */
  readonly caption: string;
}

/** What the viewer has: nothing, a file it could not read, or a crystal. */
export type ViewerState =
  | { readonly kind: 'empty' }
  | { readonly kind: 'unreadable'; readonly problem: string }
  | ({ readonly kind: 'crystal' } & ViewerCrystal);

/**
 * The crystal on screen.
 * @returns What the viewer has.
 */
export function useViewerCrystal(): ViewerState {
  useSignals();
  const source = viewerSource();
  const packing = state.view.viewer.packing.value;
  const bonds = state.view.viewer.bonds.value;
  const asked = state.view.viewer.supercell.value;
  const unitCell = state.preferences.flags.unitCell.value;
  const camera = figureCamera.value;

  const text = source?.text ?? '';
  const name = source?.name ?? '';
  const opened = useMemo(
    () => (text === '' ? null : openCif(text, name)),
    [text, name],
  );
  const analysis = useMemo(
    () =>
      opened === null || typeof opened === 'string'
        ? null
        : analyseCrystal(opened.draft, opened.setting),
    [opened],
  );
  const view = useMemo(
    () =>
      analysis === null
        ? null
        : crystalView(analysis.atoms, analysis.lattice, {
            packing,
            cells: asked,
            bondLimit,
          }),
    [analysis, packing, asked],
  );
  const caption = useCrystalCaption(name, view ?? NO_VIEW, asked);
  const scene = useMemo(
    (): CrystalScene => ({
      atoms: view?.atoms ?? [],
      cell: unitCell && analysis !== null ? analysis.lattice.cell : null,
      repeat: [view?.cells ?? 1, view?.cells ?? 1, view?.cells ?? 1],
      elements: [],
      labels: false,
      bonds,
      camera,
    }),
    [view, analysis, unitCell, bonds, camera],
  );

  if (source === null || opened === null) return { kind: 'empty' };
  if (typeof opened === 'string') {
    return { kind: 'unreadable', problem: opened };
  }
  if (analysis === null || view === null) return { kind: 'empty' };
  return { kind: 'crystal', source, opened, analysis, view, scene, caption };
}

/** What an empty viewer holds, for a caption nobody reads. */
const NO_VIEW: Pick<CrystalView, 'molecules' | 'atomsPerCell' | 'cells'> = {
  molecules: 0,
  atomsPerCell: 0,
  cells: 1,
};
