import { expect, test } from 'vitest';

import { EXERCISES, exerciseById } from '../../../data/exercises/index.ts';
import type { Exercise } from '../../../data/exercises/types.ts';
import { moleculeById } from '../../../data/molecules.ts';
import { hasFigure, moleculeOf, spaceGroupOf } from '../figureSubject.ts';

/** The question with this id. @throws When nobody minted it. */
function question(id: string): Exercise {
  const found = exerciseById(id);
  if (found === undefined) throw new Error(`no exercise ${id}`);
  return found;
}

test('a question about a molecule names the molecule, whichever kind it is', () => {
  expect(moleculeOf(question('point-group-water'))).toBe('water');
  expect(moleculeOf(question('ops-of-water'))).toBe('water');
  expect(moleculeOf(question('order-of-ammonia'))).toBe('ammonia');
  expect(moleculeOf(question('facts-p21c'))).toBe(null);
  expect(moleculeOf(question('multiply-c2v'))).toBe(null);
});

test('a question about a cell names its space group by number', () => {
  expect(spaceGroupOf(question('facts-p21c'))).toBe(14);
  expect(spaceGroupOf(question('absences-p21c'))).toBe(14);
  expect(spaceGroupOf(question('place-rock-salt'))).toBe(225);
  expect(spaceGroupOf(question('point-group-water'))).toBe(null);
});

test('every molecule a question names is in the library', () => {
  for (const exercise of EXERCISES) {
    const id = moleculeOf(exercise);
    if (id === null) continue;
    expect(moleculeById(id)).toBeDefined();
  }
});

test('every space group a question names is one of the 230', () => {
  for (const exercise of EXERCISES) {
    const number = spaceGroupOf(exercise);
    if (number === null) continue;
    expect(Number.isInteger(number)).toBe(true);
    expect(number).toBeGreaterThanOrEqual(1);
    expect(number).toBeLessThanOrEqual(230);
  }
});

test('the questions with nothing to show are exactly the ones about a table', () => {
  const withoutFigure = EXERCISES.filter(
    (exercise) => !hasFigure(exercise),
  ).map((exercise) => exercise.id);

  expect(withoutFigure).toStrictEqual([
    'multiply-c2v',
    'multiply-d3d',
    'character-row-c2v-b1',
    'character-row-c3v-a2',
    'reduce-water-stretch',
    'activity-c2h',
    'reduce-ammonia-3n',
    'reduce-water-3n',
  ]);
});

test('a pattern is always looked at, whichever namespace it belongs to', () => {
  expect(hasFigure(question('wallpaper-p4m'))).toBe(true);
  expect(hasFigure(question('frieze-sidle'))).toBe(true);
});
