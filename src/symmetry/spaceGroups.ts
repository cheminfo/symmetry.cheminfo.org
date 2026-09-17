import type { SpaceGroupSetting } from '../data/spaceGroups.ts';
import {
  SPACE_GROUP_SETTINGS,
  SPACE_GROUP_SETTINGS_BY_NUMBER,
} from '../data/spaceGroups.ts';

export type {
  Centring,
  CrystalSystem,
  SpaceGroupSetting,
} from '../data/spaceGroups.ts';
export { SPACE_GROUP_SETTINGS } from '../data/spaceGroups.ts';
export type { ReflectionCondition } from './spaceGroupAbsences.ts';
export {
  absentReflections,
  isSystematicallyAbsent,
} from './spaceGroupAbsences.ts';
export { spaceGroupOperations } from './spaceGroupOperations.ts';
export {
  normalizeSpaceGroupSymbol,
  resolveSpaceGroup,
  resolveSpaceGroups,
} from './spaceGroupSymbols.ts';

/** How many space groups there are in three dimensions, and have been since 1891. */
export const SPACE_GROUP_COUNT = 230;

/**
 * One setting of one space group.
 *
 * ```
 * spaceGroup(14)      // P 1 21/c 1, the setting the site opens by default
 * spaceGroup(227, 1)  // F d -3 m on origin choice 1
 * ```
 *
 * @param number - The International Tables number, 1 to 230.
 * @param variant - Which setting of it; 0, the default, is what the site shows.
 * @throws When the number is not one of the 230, or the setting does not exist.
 */
export function spaceGroup(number: number, variant = 0): SpaceGroupSetting {
  const settings = spaceGroupSettings(number);
  const setting = settings[variant];
  if (setting === undefined) {
    throw new RangeError(
      `space group ${number} has ${settings.length} settings, so there is no ${variant}`,
    );
  }
  return setting;
}

/**
 * Every setting of one space group, variant 0 first — nine ways of writing
 * `P 21/c`, two ways of writing `F d -3 m`, one way of writing `P 1`.
 *
 * @throws When the number is not one of the 230.
 */
export function spaceGroupSettings(
  number: number,
): readonly SpaceGroupSetting[] {
  const settings = SPACE_GROUP_SETTINGS_BY_NUMBER.get(number);
  if (settings === undefined) {
    throw new RangeError(`${number} is not a space group number`);
  }
  return settings;
}

/**
 * How a setting is named in an address and in a stored preference:
 * `number/variant`, never a Hermann–Mauguin string. A page is addressed by the
 * number alone and carries the variant in its query, so 230 addresses are
 * indexed rather than 521.
 */
export function spaceGroupSettingId(setting: SpaceGroupSetting): string {
  return `${setting.number}/${setting.variant}`;
}

/** The setting an id from {@link spaceGroupSettingId} names, or `null`. */
export function spaceGroupBySettingId(id: string): SpaceGroupSetting | null {
  const parts = /^(?<number>\d+)\/(?<variant>\d+)$/.exec(id.trim());
  if (parts === null) return null;
  const number = Number(parts.groups?.number);
  const variant = Number(parts.groups?.variant);
  return SPACE_GROUP_SETTINGS_BY_NUMBER.get(number)?.[variant] ?? null;
}

/** Every setting whose predicate holds, in number then variant order. */
export function spaceGroupsWhere(
  matches: (setting: SpaceGroupSetting) => boolean,
): readonly SpaceGroupSetting[] {
  return SPACE_GROUP_SETTINGS.filter((setting) => matches(setting));
}
