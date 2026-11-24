/**
 * The lattice generator's settings: the cell, the motif, the size of the
 * crystal and the noise over it. Changing any of them turns the example on
 * screen into a crystal of the student's own, which the address then names.
 */

import { HTMLSelect } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { NumberInput } from 'react-cheminfo/ui';

import type { LatticeSettings } from '../../reciprocal/lattice.ts';
import {
  BASIS_LABELS,
  LATTICE_BASES,
  LATTICE_RANGES,
} from '../../reciprocal/lattice.ts';
import { changeLattice } from '../../state/index.ts';

/** The numeric settings, in the order the row shows them. */
const NUMBER_FIELDS = [
  { key: 'a', label: 'a', unit: 'px', step: 1 },
  { key: 'b', label: 'b', unit: 'px', step: 1 },
  { key: 'gamma', label: 'γ', unit: '°', step: 5 },
  { key: 'crystal', label: 'Crystal', unit: '%', step: 5 },
  { key: 'noise', label: 'Noise', unit: '%', step: 10 },
] as const;

/**
 * The settings row.
 * @param props - The crystal on screen.
 * @param props.lattice - Its settings.
 * @returns One labelled box per setting, and the motif.
 */
export function LatticeFields(props: {
  readonly lattice: LatticeSettings;
}): ReactElement {
  const { lattice } = props;
  return (
    <div className="reciprocal-lattice" data-testid="reciprocal-lattice">
      {NUMBER_FIELDS.map((field) => (
        <label key={field.key} className="reciprocal-tools__field">
          {field.label}
          <NumberInput
            size="small"
            buttons={false}
            min={LATTICE_RANGES[field.key].min}
            max={LATTICE_RANGES[field.key].max}
            step={field.step}
            integer={field.key === 'crystal' || field.key === 'noise'}
            value={lattice[field.key]}
            onChange={(value) => {
              changeLattice({ [field.key]: value });
            }}
            testId={`lattice-${field.key}`}
            style={{ width: '5.5rem' }}
            rightElement={
              <span className="reciprocal-tools__unit">{field.unit}</span>
            }
          />
        </label>
      ))}
      <label className="reciprocal-tools__field">
        Motif
        <HTMLSelect
          value={lattice.basis}
          onChange={(event) => {
            const chosen = event.currentTarget.value;
            const basis = LATTICE_BASES.find(
              (candidate) => candidate === chosen,
            );
            if (basis !== undefined) changeLattice({ basis });
          }}
        >
          {LATTICE_BASES.map((basis) => (
            <option key={basis} value={basis}>
              {BASIS_LABELS[basis]}
            </option>
          ))}
        </HTMLSelect>
      </label>
    </div>
  );
}
