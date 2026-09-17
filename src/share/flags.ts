/**
 * Reading and writing the `flags` parameter: which layers a link draws.
 *
 * Without it a shared workbench would open with whatever layers the receiver's
 * own browser has stored, so the figure a teacher composed — the three mirrors
 * of ammonia alone, say — would not be the figure the class sees.
 */

import type { DisplayFlagKey } from '../state/displayFlags.ts';
import { DISPLAY_FLAGS, isDisplayFlagKey } from '../state/displayFlags.ts';

/** Query parameter listing the layers that are on: `?flags=axes,mirrors`. */
export const FLAGS_PARAM = 'flags';

/**
 * Every layer off, which an empty parameter cannot say because an empty query
 * value is dropped from the address.
 */
export const NO_FLAGS = 'none';

/**
 * Write a `flags` parameter, in the order the chip bar shows the layers.
 * @param flags - State of every layer.
 * @returns The parameter value, {@link NO_FLAGS} when every layer is off.
 */
export function serializeFlags(
  flags: Readonly<Record<DisplayFlagKey, boolean>>,
): string {
  const on: string[] = [];
  for (const meta of DISPLAY_FLAGS) {
    if (flags[meta.key]) on.push(meta.key);
  }
  return on.length > 0 ? on.join(',') : NO_FLAGS;
}

/**
 * Read the layers a link asks for.
 * @param value - Raw parameter, comma separated.
 * @returns The layers to switch on, or `null` when the link says nothing about
 * them and the stored preferences must be left alone.
 */
export function parseFlags(
  value: string | undefined,
): Set<DisplayFlagKey> | null {
  if (value === undefined || value === '') return null;
  const flags = new Set<DisplayFlagKey>();
  if (value === NO_FLAGS) return flags;
  for (const name of value.split(',')) {
    const trimmed = name.trim();
    if (isDisplayFlagKey(trimmed)) flags.add(trimmed);
  }
  return flags;
}

/**
 * The parameter a visitor who has changed nothing would produce.
 *
 * A link that says exactly this says nothing, so it is left out of the address:
 * a plain visit to the tool must not grow a twelve-name query string.
 * @returns The `flags` value of the site's own defaults.
 */
export function defaultFlagsValue(): string {
  const flags: Partial<Record<DisplayFlagKey, boolean>> = {};
  for (const meta of DISPLAY_FLAGS) flags[meta.key] = meta.initial;
  return serializeFlags(flags as Record<DisplayFlagKey, boolean>);
}
