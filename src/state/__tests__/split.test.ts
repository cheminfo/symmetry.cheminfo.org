import { MAX_SPLIT, MIN_SPLIT, clampSplit } from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import { state } from '../index.ts';
import { DEFAULT_TUTORIAL_SPLIT, TUTORIAL_STACK_BELOW } from '../split.ts';
import { setTutorialSplit } from '../view.ts';

/*
 * The share itself — its name, its range and its clamping — is the family's and
 * is tested there. What is this site's own is the share the tutorial opens at,
 * and that it sits where a splitter can actually be dragged to: a default
 * outside the range is silently clamped, and the page then opens at a share
 * nobody chose.
 */

test('the tutorial opens at a share a splitter could be dragged to', () => {
  expect(DEFAULT_TUTORIAL_SPLIT).toBeGreaterThanOrEqual(MIN_SPLIT);
  expect(DEFAULT_TUTORIAL_SPLIT).toBeLessThanOrEqual(MAX_SPLIT);
  expect(clampSplit(DEFAULT_TUTORIAL_SPLIT)).toBe(DEFAULT_TUTORIAL_SPLIT);
});

test('the prose and the view start level, the view a shade wider', () => {
  expect(DEFAULT_TUTORIAL_SPLIT).toBe(48);
  expect(TUTORIAL_STACK_BELOW).toBe(900);
});

test('a share the state is given is kept inside the range', () => {
  setTutorialSplit(70);
  expect(state.view.tutorial.split.value).toBe(70);

  setTutorialSplit(995);
  expect(state.view.tutorial.split.value).toBe(MAX_SPLIT);

  setTutorialSplit(-3);
  expect(state.view.tutorial.split.value).toBe(MIN_SPLIT);

  setTutorialSplit(null);
  expect(state.view.tutorial.split.value).toBeNull();
});
