/**
 * The pictures the workbench comes with, one row per kind, and the way to
 * open a picture of one's own.
 */

import { Button } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useRef } from 'react';

import {
  EXAMPLE_GROUPS,
  RECIPROCAL_EXAMPLES,
} from '../../reciprocal/examples.ts';
import { openReciprocalExample, state } from '../../state/index.ts';

/** What {@link ExamplePicker} needs. */
export interface ExamplePickerProps {
  /** A picture chosen with Open. */
  readonly onFile: (file: File) => void;
}

/**
 * The picker.
 * @param props - See {@link ExamplePickerProps}.
 * @returns A labelled row of chips per kind of picture, and Open.
 */
export function ExamplePicker(props: ExamplePickerProps): ReactElement {
  useSignals();
  const source = state.view.reciprocal.source.value;
  const inputRef = useRef<HTMLInputElement>(null);
  const shown =
    source.kind === 'example'
      ? source.id
      : source.kind === 'lattice'
        ? source.from
        : null;

  return (
    <div className="chip-bar" data-testid="reciprocal-examples">
      {EXAMPLE_GROUPS.map((group) => (
        <div key={group} className="chip-row">
          <span className="chip-row__label">{group}</span>
          <div className="chip-row__chips">
            {RECIPROCAL_EXAMPLES.filter(
              (example) => example.group === group,
            ).map((example) => (
              <button
                key={example.id}
                type="button"
                className="chip"
                aria-pressed={shown === example.id}
                data-example={example.id}
                onClick={() => {
                  openReciprocalExample(example.id);
                }}
              >
                {example.name}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="chip-row">
        <span className="chip-row__label">Yours</span>
        <div className="chip-row__chips">
          <Button
            size="small"
            variant="outlined"
            icon="media"
            text={source.kind === 'photo' ? source.name : 'Open a picture…'}
            active={source.kind === 'photo'}
            onClick={() => inputRef.current?.click()}
          />
          <span className="reciprocal-hint">
            or drop one on the image, or paste it.
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (file !== undefined) props.onFile(file);
            }}
          />
        </div>
      </div>
    </div>
  );
}
