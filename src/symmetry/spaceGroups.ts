import type { SpaceGroupSetting } from 'react-cheminfo/crystal';
import {
  SPACE_GROUP_SETTINGS,
  SPACE_GROUP_SETTINGS_BY_NUMBER,
} from 'react-cheminfo/crystal';

export type {
  Centring,
  CrystalSystem,
  SpaceGroupSetting,
} from 'react-cheminfo/crystal';
export {
  SPACE_GROUP_SETTINGS,
  normalizeSpaceGroupSymbol,
  resolveSpaceGroup,
  resolveSpaceGroups,
  spaceGroup,
  spaceGroupOperations,
} from 'react-cheminfo/crystal';
export type { ReflectionCondition } from './spaceGroupAbsences.ts';
export {
  absentReflections,
  isSystematicallyAbsent,
} from './spaceGroupAbsences.ts';

/** How many space groups there are in three dimensions, and have been since 1891. */
export const SPACE_GROUP_COUNT = 230;

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
