import { expect, test } from 'vitest';

import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  DESCRIPTION_TARGET,
  count,
  describe,
  withArticle,
} from '../describe.ts';

const BASE = 'Space group 1, P 1: triclinic, primitive lattice, class 1.';

test('a base already long enough is left exactly as it was written', () => {
  const base = 'x'.repeat(DESCRIPTION_TARGET);
  expect(describe(base, [['never used.']])).toBe(base);
});

test('the longest clause that still fits is the one taken', () => {
  expect(
    describe(BASE, [
      [
        'A clause far too long to fit beside a base of fifty-eight characters, and then some more of it to be sure.',
        'Symmorphic and Sohncke, so one enantiomer can crystallise in it.',
        'Sohncke.',
      ],
    ]),
  ).toBe(
    'Space group 1, P 1: triclinic, primitive lattice, class 1. Symmorphic and Sohncke, so one enantiomer can crystallise in it.',
  );
});

test('at most one clause of a choice is used, however often it is offered', () => {
  const clause =
    'Symmorphic and Sohncke, so one enantiomer can crystallise in it.';
  const text = describe(BASE, [[clause, clause, clause]]);

  expect(text.split(clause)).toHaveLength(2);
  expect(text.length).toBe(123);
});

test('growing stops at the target, so a later choice is left off', () => {
  const text = describe(BASE, [
    [
      'Centrosymmetric, with a glide plane or a screw axis that no origin removes.',
    ],
    ['Laue class -1.'],
  ]);
  expect(text).not.toContain('Laue class');
  expect(text.length).toBe(134);
});

test('an empty choice contributes nothing and the next one is tried', () => {
  expect(
    describe(BASE, [
      [],
      ['Six settings of it are tabulated, on other axes or origins.'],
    ]),
  ).toBe(
    'Space group 1, P 1: triclinic, primitive lattice, class 1. Six settings of it are tabulated, on other axes or origins.',
  );
});

test('a description that cannot reach the floor is refused where it is written', () => {
  expect(() => describe('Too short.')).toThrow(
    /a page description is 110 to 160 characters; this one is 10: Too short\./,
  );
});

test('a base already past the ceiling is refused rather than truncated', () => {
  expect(() => describe('y'.repeat(DESCRIPTION_MAX + 1))).toThrow(
    /this one is 161/,
  );
});

test('the window is the one a search result shows whole', () => {
  expect([DESCRIPTION_MIN, DESCRIPTION_TARGET, DESCRIPTION_MAX]).toStrictEqual([
    110, 132, 160,
  ]);
});

test('a count reads as a sentence at one and at many', () => {
  expect(count(1, 'general position')).toBe('1 general position');
  expect(count(192, 'general position')).toBe('192 general positions');
  expect(count(1, 'class', 'classes')).toBe('1 class');
  expect(count(12, 'class', 'classes')).toBe('12 classes');
});

test('the article follows the word, not the lattice it names', () => {
  expect(withArticle('oblique lattice')).toBe('an oblique lattice');
  expect(withArticle('square lattice')).toBe('a square lattice');
  expect(withArticle('centred-rectangular lattice')).toBe(
    'a centred-rectangular lattice',
  );
});
