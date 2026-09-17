import type { SpaceGroupSetting } from '../data/spaceGroups.ts';

import type { CrystalOperation } from './core/index.ts';
import { parseOperation } from './core/index.ts';

const cache = new WeakMap<
  SpaceGroupSetting,
  ReadonlyArray<CrystalOperation<3>>
>();

/**
 * The exact operations of one setting: its coset list with the centring
 * expanded, parsed from the canonical triplets the data module carries.
 *
 * Parsing all 7244 operations of the 521 settings takes long enough to be worth
 * not doing on a page that shows one group, so a setting is parsed the first
 * time it is asked for and the result is kept for as long as the setting is.
 */
export function spaceGroupOperations(
  setting: SpaceGroupSetting,
): ReadonlyArray<CrystalOperation<3>> {
  const known = cache.get(setting);
  if (known !== undefined) return known;
  const operations: Array<CrystalOperation<3>> = [];
  for (const triplet of setting.operations) {
    operations.push(parseOperation(triplet, 3));
  }
  cache.set(setting, operations);
  return operations;
}
