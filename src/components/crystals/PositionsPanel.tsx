/**
 * The two lists the cell is generated from: the general positions, and the
 * symmetry elements they decompose into.
 *
 * The triplets are the group itself — every atom on screen is one of them
 * applied to one line of the atom table — and the elements are the same
 * operations read as geometry, which is what the 3D view draws.
 */

import type { ReactElement } from 'react';

import type { SymmetryElement } from '../../symmetry/core/index.ts';
import {
  elementKey,
  elementPoint,
  formatOperation,
} from '../../symmetry/core/index.ts';

import { elementLabel } from './crystalLabels.ts';
import type { CrystalAnalysis } from './crystalScene.ts';

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
 * @param props - See {@link ElementsPanelProps}.
 * @returns One row per distinct element.
 */
export function ElementsPanel(props: ElementsPanelProps): ReactElement {
  const drawable = props.analysis.elements.filter(
    (element) => element.kind !== 'identity' && element.kind !== 'translation',
  );
  return (
    <div className="xtl-panel">
      <div className="xtl-panel__title">
        Symmetry elements · {drawable.length}
      </div>
      <div className="xtl-rows">
        {drawable.map((element, index) => (
          <div className="xtl-row" key={elementKey(element)}>
            <span className="xtl-row__index">{index + 1}</span>
            <span>{elementLabel(element)}</span>
            <span className="xtl-row__detail xtl-mono">
              through {formatPoint(element)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Where the element sits, as fractional coordinates of the cell. */
function formatPoint(element: SymmetryElement): string {
  return elementPoint(element)
    .map((value) => String(Math.round(value * 1000) / 1000))
    .join(', ');
}
