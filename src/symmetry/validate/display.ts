/**
 * The layers a question has to be read with.
 *
 * A few questions are answered off the picture rather than out of the head —
 * count benzene's axes, find the S4 along allene — and the layer that draws
 * them can be switched off. Those layers are reported on their own, never as
 * failing checks: a student looking at half-marked answers has no way of
 * guessing that a chip above the figure is what is wrong.
 */

import type { Exercise } from '../../data/exercises/types.ts';
import type { DisplayFlagKey } from '../../state/displayFlags.ts';
import { DISPLAY_FLAGS } from '../../state/displayFlags.ts';

/**
 * The layers a question needs and the page is not drawing.
 *
 * @param exercise - The question.
 * @param shown - The layers switched on. `undefined` where nothing is on screen
 * to switch — marking done outside the page requires none of them.
 * @returns The missing keys, in the order the question names them.
 */
export function missingDisplay(
  exercise: Exercise,
  shown: readonly DisplayFlagKey[] | undefined,
): DisplayFlagKey[] {
  const required = exercise.requiredDisplay;
  if (required === undefined || shown === undefined) return [];
  const on = new Set<string>(shown);
  const missing: DisplayFlagKey[] = [];
  for (const key of required) {
    if (!on.has(key)) missing.push(key);
  }
  return missing;
}

/**
 * What those layers are called, in the words on their own chips.
 *
 * The student is being told which control to press, so the sentence names the
 * control the way the control names itself — `Improper axes`, never `improper`.
 * @param keys - What {@link missingDisplay} returned.
 * @returns One label per key, in the same order.
 */
export function displayLabels(keys: readonly DisplayFlagKey[]): string[] {
  const labels: string[] = [];
  for (const key of keys) {
    labels.push(LAYER_LABELS.get(key) ?? key);
  }
  return labels;
}

const LAYER_LABELS = new Map<string, string>();
for (const meta of DISPLAY_FLAGS) LAYER_LABELS.set(meta.key, meta.label);
