import { expect, test } from 'vitest';

import { SPACE_GROUP_SETTINGS } from '../../data/spaceGroups.ts';
import { coefficientsIn } from '../reflectionClasses.ts';
import type { ReflectionCondition } from '../spaceGroupAbsences.ts';
import {
  absentReflections,
  isSystematicallyAbsent,
} from '../spaceGroupAbsences.ts';
import { spaceGroup } from '../spaceGroups.ts';

function rules(number: number, variant = 0): string[] {
  return absentReflections(spaceGroup(number, variant)).map(
    (condition) => `${condition.reflections}: ${condition.condition}`,
  );
}

test('P 21/c has the two conditions the International Tables print', () => {
  expect(rules(14)).toStrictEqual(['h0l: l = 2n', '0k0: k = 2n']);
  expect(
    absentReflections(spaceGroup(14)).map((condition) => condition.cause),
  ).toStrictEqual(['c ⊥ (010)', '2_1 ∥ [010]']);
});

test('the orthorhombic screws and glides come out exactly', () => {
  expect(rules(19)).toStrictEqual([
    '00l: l = 2n',
    '0k0: k = 2n',
    'h00: h = 2n',
  ]);
  expect(rules(62)).toStrictEqual([
    '0kl: k + l = 2n',
    'hk0: h = 2n',
    '00l: l = 2n',
    '0k0: k = 2n',
    'h00: h = 2n',
  ]);
  expect(rules(61)).toStrictEqual([
    '0kl: k = 2n',
    'h0l: l = 2n',
    'hk0: h = 2n',
    '00l: l = 2n',
    '0k0: k = 2n',
    'h00: h = 2n',
  ]);
  expect(rules(33)).toStrictEqual([
    '0kl: k + l = 2n',
    'h0l: h = 2n',
    '00l: l = 2n',
  ]);
});

test('F centring alone accounts for every absence of F m -3 m', () => {
  expect(rules(225)).toStrictEqual([
    'hkl: h + k = 2n',
    'hkl: h + l = 2n',
    'hkl: k + l = 2n',
  ]);
});

test('F d -3 m adds the d glides and the 4-fold screws', () => {
  expect(rules(227)).toStrictEqual([
    'hkl: h + k = 2n',
    'hkl: h + l = 2n',
    'hkl: k + l = 2n',
    '0kl: k + l = 4n',
    'h0l: h + l = 4n',
    'hk0: h + k = 4n',
    '00l: l = 4n',
    '0k0: k = 4n',
    'h00: h = 4n',
  ]);
});

test('a 4₁ screw asks for l = 4n, and R -3 c for a three-fold centring', () => {
  expect(rules(92)).toStrictEqual([
    '00l: l = 4n',
    '0k0: k = 2n',
    'h00: h = 2n',
  ]);
  expect(rules(167)).toStrictEqual([
    'hkl: h - k - l = 3n',
    '0kl: l = 2n',
    'h0l: l = 2n',
    'h-hl: l = 2n',
  ]);
  // The rhombohedral axes of the same group are primitive, so the centring
  // condition is gone and only the glide survives.
  expect(rules(167, 1)).toStrictEqual([
    'hhl: l = 2n',
    'hkk: h = 2n',
    'hkh: k = 2n',
  ]);
});

test('a reflection inside a zone is absent with it: 0 0 3 in P 21/c', () => {
  const setting = spaceGroup(14);
  expect(isSystematicallyAbsent([0, 0, 3], setting)).toBe(true);
  expect(isSystematicallyAbsent([0, 0, 2], setting)).toBe(false);
  expect(isSystematicallyAbsent([1, 0, 1], setting)).toBe(true);
  expect(isSystematicallyAbsent([1, 0, 2], setting)).toBe(false);
  expect(isSystematicallyAbsent([0, 3, 0], setting)).toBe(true);
  expect(isSystematicallyAbsent([0, 2, 0], setting)).toBe(false);
  expect(isSystematicallyAbsent([1, 1, 1], setting)).toBe(false);
  expect(isSystematicallyAbsent([0, 0, 0], setting)).toBe(false);
});

test('the F lattice extinguishes a mixed-parity reflection', () => {
  const setting = spaceGroup(225);
  expect(isSystematicallyAbsent([1, 0, 0], setting)).toBe(true);
  expect(isSystematicallyAbsent([1, 1, 1], setting)).toBe(false);
  expect(isSystematicallyAbsent([2, 0, 0], setting)).toBe(false);
  expect(isSystematicallyAbsent([2, 1, 0], setting)).toBe(true);
  // Diamond drops 200 as well, which is the classic difference from halite.
  expect(isSystematicallyAbsent([2, 0, 0], spaceGroup(227))).toBe(true);
  expect(isSystematicallyAbsent([2, 2, 0], spaceGroup(227))).toBe(false);
});

test('the listed conditions decide exactly what the operations decide', () => {
  const probe = 4;
  const wrong: string[] = [];
  for (const setting of SPACE_GROUP_SETTINGS) {
    const conditions = absentReflections(setting);
    for (let h = -probe; h <= probe; h++) {
      for (let k = -probe; k <= probe; k++) {
        for (let l = -probe; l <= probe; l++) {
          const listed = failsAny(conditions, [h, k, l]);
          if (listed !== isSystematicallyAbsent([h, k, l], setting)) {
            wrong.push(`${setting.number}/${setting.variant} ${h} ${k} ${l}`);
          }
        }
      }
    }
  }
  expect(wrong).toStrictEqual([]);
});

function failsAny(
  conditions: readonly ReflectionCondition[],
  hkl: readonly number[],
): boolean {
  for (const condition of conditions) {
    const coefficients = coefficientsIn(condition.reflectionClass, hkl);
    if (coefficients === null) continue;
    let sum = 0;
    for (let index = 0; index < coefficients.length; index++) {
      sum += (condition.coefficients[index] ?? 0) * (coefficients[index] ?? 0);
    }
    if (
      ((sum % condition.modulus) + condition.modulus) % condition.modulus !==
      0
    ) {
      return true;
    }
  }
  return false;
}
