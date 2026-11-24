/**
 * Back to real space: the image rebuilt from what is kept of the transform,
 * after whatever is done to its phases.
 */

import { HTMLSelect, SegmentedControl } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { formatInteger } from 'react-cheminfo/core';

import { imagePixels } from '../../reciprocal/display.ts';
import { RECIPROCAL_EXAMPLES } from '../../reciprocal/examples.ts';
import type { PhaseMode } from '../../reciprocal/filter.ts';
import { PHASE_MODES, keptCount } from '../../reciprocal/filter.ts';
import { FIELD_SIZE } from '../../reciprocal/fourier.ts';
import {
  rebuiltImage,
  setPhaseFrom,
  setPhaseMode,
  state,
} from '../../state/index.ts';

import { FieldFigure } from './FieldFigure.tsx';

const PHASE_OPTIONS: Array<{ value: PhaseMode; label: string }> = [
  { value: 'measured', label: 'As measured' },
  { value: 'zero', label: 'No phases' },
  { value: 'unit', label: 'No amplitudes' },
  { value: 'swap', label: 'Phases of…' },
];

/** What each phase choice does, as the caption says it. */
const PHASE_NOTES: Record<PhaseMode, string> = {
  measured: '',
  zero: 'Every phase set to zero: the amplitudes alone give a blur, symmetric about the centre.',
  unit: 'Every amplitude set to one: the phases alone still draw the outlines.',
  swap: 'These amplitudes with another picture’s phases: the result looks like the picture lending the phases.',
};

/**
 * The rebuilt pane.
 * @param props - What the pane shows of its tools.
 * @param props.tools - Whether the phase choices are drawn.
 * @returns The rebuilt image, its tools and a caption.
 */
export function RebuiltPane(props: { readonly tools: boolean }): ReactElement {
  useSignals();
  const image = rebuiltImage.value;
  const view = state.view.reciprocal;
  const phase = view.phase.value;
  const phaseFrom = view.phaseFrom.value;
  const kind = view.mask.value;
  const radius = view.radius.value;
  const spots = view.spots.value;
  const pixels = useMemo(() => imagePixels(image), [image]);
  const kept = useMemo(
    () => keptCount({ kind, radius, spots }),
    [kind, radius, spots],
  );

  return (
    <section className="reciprocal-pane" aria-label="Rebuilt image">
      <header className="reciprocal-pane__head">
        <h2>Rebuilt image</h2>
      </header>
      {props.tools ? (
        <div className="reciprocal-tools no-print">
          <SegmentedControl
            size="small"
            aria-label="What is done to the phases"
            options={PHASE_OPTIONS}
            value={phase}
            onValueChange={(value) => {
              const mode = PHASE_MODES.find((candidate) => candidate === value);
              if (mode !== undefined) setPhaseMode(mode);
            }}
          />
          {phase === 'swap' ? (
            <HTMLSelect
              value={phaseFrom}
              aria-label="The picture lending its phases"
              onChange={(event) => {
                setPhaseFrom(event.currentTarget.value);
              }}
            >
              {RECIPROCAL_EXAMPLES.map((example) => (
                <option key={example.id} value={example.id}>
                  {example.group}: {example.name}
                </option>
              ))}
            </HTMLSelect>
          ) : null}
        </div>
      ) : null}
      <FieldFigure
        pixels={pixels}
        label="The image rebuilt from the part of the transform kept"
        cursor="crosshair"
        testId="reciprocal-rebuilt"
      />
      <p className="reciprocal-pane__caption" data-testid="rebuilt-caption">
        {caption(kind, kept)} {PHASE_NOTES[phase]}
      </p>
    </section>
  );
}

function caption(kind: string, kept: number): string {
  const total = FIELD_SIZE * FIELD_SIZE;
  if (kind === 'all') {
    return 'From every coefficient: the transform loses nothing.';
  }
  return `From ${formatInteger(kept)} of ${formatInteger(total)} coefficients.`;
}
