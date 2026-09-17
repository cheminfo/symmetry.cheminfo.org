import { expect, test } from 'vitest';

import {
  formatFraction,
  formatOperation,
  formatTranslation,
} from '../formatOperation.ts';
import { operationKey } from '../operation.ts';
import { parseOperation } from '../parseOperation.ts';

import { RAW_SETTINGS } from './fixture.ts';

test('the fixture is the whole table: 521 settings, 230 numbers, 7244 operations', () => {
  let operations = 0;
  const numbers = new Set<number>();
  for (const setting of RAW_SETTINGS) {
    numbers.add(setting.spaceGroup);
    operations += setting.equivalentArray.length;
  }
  expect(RAW_SETTINGS).toHaveLength(521);
  expect(numbers.size).toBe(230);
  expect(operations).toBe(7244);
});

test('every one of the 7244 operations prints back byte for byte, and re-parses to itself', () => {
  let checked = 0;
  for (const setting of RAW_SETTINGS) {
    for (const xyz of setting.equivalentArray) {
      const operation = parseOperation(xyz, 3);
      const printed = formatOperation(operation);
      expect(printed).toBe(xyz.trim());
      expect(operationKey(parseOperation(printed, 3))).toBe(
        operationKey(operation),
      );
      checked += 1;
    }
  }
  expect(checked).toBe(7244);
});

test('the table uses exactly 46 distinct components and 882 distinct triplets', () => {
  const components = new Set<string>();
  const triplets = new Set<string>();
  for (const setting of RAW_SETTINGS) {
    for (const xyz of setting.equivalentArray) {
      triplets.add(xyz.trim());
      for (const component of xyz.trim().split(',')) components.add(component);
    }
  }
  expect(components.size).toBe(46);
  expect(triplets.size).toBe(882);
});

test('a translation prints as a reduced fraction, positive, modulo the cell', () => {
  expect(formatFraction(0)).toBe('');
  expect(formatFraction(6)).toBe('1/2');
  expect(formatFraction(4)).toBe('1/3');
  expect(formatFraction(9)).toBe('3/4');
  expect(formatFraction(10)).toBe('5/6');
  expect(formatFraction(16)).toBe('1/3');
  expect(formatFraction(-6)).toBe('1/2');
  expect(formatTranslation([6, 6, 0])).toBe('1/2,1/2,0');
});

test('a component with no variable prints as its translation, or as zero', () => {
  expect(
    formatOperation({
      dimension: 3,
      rotation: [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      translation: [6, 0, 0],
    }),
  ).toBe('1/2,y,z');
  expect(
    formatOperation({
      dimension: 3,
      rotation: [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      translation: [0, 0, 0],
    }),
  ).toBe('0,y,z');
});
