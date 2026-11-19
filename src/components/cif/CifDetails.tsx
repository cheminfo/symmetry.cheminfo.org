/**
 * What the file says the crystal is: its formula, its space group, its cell
 * and where it came from. Every value a reader would paste elsewhere is copied
 * by a click.
 */

import type { ReactElement, ReactNode } from 'react';
import { ClickToCopy } from 'react-cheminfo/ui';
import { MF } from 'react-mf';

import type { ViewerCrystal } from './useViewerCrystal.ts';

import '../crystals/crystals.css';
import './cif.css';

/** Props of {@link CifDetails}. */
export interface CifDetailsProps {
  readonly crystal: ViewerCrystal;
}

/**
 * The details of the crystal on screen.
 * @param props - See {@link CifDetailsProps}.
 * @returns The panel.
 */
export function CifDetails(props: CifDetailsProps): ReactElement {
  const { opened, analysis, view, source } = props.crystal;
  const { structure, setting } = opened;
  const { cell, volume } = analysis.lattice;
  const formula = structure.formula.replaceAll(/\s+/g, '');
  const { cod, doi, note } = structure.source;
  // A library entry has a title of its own; a file is called what it says.
  const title =
    source.structureId === null ? (note ?? source.name) : source.name;

  return (
    <div className="xtl-panel cif-details" data-testid="cif-details">
      <div className="cif-details__name">{title}</div>
      {formula !== '' && (
        <Row label="Formula">
          <ClickToCopy value={formula} label="formula">
            <MF mf={formula} />
          </ClickToCopy>
        </Row>
      )}
      <Row label="Space group">
        <ClickToCopy value={setting.hmSetting} label="space group">
          {setting.hmSetting}
        </ClickToCopy>{' '}
        <span className="cif-details__aside">
          No. {setting.number}, {setting.crystalSystem}
        </span>
      </Row>
      <div className="xtl-panel__title">Cell</div>
      <div className="cif-details__cell">
        {CELL_PARAMETERS.map(([key, label, unit]) => (
          <span key={key} className="xtl-fact">
            <span className="xtl-fact__label">{label}</span>
            <ClickToCopy
              value={format(cell[key])}
              label={label}
              className="xtl-fact__value"
            >
              {`${format(cell[key])}${unit}`}
            </ClickToCopy>
          </span>
        ))}
        <span className="xtl-fact">
          <span className="xtl-fact__label">V</span>
          <ClickToCopy
            value={volume.toFixed(2)}
            label="cell volume"
            className="xtl-fact__value"
          >
            {`${volume.toFixed(2)} Å³`}
          </ClickToCopy>
        </span>
      </div>
      <div className="xtl-panel__title">One cell holds</div>
      <p className="xtl-note">{contents(analysis.atoms.length, view)}</p>
      {(cod !== undefined || doi !== undefined) && (
        <>
          <div className="xtl-panel__title">Source</div>
          {cod !== undefined && (
            <Row label="COD">
              <ClickToCopy value={cod} label="COD entry">
                {cod}
              </ClickToCopy>
            </Row>
          )}
          {doi !== undefined && (
            <Row label="DOI">
              <ClickToCopy value={doi} label="DOI">
                {doi}
              </ClickToCopy>
            </Row>
          )}
        </>
      )}
    </div>
  );
}

function Row(props: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="cif-details__row">
      <span className="xtl-fact__label">{props.label}</span>
      <span>{props.children}</span>
    </div>
  );
}

/** The six parameters, as a crystallographer names them. */
const CELL_PARAMETERS = [
  ['a', 'a', ' Å'],
  ['b', 'b', ' Å'],
  ['c', 'c', ' Å'],
  ['alpha', 'α', '°'],
  ['beta', 'β', '°'],
  ['gamma', 'γ', '°'],
] as const;

/** What one cell holds, in a sentence. */
function contents(atoms: number, packed: ViewerCrystal['view']): string {
  const counted = `${atoms} ${atoms === 1 ? 'atom' : 'atoms'}`;
  if (packed.molecules === 0) {
    return packed.extended
      ? `${counted}, bonded into one network through the crystal.`
      : `${counted}.`;
  }
  const molecules = `${packed.molecules} ${packed.molecules === 1 ? 'molecule' : 'molecules'}`;
  return packed.extended
    ? `${counted}: ${molecules}, and a network through the crystal.`
    : `${counted}, in ${molecules}.`;
}

/** A cell parameter as a file writes it, without trailing zeros. */
function format(value: number): string {
  return String(Math.round(value * 10_000) / 10_000);
}
