import { expect, test } from 'vitest';

import { formatOperation } from '../core/index.ts';
import {
  SPACE_GROUP_COUNT,
  spaceGroup,
  spaceGroupBySettingId,
  spaceGroupOperations,
  spaceGroupSettingId,
  spaceGroupSettings,
  spaceGroupsWhere,
} from '../spaceGroups.ts';

test('a space group is reached by its number, a setting by its variant', () => {
  expect(SPACE_GROUP_COUNT).toBe(230);
  expect(spaceGroup(14).hmSetting).toBe('P 1 21/c 1');
  expect(spaceGroup(14, 3).hmSetting).toBe('P 1 1 21/a');
  expect(spaceGroup(227).originChoice).toBe(2);
  expect(spaceGroup(227, 1).originChoice).toBe(1);
  expect(spaceGroupSettings(15)).toHaveLength(18);
  expect(spaceGroupSettings(1)).toHaveLength(1);
});

test('an impossible number or setting throws rather than returning nothing', () => {
  expect(() => spaceGroup(231)).toThrow('231 is not a space group number');
  expect(() => spaceGroup(0)).toThrow('0 is not a space group number');
  expect(() => spaceGroup(1, 4)).toThrow(
    'space group 1 has 1 settings, so there is no 4',
  );
});

test('a setting id is number/variant and survives a round trip', () => {
  expect(spaceGroupSettingId(spaceGroup(227, 1))).toBe('227/1');
  expect(spaceGroupSettingId(spaceGroup(1))).toBe('1/0');
  expect(spaceGroupBySettingId('227/1')).toBe(spaceGroup(227, 1));
  expect(spaceGroupBySettingId(' 14/8 ')).toBe(spaceGroup(14, 8));
  expect(spaceGroupBySettingId('227')).toBeNull();
  expect(spaceGroupBySettingId('Fd-3m')).toBeNull();
  expect(spaceGroupBySettingId('227/7')).toBeNull();
});

test('the operations parse to the exact matrices and print back', () => {
  const setting = spaceGroup(14);
  const operations = spaceGroupOperations(setting);
  expect(operations).toHaveLength(4);
  expect(operations[1]).toStrictEqual({
    dimension: 3,
    rotation: [
      [-1, 0, 0],
      [0, 1, 0],
      [0, 0, -1],
    ],
    translation: [0, 6, 6],
  });
  expect(
    operations.map((operation) => formatOperation(operation)),
  ).toStrictEqual(setting.operations);
  // The same setting is parsed once and kept.
  expect(spaceGroupOperations(setting)).toBe(operations);
});

test('F m -3 m carries 192 operations and P 1 carries one', () => {
  expect(spaceGroupOperations(spaceGroup(225))).toHaveLength(192);
  expect(spaceGroup(225).multiplicity).toBe(192);
  expect(spaceGroupOperations(spaceGroup(229))).toHaveLength(96);
  expect(spaceGroupOperations(spaceGroup(1))).toHaveLength(1);
  expect(spaceGroupOperations(spaceGroup(167))).toHaveLength(36);
  expect(spaceGroupOperations(spaceGroup(167, 1))).toHaveLength(12);
});

test('a predicate finds the settings a chemist asks for', () => {
  const sohncke = spaceGroupsWhere((setting) => setting.sohncke);
  expect(new Set(sohncke.map((setting) => setting.number)).size).toBe(65);
  const chiralCubic = spaceGroupsWhere(
    (setting) => setting.sohncke && setting.crystalSystem === 'cubic',
  );
  expect(new Set(chiralCubic.map((setting) => setting.number))).toStrictEqual(
    new Set([195, 196, 197, 198, 199, 207, 208, 209, 210, 211, 212, 213, 214]),
  );
});
