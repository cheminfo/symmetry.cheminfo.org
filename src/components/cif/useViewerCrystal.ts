/**
 * The crystal the viewer draws, derived from the file on screen: read once per
 * file, expanded once per file, packed once per packing, repeated once per
 * stack of cells.
 */

import { useSignals } from '@preact/signals-react/runtime';
import { useMemo } from 'react';

import type { OpenedCif } from '../../crystal/openCif.ts';
import { openCif } from '../../crystal/openCif.ts';
import type { PackingResult } from '../../crystal/packing.ts';
import { packMolecules } from '../../crystal/packing.ts';
import { largestRepeatThatFits } from '../../crystal/supercell.ts';
import { figureCamera } from '../../figure/figurePage.ts';
import { state } from '../../state/index.ts';
import { fractionalToCartesian } from '../../symmetry/core/index.ts';
import { bondLimit } from '../../viewer/bondRule.ts';
import type { ViewerAtom } from '../../viewer/core.ts';
import { supercellAtoms } from '../../viewer/core.ts';
import type { CrystalAnalysis } from '../crystals/crystalScene.ts';
import { analyseCrystal } from '../crystals/crystalScene.ts';
import type { ViewerScene } from '../viewer/index.ts';

import type { ViewerSource } from './viewerSource.ts';
import { viewerSource } from './viewerSource.ts';

/** A crystal on screen. */
export interface ViewerCrystal {
  readonly source: ViewerSource;
  readonly opened: OpenedCif;
  readonly analysis: CrystalAnalysis;
  readonly packed: PackingResult;
  /** Cells drawn along each axis: what was asked, or fewer when too many atoms. */
  readonly cells: number;
  readonly scene: ViewerScene;
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
  const packed = useMemo((): PackingResult | null => {
    if (analysis === null) return null;
    return packing === 'molecules'
      ? packMolecules(analysis.atoms, analysis.lattice, bondLimit)
      : { atoms: analysis.atoms, molecules: 0, extended: false };
  }, [analysis, packing]);
  const cells =
    packed === null ? 1 : largestRepeatThatFits(packed.atoms.length, asked);
  const atoms = useMemo((): ViewerAtom[] => {
    if (analysis === null || packed === null) return [];
    const oneCell: ViewerAtom[] = [];
    for (const atom of packed.atoms) {
      const [x = 0, y = 0, z = 0] = fractionalToCartesian(
        analysis.lattice,
        atom.position,
      );
      oneCell.push({ element: atom.element, position: [x, y, z] });
    }
    return supercellAtoms(oneCell, analysis.lattice.cell, [
      cells,
      cells,
      cells,
    ]);
  }, [analysis, packed, cells]);
  const scene = useMemo(
    (): ViewerScene => ({
      atoms,
      cell: unitCell && analysis !== null ? analysis.lattice.cell : null,
      repeat: [cells, cells, cells],
      elements: [],
      labels: false,
      camera,
    }),
    [atoms, analysis, cells, unitCell, camera],
  );

  if (source === null || opened === null) return { kind: 'empty' };
  if (typeof opened === 'string') {
    return { kind: 'unreadable', problem: opened };
  }
  if (analysis === null || packed === null) return { kind: 'empty' };
  return { kind: 'crystal', source, opened, analysis, packed, cells, scene };
}
