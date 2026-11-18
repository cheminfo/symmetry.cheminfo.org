/**
 * How the viewer draws the crystal: whole molecules or the atoms the cell cuts,
 * how many cells, and whether the box of the cell is drawn.
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';

import type { ViewerPacking } from '../../state/index.ts';
import {
  SUPERCELL_RANGE,
  VIEWER_PACKINGS,
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
  const packing = state.view.viewer.packing.value;
  const supercell = state.view.viewer.supercell.value;
  const unitCell = state.preferences.flags.unitCell.value;

  return (
    <div className="chip-bar no-print">
      <div className="chip-row">
        <div className="chip-row__label">Draw</div>
        <div className="chip-row__chips">
          {VIEWER_PACKINGS.map((value) => (
            <button
              key={value}
              type="button"
              className="chip"
              aria-pressed={packing === value}
              title={PACKING_HELP[value]}
              onClick={() => {
                setViewerPacking(value);
              }}
            >
              {PACKING_LABELS[value]}
            </button>
          ))}
          <button
            type="button"
            className="chip"
            aria-pressed={unitCell}
            title="The box of the unit cell."
            onClick={() => {
              toggleDisplayFlag('unitCell');
            }}
          >
            Unit cell
          </button>
        </div>
      </div>
      <div className="chip-row">
        <div className="chip-row__label">Cells</div>
        <div className="chip-row__chips">
          {SUPERCELL_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              className="chip"
              aria-pressed={supercell === count}
              onClick={() => {
                setViewerSupercell(count);
              }}
            >
              {`${count}×${count}×${count}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const PACKING_LABELS: Record<ViewerPacking, string> = {
  molecules: 'Whole molecules',
  cell: 'Atoms in the cell',
};

const PACKING_HELP: Record<ViewerPacking, string> = {
  molecules: 'Each molecule whole, in the cell its centre falls in.',
  cell: 'Every atom inside the cell, cut where its walls cut it.',
};

/** One to four cells along each axis, which is what a shared link may ask for. */
const SUPERCELL_COUNTS: readonly number[] = Array.from(
  { length: SUPERCELL_RANGE.maximum - SUPERCELL_RANGE.minimum + 1 },
  (_, index) => SUPERCELL_RANGE.minimum + index,
);
