/**
 * The `flags` parameter: which layers a link draws, `?flags=axes,mirrors`.
 *
 * Without it a shared workbench would open with whatever layers the receiver's
 * own browser has stored, so the figure a teacher composed — the three mirrors
 * of ammonia alone, say — would not be the figure the class sees. A link that
 * names no layers leaves the stored ones alone, and the site's own defaults are
 * never written, so a plain visit keeps a plain address.
 */

import { keySetParam } from 'react-cheminfo/core';

import type { DisplayFlagKey } from '../state/displayFlags.ts';
import { DISPLAY_FLAGS, DISPLAY_FLAG_KEYS } from '../state/displayFlags.ts';

/** Query parameter listing the layers that are on. */
export const FLAGS_PARAM = 'flags';

/** The layers a visitor who has changed nothing sees, in the chip-bar order. */
export const DEFAULT_LAYERS: readonly DisplayFlagKey[] = DISPLAY_FLAGS.filter(
  (meta) => meta.initial,
).map((meta) => meta.key);

/**
 * Reads and writes the layers, in the order the chip bar shows them; every
 * layer off is written `none`, and a set equal to {@link DEFAULT_LAYERS} is not
 * written at all.
 */
export const FLAGS = keySetParam(DISPLAY_FLAG_KEYS, {
  omitted: DEFAULT_LAYERS,
});
