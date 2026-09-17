/**
 * The layers drawn over the structure, one chip each.
 *
 * The chips read from the stored preferences, so a student who switches the
 * mirrors off finds them off on the next molecule and after a reload; a shared
 * link pins them with `?flags=`.
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';

import type { DisplayFlagKey } from '../../state/index.ts';
import {
  DISPLAY_FLAGS,
  setDisplayFlag,
  state,
  toggleDisplayFlag,
} from '../../state/index.ts';

/** Props of {@link LayerChips}. */
export interface LayerChipsProps {
  /** The layers this page can draw, in the order the chips show them. */
  readonly keys: readonly DisplayFlagKey[];
  /**
   * What the row is called.
   * @default 'Layers'
   */
  readonly label?: string;
}

/**
 * The chip bar.
 * @param props - See {@link LayerChipsProps}.
 * @returns One chip per layer, and one that switches them all off.
 */
export function LayerChips(props: LayerChipsProps): ReactElement {
  useSignals();
  const { keys, label = 'Layers' } = props;
  const flags = state.preferences.flags;
  let lit = 0;
  for (const key of keys) {
    if (flags[key].value) lit++;
  }

  return (
    <div className="chip-bar">
      <div className="chip-row">
        <div className="chip-row__label">{label}</div>
        <div className="chip-row__chips">
          {keys.map((key) => {
            const meta = DISPLAY_FLAGS.find((entry) => entry.key === key);
            return (
              <button
                type="button"
                className="chip"
                key={key}
                aria-pressed={flags[key].value}
                title={meta?.description}
                onClick={() => {
                  toggleDisplayFlag(key);
                }}
              >
                {meta?.label ?? key}
              </button>
            );
          })}
          <button
            type="button"
            className="chip chip--action"
            disabled={lit === 0}
            onClick={() => {
              for (const key of keys) setDisplayFlag(key, false);
            }}
          >
            All off
          </button>
        </div>
      </div>
    </div>
  );
}
