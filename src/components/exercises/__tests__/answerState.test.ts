import { expect, test } from 'vitest';

import { EXERCISES, exerciseById } from '../../../data/exercises/index.ts';
import type { Exercise } from '../../../data/exercises/types.ts';
import { answerShapeOf, validateExercise } from '../../../symmetry/validate.ts';
import {
  answerIsBlank,
  blankAnswer,
  clearAllDrafts,
  clearDraft,
  readDraft,
  writeDraft,
} from '../answerState.ts';

/** The question with this id. @throws When nobody minted it. */
function question(id: string): Exercise {
  const found = exerciseById(id);
  if (found === undefined) throw new Error(`no exercise ${id}`);
  return found;
}

test('every question starts from an answer its own validator accepts', () => {
  expect(EXERCISES).toHaveLength(29);
  for (const exercise of EXERCISES) {
    const blank = blankAnswer(exercise);
    expect(blank.shape).toBe(answerShapeOf(exercise));
    // Marking a blank answer must report, never throw: the page grades on
    // every keystroke, so the very first render already runs this.
    expect(validateExercise(exercise, blank).passed).toBe(false);
  }
});

test('a typed question starts empty and a multiply one starts one row per product', () => {
  expect(blankAnswer(question('point-group-water'))).toStrictEqual({
    shape: 'text',
    value: '',
  });
  expect(blankAnswer(question('ops-of-water'))).toStrictEqual({
    shape: 'set',
    value: [],
  });
  expect(blankAnswer(question('multiply-c2v'))).toStrictEqual({
    shape: 'set',
    value: ['', '', ''],
  });
  expect(blankAnswer(question('order-of-ammonia'))).toStrictEqual({
    shape: 'fields',
    value: {},
  });
  expect(blankAnswer(question('place-rock-salt'))).toStrictEqual({
    shape: 'atoms',
    value: [{ element: 'Cl', x: 0, y: 0, z: 0 }],
  });
});

test('nothing written is not a wrong answer', () => {
  for (const exercise of EXERCISES) {
    expect(answerIsBlank(blankAnswer(exercise))).toBe(true);
  }
  expect(answerIsBlank({ shape: 'text', value: ' '.repeat(3) })).toBe(true);
  expect(answerIsBlank({ shape: 'text', value: 'C2v' })).toBe(false);
  expect(answerIsBlank({ shape: 'set', value: ['', 'C2'] })).toBe(false);
  expect(answerIsBlank({ shape: 'fields', value: { order: '' } })).toBe(true);
  expect(answerIsBlank({ shape: 'fields', value: { order: '6' } })).toBe(false);
  expect(
    answerIsBlank({
      shape: 'atoms',
      value: [{ element: 'Cl', x: 0.5, y: 0, z: 0 }],
    }),
  ).toBe(false);
});

test('a draft survives leaving the question and coming back', () => {
  const exercise = question('point-group-water');
  clearAllDrafts();
  expect(readDraft(exercise)).toStrictEqual({ shape: 'text', value: '' });

  writeDraft(exercise.id, { shape: 'text', value: 'C2h' });

  expect(readDraft(exercise)).toStrictEqual({ shape: 'text', value: 'C2h' });
});

test('Reset forgets one draft, and clearing all forgets every one', () => {
  clearAllDrafts();
  writeDraft('point-group-water', { shape: 'text', value: 'C2h' });
  writeDraft('point-group-methane', { shape: 'text', value: 'Oh' });

  clearDraft('point-group-water');

  expect(readDraft(question('point-group-water'))).toStrictEqual({
    shape: 'text',
    value: '',
  });
  expect(readDraft(question('point-group-methane'))).toStrictEqual({
    shape: 'text',
    value: 'Oh',
  });

  clearAllDrafts();

  expect(readDraft(question('point-group-methane'))).toStrictEqual({
    shape: 'text',
    value: '',
  });
});
