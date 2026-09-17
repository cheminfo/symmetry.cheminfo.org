/**
 * Which layers are switched on, in the one form the card can compare.
 *
 * The card marks the answer on every keystroke and the figure rebuilds its
 * scene, so both have to know when the layers have genuinely changed. A fresh
 * array never compares equal to the last one and would re-run the detector on
 * every render, so the layers travel as a string and are read back where they
 * are used.
 */

import type { Exercise } from '../../data/exercises/types.ts';
import type { DisplayFlagKey } from '../../state/index.ts';
import {
  DISPLAY_FLAG_KEYS,
  isDisplayFlagKey,
  state,
} from '../../state/index.ts';

/**
 * The layers the student has switched on.
 *
 * Reads the signals, so a component calling it re-renders when a chip is
 * pressed.
 * @returns Their keys, space separated, in {@link DISPLAY_FLAG_KEYS} order.
 */
export function shownLayerKey(): string {
  const flags = state.preferences.flags;
  const on: string[] = [];
  for (const key of DISPLAY_FLAG_KEYS) {
    if (flags[key].value) on.push(key);
  }
  return on.join(' ');
}

/**
 * The keys a layer string carries.
 * @param key - What {@link shownLayerKey} or {@link drawnLayerKey} returned.
 * @returns One key per name in it.
 */
export function layerKeysOf(key: string): DisplayFlagKey[] {
  const keys: DisplayFlagKey[] = [];
  for (const name of key.split(' ')) {
    if (isDisplayFlagKey(name)) keys.push(name);
  }
  return keys;
}

/**
 * The layers a question's figure draws: the ones it names, still switched on.
 *
 * Nothing else is drawn, whatever the student has on elsewhere — a question
 * that asks for a point group must not open with the axes and the mirrors that
 * answer it.
 * @param exercise - The question.
 * @param shownKey - What {@link shownLayerKey} returned.
 * @returns Their keys, space separated, in the order the question names them.
 */
export function drawnLayerKey(exercise: Exercise, shownKey: string): string {
  const required = exercise.requiredDisplay;
  if (required === undefined) return '';
  const on = new Set(shownKey.split(' '));
  const drawn: string[] = [];
  for (const key of required) {
    if (on.has(key)) drawn.push(key);
  }
  return drawn.join(' ');
}
