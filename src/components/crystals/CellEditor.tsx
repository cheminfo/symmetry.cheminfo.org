/**
 * The six cell parameters, of which the setting decides how many are typed.
 *
 * A forced parameter is **not an editable field**: it is shown as the value it
 * is derived to be, in a dashed box, with one line saying what forces it. The
 * old site kept every field editable and rewrote what had been typed into it a
 * moment later, which teaches a student that the tool is broken rather than
 * what "tetragonal" means.
 */

import { NumericInput } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import type { CellParameter } from '../../crystal/cellConstraints.ts';
import {
  CELL_PARAMETERS,
  CELL_PARAMETER_LABELS,
  cellConstraint,
  constrainedBy,
  isCellEdge,
} from '../../crystal/cellConstraints.ts';
import type { UnitCell } from '../../symmetry/core/index.ts';
import type { SpaceGroupSetting } from '../../symmetry/spaceGroups.ts';

import './crystals.css';

/** Props of {@link CellEditor}. */
export interface CellEditorProps {
  readonly cell: UnitCell;
  /** The setting in force, which is what decides the form. */
  readonly setting: SpaceGroupSetting;
  /** One free parameter typed. */
  readonly onChange: (key: CellParameter, value: number) => void;
}

/**
 * The cell form.
 * @param props - See {@link CellEditorProps}.
 * @returns Six boxes, of which one to six are fields.
 */
export function CellEditor(props: CellEditorProps): ReactElement {
  const { cell, setting, onChange } = props;
  const constraint = cellConstraint(setting);

  return (
    <div className="xtl-panel">
      <div className="xtl-cell-grid">
        {CELL_PARAMETERS.map((key) => {
          const forced = constrainedBy(constraint, key);
          const name = `${CELL_PARAMETER_LABELS[key]} (${isCellEdge(key) ? 'Å' : '°'})`;
          return (
            <div className="xtl-field" key={key}>
              <span className="xtl-field__label">{name}</span>
              {forced === null ? (
                <NumericInput
                  size="small"
                  fill
                  buttonPosition="none"
                  min={isCellEdge(key) ? 0.1 : 1}
                  max={isCellEdge(key) ? 1000 : 179}
                  stepSize={isCellEdge(key) ? 0.1 : 1}
                  minorStepSize={0.0001}
                  value={round(cell[key])}
                  aria-label={name}
                  onValueChange={(value) => {
                    onChange(key, value);
                  }}
                />
              ) : (
                <span
                  className="xtl-field__derived"
                  title={`Forced by the setting: ${constraint.why}`}
                >
                  {typeof forced === 'number'
                    ? `${forced}°`
                    : `= ${CELL_PARAMETER_LABELS[forced]} = ${round(cell[key])}`}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="xtl-note">{constraint.why}</p>
    </div>
  );
}

/** Four decimals is the precision a published cell is quoted to. */
function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
