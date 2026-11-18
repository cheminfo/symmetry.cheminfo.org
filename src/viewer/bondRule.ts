/**
 * The longest bond molstar draws between two elements.
 *
 * Molecules are completed across the cell walls by this rule, so what the
 * viewer draws as one molecule is exactly what the packing kept together. It
 * is one molstar module with no imports of its own, so a page reading it pays
 * for a table of thresholds, not for the 2.8 MB viewer.
 */

import type { ElementSymbol } from 'molstar/lib/mol-model/structure/model/types.js';
import {
  getElementIdx,
  getElementThreshold,
  getPairingThreshold,
  isHydrogen,
} from 'molstar/lib/mol-model/structure/structure/unit/bonds/common.js';

/**
 * The longest distance at which molstar bonds two atoms.
 * @param a - One element symbol, e.g. `C`.
 * @param b - The other.
 * @returns The distance in ångström, or 0 for a pair it never bonds (H–H).
 */
export function bondLimit(a: string, b: string): number {
  const first = getElementIdx(a as ElementSymbol);
  const second = getElementIdx(b as ElementSymbol);
  if (isHydrogen(first) && isHydrogen(second)) return 0;
  return getPairingThreshold(
    first,
    second,
    getElementThreshold(first),
    getElementThreshold(second),
  );
}
