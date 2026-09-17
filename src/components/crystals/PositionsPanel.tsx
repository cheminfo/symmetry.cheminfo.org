/**
 * The two lists the cell is generated from: the general positions, and the
 * symmetry elements they decompose into.
 *
 * The triplets are the group itself — every atom on screen is one of them
 * applied to one line of the atom table — and the elements are the same
 * operations read as geometry, which is what the 3D view draws.
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';

import { focusCrystalElement, state } from '../../state/index.ts';
import { elementKey, formatOperation } from '../../symmetry/core/index.ts';

import { elementLabel } from './crystalLabels.ts';
import type { CrystalAnalysis } from './crystalScene.ts';
import { drawnElementPoint } from './crystalScene.ts';

import './crystals.css';

/** Props of {@link PositionsPanel}. */
export interface PositionsPanelProps {
  readonly analysis: CrystalAnalysis;
}

/**
 * The coordinate list.
 * @param props - See {@link PositionsPanelProps}.
 * @returns One row per operation of the cell.
 */
export function PositionsPanel(props: PositionsPanelProps): ReactElement {
  const { analysis } = props;
  return (
    <div className="xtl-panel">
      <div className="xtl-panel__title">
        General positions · {analysis.operations.length}
      </div>
      <div className="xtl-rows">
        {analysis.operations.map((operation, index) => {
          const triplet = formatOperation(operation);
          return (
            <div className="xtl-row" key={triplet}>
              <span className="xtl-row__index">{index + 1}</span>
              <span className="xtl-mono">{triplet}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Props of {@link ElementsPanel}. */
export interface ElementsPanelProps {
  readonly analysis: CrystalAnalysis;
}

/**
 * The symmetry elements of the cell, each with the point it passes through.
 *
 * A row is a button: clicking it draws that element **on its own**, whatever
 * the layers are showing, and clicking it again puts the layers back. Forty
 * elements over one cell is a figure nobody reads one element out of, and this
 * is how a student finds out which rod is the 3-fold.
 *
 * @param props - See {@link ElementsPanelProps}.
 * @returns One row per distinct element.
 */
export function ElementsPanel(props: ElementsPanelProps): ReactElement {
  useSignals();
  const focused = state.view.crystals.focusedElement.value;
  const drawable = props.analysis.elements.filter(
    (element) => element.kind !== 'identity' && element.kind !== 'translation',
  );
  return (
    <div className="xtl-panel">
      <div className="xtl-panel__title">
        Symmetry elements · {drawable.length}
      </div>
      <div className="xtl-panel__hint">
        Click one to see it on its own in the cell.
      </div>
      <div className="xtl-rows">
        {drawable.map((element, index) => {
          const key = elementKey(element);
          const isFocused = key === focused;
          return (
            <button
              type="button"
              className={
                isFocused ? 'xtl-row xtl-row--focused' : 'xtl-row xtl-row--pick'
              }
              aria-pressed={isFocused}
              key={key}
              onClick={() => {
                focusCrystalElement(isFocused ? null : key);
              }}
            >
              <span className="xtl-row__index">{index + 1}</span>
              <span>{elementLabel(element)}</span>
              <span className="xtl-row__detail xtl-mono">
                through{' '}
                {formatPoint(drawnElementPoint(props.analysis, element))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A fractional point, to three decimals. */
function formatPoint(point: readonly number[]): string {
  return point
    .map((value) => String(Math.round(value * 1000) / 1000))
    .join(', ');
}
