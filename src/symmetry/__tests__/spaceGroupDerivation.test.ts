import { expect, test } from 'vitest';

import { SPACE_GROUP_SETTINGS } from '../../data/spaceGroups.ts';
import {
  distinctRotations,
  formatOperation,
  pointGroupName,
} from '../core/index.ts';
import {
  centringLetterOf,
  crystalSystemOf,
  hasInversionAtOrigin,
  isCentrosymmetric,
  isSohncke,
  isSymmorphic,
  laueClassOf,
  uniqueAxisOf,
} from '../spaceGroupDerivation.ts';
import { spaceGroupOperations } from '../spaceGroupOperations.ts';

// These sweep all 521 settings; on a loaded machine they run past the 5 s
// default.
const SWEEP_TIMEOUT = 30_000;

test(
  'every stored field is what the operations say it is',
  () => {
    const wrong: string[] = [];
    for (const setting of SPACE_GROUP_SETTINGS) {
      const operations = spaceGroupOperations(setting);
      const rotations = distinctRotations(operations);
      const crystalClass = pointGroupName(rotations, 3);
      const derived = {
        crystalClass,
        laueClass: laueClassOf(rotations),
        crystalSystem: crystalSystemOf(crystalClass),
        centrosymmetric: isCentrosymmetric(rotations),
        sohncke: isSohncke(rotations),
        symmorphic: isSymmorphic(operations),
        multiplicity: operations.length,
      };
      const stored = {
        crystalClass: setting.crystalClass,
        laueClass: setting.laueClass,
        crystalSystem: setting.crystalSystem,
        centrosymmetric: setting.centrosymmetric,
        sohncke: setting.sohncke,
        symmorphic: setting.symmorphic,
        multiplicity: setting.multiplicity,
      };
      if (JSON.stringify(derived) !== JSON.stringify(stored)) {
        wrong.push(`${setting.number}/${setting.variant} ${setting.hmSetting}`);
      }
    }
    expect(wrong).toStrictEqual([]);
  },
  SWEEP_TIMEOUT,
);

test(
  'the unique axis and the origin choice re-derive',
  () => {
    for (const setting of SPACE_GROUP_SETTINGS) {
      const operations = spaceGroupOperations(setting);
      if (setting.crystalSystem === 'monoclinic') {
        expect(uniqueAxisOf(distinctRotations(operations))).toBe(
          setting.uniqueAxis,
        );
      }
      if (setting.originChoice !== null) {
        expect(hasInversionAtOrigin(operations) ? 2 : 1).toBe(
          setting.originChoice,
        );
      }
    }
  },
  SWEEP_TIMEOUT,
);

test(
  'the centring letter derives, and only a rhombohedral R setting differs',
  () => {
    const differ: string[] = [];
    for (const setting of SPACE_GROUP_SETTINGS) {
      const derived = centringLetterOf(spaceGroupOperations(setting));
      if (derived !== setting.centring) {
        differ.push(`${setting.number}/${setting.variant} ${derived}`);
      }
    }
    expect(differ).toStrictEqual([
      '146/1 P',
      '148/1 P',
      '155/1 P',
      '160/1 P',
      '161/1 P',
      '166/1 P',
      '167/1 P',
    ]);
  },
  SWEEP_TIMEOUT,
);

test(
  'all 7244 operations print back byte for byte',
  () => {
    let checked = 0;
    for (const setting of SPACE_GROUP_SETTINGS) {
      const operations = spaceGroupOperations(setting);
      for (let index = 0; index < operations.length; index++) {
        const operation = operations[index];
        if (operation === undefined) continue;
        expect(formatOperation(operation)).toBe(setting.operations[index]);
        checked++;
      }
    }
    expect(checked).toBe(7244);
  },
  SWEEP_TIMEOUT,
);

test('crystalSystemOf refuses a name that is not a crystal class', () => {
  expect(() => crystalSystemOf('7mm')).toThrow('7mm is not a crystal class');
});
