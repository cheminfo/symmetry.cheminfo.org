/**
 * How the viewer draws the crystal: react-cheminfo's chips, kept in this site's
 * state, so the address and a saved figure carry them.
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { CrystalViewControls } from 'react-cheminfo/crystal3d';

import {
  setViewerBonds,
  setViewerPacking,
  setViewerSupercell,
  state,
  toggleDisplayFlag,
} from '../../state/index.ts';

/**
 * The chips under the view.
 * @returns The chip bar.
 */
export function CifControls(): ReactElement {
  useSignals();
  return (
    <CrystalViewControls
      packing={state.view.viewer.packing.value}
      onPackingChange={setViewerPacking}
      unitCell={state.preferences.flags.unitCell.value}
      onUnitCellChange={() => {
        toggleDisplayFlag('unitCell');
      }}
      bonds={state.view.viewer.bonds.value}
      onBondsChange={setViewerBonds}
      cells={state.view.viewer.supercell.value}
      onCellsChange={setViewerSupercell}
    />
  );
}
