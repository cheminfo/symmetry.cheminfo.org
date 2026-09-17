/**
 * Which setting a file is written in.
 *
 * A CIF names its group up to four ways and they do not always agree, so the
 * order matters: the Hall symbol pins a setting on its own, a Hermann–Mauguin
 * symbol usually does, a number alone never does. The operations in the file
 * are then checked against whatever won, because a file whose symbol and
 * operations disagree is common and the operations are what the structure
 * actually has.
 */

import type { SpaceGroupSetting } from '../data/spaceGroups.ts';
import { SPACE_GROUP_SETTINGS } from '../data/spaceGroups.ts';
import { operationKey, parseOperation } from '../symmetry/core/index.ts';
import { spaceGroupOperations } from '../symmetry/spaceGroupOperations.ts';
import { resolveSpaceGroups } from '../symmetry/spaceGroupSymbols.ts';

import type { CrystalStructure } from './cif/index.ts';

/** What the file says its group is, and whether it says it twice the same way. */
export interface ResolvedSetting {
  /** The setting to build the cell in, or `null` when the file names none. */
  readonly setting: SpaceGroupSetting | null;
  /** Which field decided it. */
  readonly from: 'hall' | 'symbol' | 'number' | 'operations' | null;
  /** Every setting the file's symbol matches, `setting` first. */
  readonly candidates: readonly SpaceGroupSetting[];
  /**
   * The setting the file's own operation list is. Searched only when the symbol
   * decided nothing or disagreed with it, because the search reads every one of
   * the 521 settings.
   */
  readonly fromOperations: SpaceGroupSetting | null;
  /**
   * Whether every operation the file lists belongs to `setting`. `null` when
   * the file lists none, which is the usual case for a published structure.
   */
  readonly agrees: boolean | null;
}

/**
 * Read a structure's space group off the file.
 *
 * @param structure - What `readCif` returned.
 * @returns The setting and how it was decided; `setting` is `null` only when
 *   the file names no group the catalogue recognises.
 */
export function resolveStructureSetting(
  structure: CrystalStructure,
): ResolvedSetting {
  const { hall, hm, number } = structure.spaceGroup;
  const byHall = hall === null ? [] : resolveSpaceGroups(hall);
  const bySymbol =
    hm === null ? [] : withinNumber(resolveSpaceGroups(hm), number);
  const named = byHall.length > 0 ? byHall : bySymbol;
  const from = byHall.length > 0 ? 'hall' : 'symbol';

  if (named.length > 0) {
    const setting = named[0] ?? null;
    const agrees =
      setting === null ? null : operationsBelong(structure.symopsXyz, setting);
    return {
      setting,
      from,
      candidates: named,
      // Only worth the scan when the file contradicts its own symbol.
      fromOperations:
        agrees === false ? settingOfOperations(structure.symopsXyz) : null,
      agrees,
    };
  }

  const fromOperations = settingOfOperations(structure.symopsXyz);
  if (fromOperations !== null) {
    return {
      setting: fromOperations,
      from: 'operations',
      candidates: [fromOperations],
      fromOperations,
      agrees: true,
    };
  }

  const byNumber = number === null ? [] : resolveSpaceGroups(number);
  const setting = byNumber[0] ?? null;
  return {
    setting,
    from: setting === null ? null : 'number',
    candidates: byNumber,
    fromOperations: null,
    agrees:
      setting === null ? null : operationsBelong(structure.symopsXyz, setting),
  };
}

/**
 * Whether every operation the file lists is an operation of the setting.
 *
 * A file often lists one coset of a centred group and leaves the centring to
 * the symbol, so the test is containment rather than equality: a shorter list
 * is not a disagreement, an operation outside the group is.
 *
 * @param symopsXyz - The operation triplets the file carries, verbatim.
 * @param setting - The setting they are checked against.
 * @returns `null` when the file lists no operation; `false` when one of them is
 *   not the setting's, a triplet nothing can parse included.
 */
export function operationsBelong(
  symopsXyz: readonly string[],
  setting: SpaceGroupSetting,
): boolean | null {
  if (symopsXyz.length === 0) return null;
  const keys = operationKeys(setting);
  for (const triplet of symopsXyz) {
    const key = keyOf(triplet);
    if (key === null || !keys.has(key)) return false;
  }
  return true;
}

/**
 * The one setting whose coset list is exactly the file's, or `null`.
 *
 * The last resort — a file with operations and no readable symbol — and what
 * names the group when a file contradicts its own symbol.
 *
 * @param symopsXyz - The operation triplets the file carries.
 */
export function settingOfOperations(
  symopsXyz: readonly string[],
): SpaceGroupSetting | null {
  if (symopsXyz.length === 0) return null;
  const wanted = new Set<string>();
  for (const triplet of symopsXyz) {
    const key = keyOf(triplet);
    if (key === null) return null;
    wanted.add(key);
  }
  for (const setting of SPACE_GROUP_SETTINGS) {
    if (setting.multiplicity !== wanted.size) continue;
    let same = true;
    for (const key of operationKeys(setting)) {
      if (!wanted.has(key)) {
        same = false;
        break;
      }
    }
    if (same) return setting;
  }
  return null;
}

/**
 * A symbol that matches several numbers is cut down by the number the file also
 * gives, so `Fd-3m` plus `227` never drifts onto another group's spelling. A
 * number that agrees with nothing is ignored rather than obeyed.
 */
function withinNumber(
  settings: readonly SpaceGroupSetting[],
  number: number | null,
): readonly SpaceGroupSetting[] {
  if (number === null) return settings;
  const inside = settings.filter((setting) => setting.number === number);
  return inside.length > 0 ? inside : settings;
}

const KEYS = new WeakMap<SpaceGroupSetting, ReadonlySet<string>>();

function operationKeys(setting: SpaceGroupSetting): ReadonlySet<string> {
  const known = KEYS.get(setting);
  if (known !== undefined) return known;
  const keys = new Set<string>();
  for (const operation of spaceGroupOperations(setting)) {
    keys.add(operationKey(operation));
  }
  KEYS.set(setting, keys);
  return keys;
}

function keyOf(triplet: string): string | null {
  try {
    return operationKey(parseOperation(triplet, 3));
  } catch {
    return null;
  }
}
