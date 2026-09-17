/**
 * The layers a question is read with, and what the marking says when one is off.
 *
 * The three questions that name a layer are marked through the real validator,
 * so a layer switched off has to come back on its own rather than as failing
 * checks — the whole point of reporting it apart from the answer.
 */

import { expect, test } from 'vitest';

import { exerciseById } from '../../../data/exercises/index.ts';
import type { Exercise } from '../../../data/exercises/types.ts';
import type { ExerciseAnswer } from '../../validate.ts';
import { validateExercise } from '../../validate.ts';
import { displayLabels, missingDisplay } from '../display.ts';

/** The question with this id. @throws When nobody minted it. */
function question(id: string): Exercise {
  const found = exerciseById(id);
  if (found === undefined) throw new Error(`no exercise ${id}`);
  return found;
}

/** Benzene's three counts, right. */
const BENZENE: ExerciseAnswer = {
  shape: 'fields',
  value: { order: '24', mirrorPlanes: '7', properAxes: '7' },
};

test('the three questions that name a layer are the ones read off the picture', () => {
  expect(question('ops-of-water').requiredDisplay).toStrictEqual([
    'mirrors',
    'axes',
  ]);
  expect(question('benzene-elements').requiredDisplay).toStrictEqual([
    'axes',
    'mirrors',
  ]);
  expect(question('point-group-allene').requiredDisplay).toStrictEqual([
    'improper',
  ]);
});

test('a layer the question needs and the page is not drawing is what comes back', () => {
  const exercise: Exercise = {
    ...question('benzene-elements'),
    requiredDisplay: ['axes'],
  };

  expect(missingDisplay(exercise, ['mirrors', 'labels'])).toStrictEqual([
    'axes',
  ]);
  expect(missingDisplay(exercise, ['axes', 'mirrors'])).toStrictEqual([]);
  expect(missingDisplay(exercise, [])).toStrictEqual(['axes']);
  // Nothing on screen to switch, so nothing is required: this is how the
  // content tests mark the chemistry alone.
  expect(missingDisplay(exercise, undefined)).toStrictEqual([]);
  // A question nobody wrote a layer for is never blocked.
  expect(missingDisplay(question('point-group-water'), [])).toStrictEqual([]);
});

test('a right answer with the layer off is not marked, and is not called wrong', () => {
  const exercise: Exercise = {
    ...question('benzene-elements'),
    requiredDisplay: ['axes'],
  };
  const result = validateExercise(exercise, BENZENE, ['mirrors', 'labels']);

  expect(result.missingOptions).toStrictEqual(['Axes']);
  // No case was run, so there is no cross against an answer that is right.
  expect(result.cases).toStrictEqual([]);
  expect(result.error).toBeNull();
  expect(result.passed).toBe(false);
});

test('the same answer with the layer on runs every check and solves it', () => {
  const exercise: Exercise = {
    ...question('benzene-elements'),
    requiredDisplay: ['axes'],
  };
  const result = validateExercise(exercise, BENZENE, ['axes']);

  expect(result.missingOptions).toStrictEqual([]);
  expect(result.cases.map((one) => one.reason)).toStrictEqual([
    'order: 24',
    'mirrorPlanes: 7',
    'properAxes: 7',
  ]);
  expect(result.passed).toBe(true);
});

test('both of a question’s layers are named when both are off', () => {
  const water = question('ops-of-water');
  const answer: ExerciseAnswer = {
    shape: 'set',
    value: ['E', 'C2', 'σv(xz)', 'σv′(yz)'],
  };
  const off = validateExercise(water, answer, ['labels']);
  const on = validateExercise(water, answer, ['mirrors', 'axes']);

  expect(off.missingOptions).toStrictEqual(['Mirrors', 'Axes']);
  expect(off.cases).toStrictEqual([]);
  expect(on.missingOptions).toStrictEqual([]);
  expect(on.cases).toHaveLength(6);
  expect(on.passed).toBe(true);
});

test('allene is not marked until the improper axis it is about is drawn', () => {
  const allene = question('point-group-allene');
  const answer: ExerciseAnswer = { shape: 'text', value: 'D2d' };
  // `improper` opens off, so this is what a student meets on this question.
  const off = validateExercise(allene, answer, ['axes', 'mirrors', 'labels']);

  expect(off.missingOptions).toStrictEqual(['Improper axes']);
  expect(off.passed).toBe(false);
  expect(validateExercise(allene, answer, ['improper']).passed).toBe(true);
});

test('a layer is named the way its own chip names it', () => {
  expect(displayLabels(['axes', 'mirrors', 'improper'])).toStrictEqual([
    'Axes',
    'Mirrors',
    'Improper axes',
  ]);
  expect(displayLabels([])).toStrictEqual([]);
});

test('an answer in the wrong shape is still the first thing said', () => {
  const allene = question('point-group-allene');
  const result = validateExercise(allene, { shape: 'set', value: [] }, []);

  expect(result.error).toBe(
    'point-group-allene is answered as text, not as set.',
  );
  expect(result.missingOptions).toStrictEqual([]);
});
