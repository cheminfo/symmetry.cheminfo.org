/**
 * The gate that keeps the teaching content honest.
 *
 * Twenty-nine exercises carry an authored answer. Every one of them is run
 * through the real validator here, so a number typed wrongly into a data file
 * fails the build instead of a student — which is the whole reason the
 * validators derive their verdicts and never read `answer`.
 */

import { lookupGlossaryTerm, parseGlossaryMarkers } from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import { isDisplayFlagKey } from '../../state/displayFlags.ts';
import {
  groupOperationNames,
  moleculePointGroup,
  validateExercise,
} from '../../symmetry/validate.ts';
import {
  EXERCISES,
  exerciseById,
  exercisesOfLevel,
} from '../exercises/index.ts';
import {
  GLOSSARY,
  objectRefExists,
  objectRefMode,
  splitObjectRef,
} from '../glossary/index.ts';
import { REFERENCE_ROW_COUNT } from '../reference/index.ts';
import {
  TUTORIAL_STEPS,
  tutorialStepById,
  tutorialStepIndex,
  tutorialStepsOfLevel,
} from '../tutorial/index.ts';

import { authoredAnswer, wrongAnswer } from './answers.ts';
import { assertAnswerIsDerived } from './derivedAnswers.ts';
import { authoredProse, sentenceCount } from './prose.ts';

const URL_SAFE = /^[a-z\d]+(?:-[a-z\d]+)*$/;

test('the glossary holds 77 terms, every key lowercase and every example real', () => {
  const keys = Object.keys(GLOSSARY);
  expect(keys).toHaveLength(77);
  for (const key of keys) {
    expect(key).toBe(key.toLowerCase());
    const entry = GLOSSARY[key];
    expect(entry?.examples.length, key).toBeGreaterThanOrEqual(1);
    expect(entry?.examples.length, key).toBeLessThanOrEqual(3);
    expect(entry?.summary.length, key).toBeLessThanOrEqual(400);
    for (const example of entry?.examples ?? []) {
      expect(objectRefExists(example.object), `${key}: ${example.object}`).toBe(
        true,
      );
      expect(example.observation.length, key).toBeLessThanOrEqual(90);
    }
  }
});

test('every [[marker]] in the content resolves to a glossary entry', () => {
  const unresolved: string[] = [];
  for (const [source, text] of authoredProse()) {
    for (const segment of parseGlossaryMarkers(text)) {
      if (segment.kind !== 'term') continue;
      if (lookupGlossaryTerm(GLOSSARY, segment.term) === undefined) {
        unresolved.push(`${source}: [[${segment.term}]]`);
      }
    }
  }
  expect(unresolved).toStrictEqual([]);
});

test('the tutorial is 18 steps in three strips, each opening a real object', () => {
  expect(TUTORIAL_STEPS).toHaveLength(18);
  const levels = TUTORIAL_STEPS.map((step) => step.level);
  expect(levels.filter((level) => level === 'beginner')).toHaveLength(8);
  expect(levels.filter((level) => level === 'intermediate')).toHaveLength(5);
  expect(levels.filter((level) => level === 'advanced')).toHaveLength(5);
  const ids = TUTORIAL_STEPS.map((step) => step.id);
  expect(new Set(ids).size).toBe(18);
  for (const step of TUTORIAL_STEPS) {
    expect(step.id).toMatch(URL_SAFE);
    expect(objectRefExists(step.object), step.id).toBe(true);
    for (const flag of step.show) {
      expect(isDisplayFlagKey(flag), `${step.id}: ${flag}`).toBe(true);
    }
    expect(step.title.length, step.id).toBeLessThanOrEqual(60);
    expect(step.observe.length, step.id).toBeLessThanOrEqual(120);
    const sentences = sentenceCount(step.description);
    expect(sentences, step.id).toBeGreaterThanOrEqual(3);
    expect(sentences, step.id).toBeLessThanOrEqual(5);
  }
});

test('an animated step names an operation its own group really has', () => {
  const animated = TUTORIAL_STEPS.filter((step) => step.animate !== undefined);
  expect(animated).toHaveLength(4);
  for (const step of animated) {
    const { kind, id } = splitObjectRef(step.object);
    expect(kind, step.id).toBe('molecule');
    const names = groupOperationNames(moleculePointGroup(id));
    expect(names, step.id).toContain(step.animate);
  }
});

test('the exercises have unique, linkable ids and two to four hints', () => {
  expect(EXERCISES).toHaveLength(29);
  expect(new Set(EXERCISES.map((exercise) => exercise.id)).size).toBe(29);
  const rank = { beginner: 0, intermediate: 1, advanced: 2 };
  const levels = EXERCISES.map((exercise) => exercise.level);
  expect(levels).toStrictEqual(
    levels.toSorted((one, other) => rank[one] - rank[other]),
  );
  for (const exercise of EXERCISES) {
    expect(exercise.id).toMatch(URL_SAFE);
    expect(exercise.hints.length, exercise.id).toBeGreaterThanOrEqual(2);
    expect(exercise.hints.length, exercise.id).toBeLessThanOrEqual(4);
    expect(exercise.solution.length, exercise.id).toBeGreaterThan(0);
    for (const hint of exercise.hints) {
      expect(sentenceCount(hint), `${exercise.id}: ${hint}`).toBe(1);
      expect(hint.length, `${exercise.id}: ${hint}`).toBeLessThanOrEqual(160);
    }
    const sentences = sentenceCount(exercise.description);
    expect(sentences, exercise.id).toBeGreaterThanOrEqual(2);
    expect(sentences, exercise.id).toBeLessThanOrEqual(5);
    for (const flag of exercise.requiredDisplay ?? []) {
      expect(isDisplayFlagKey(flag), exercise.id).toBe(true);
    }
  }
});

test('every authored answer is what the engine derives', () => {
  for (const exercise of EXERCISES) assertAnswerIsDerived(exercise);
});

test('every authored answer passes its own validator', () => {
  for (const exercise of EXERCISES) {
    const result = validateExercise(exercise, authoredAnswer(exercise));
    const failures = result.cases
      .filter((one) => !one.passed)
      .map((one) => one.reason);
    expect(failures, exercise.id).toStrictEqual([]);
    expect(result.error, exercise.id).toBeNull();
    expect(result.passed, exercise.id).toBe(true);
  }
});

test('an answer one step off the authored one fails', () => {
  for (const exercise of EXERCISES) {
    const result = validateExercise(exercise, wrongAnswer(exercise));
    expect(result.passed, exercise.id).toBe(false);
  }
});

test('a select exercise always offers something in and something out', () => {
  const selects = EXERCISES.filter((exercise) => exercise.kind === 'select');
  expect(selects).toHaveLength(4);
  for (const exercise of selects) {
    const belongs = new Set(exercise.answer);
    const outside = exercise.offered.filter((one) => !belongs.has(one.id));
    expect(belongs.size, exercise.id).toBeGreaterThanOrEqual(1);
    expect(outside.length, exercise.id).toBeGreaterThanOrEqual(1);
    for (const option of exercise.offered) {
      expect(
        option.reason.length,
        `${exercise.id}: ${option.id}`,
      ).toBeGreaterThan(0);
    }
  }
});

test('a named group always carries at least two near misses', () => {
  const named = EXERCISES.filter(
    (exercise) =>
      exercise.kind === 'assign-point-group' ||
      exercise.kind === 'identify-plane-group',
  );
  expect(named).toHaveLength(9);
  for (const exercise of named) {
    expect(exercise.nearMisses.length, exercise.id).toBeGreaterThanOrEqual(2);
    for (const miss of exercise.nearMisses) {
      expect(miss.group, exercise.id).not.toBe(exercise.solution);
      expect(miss.why.length, `${exercise.id}: ${miss.group}`).toBeGreaterThan(
        20,
      );
    }
  }
});

test('every place-atom probe comes out the way the exercise says it does', () => {
  const placements = EXERCISES.filter(
    (exercise) => exercise.kind === 'place-atom',
  );
  expect(placements).toHaveLength(1);
  for (const exercise of placements) {
    for (const probe of exercise.probes) {
      const result = validateExercise(exercise, {
        shape: 'atoms',
        value: probe.atoms,
      });
      expect(result.passed, `${exercise.id}: ${probe.why}`).toBe(
        probe.shouldPass,
      );
    }
  }
});

test('the lookups an address needs answer, and refuse an id nobody minted', () => {
  expect(tutorialStepById('bravais')?.title).toBe(
    'Seven systems, fourteen lattices',
  );
  expect(tutorialStepById('nonsense')).toBeUndefined();
  expect(tutorialStepIndex('mirror-water')).toBe(0);
  expect(tutorialStepIndex('nonsense')).toBe(-1);
  expect(tutorialStepsOfLevel('advanced')).toHaveLength(5);
  expect(exerciseById('place-rock-salt')?.kind).toBe('place-atom');
  expect(exerciseById('nonsense')).toBeUndefined();
  expect(exercisesOfLevel('beginner')).toHaveLength(8);
  expect(exercisesOfLevel('intermediate')).toHaveLength(10);
  expect(exercisesOfLevel('advanced')).toHaveLength(11);
  expect(objectRefMode('molecule:water')).toBe('molecule');
  expect(objectRefMode('spaceGroup:14')).toBe('crystal');
  expect(objectRefMode('wallpaper:p4m')).toBe('plane');
  expect(objectRefMode('frieze:p1m1')).toBe('plane');
  expect(objectRefExists('spaceGroup:231')).toBe(false);
  expect(objectRefExists('nonsense' as never)).toBe(false);
  expect(REFERENCE_ROW_COUNT).toBe(121);
});
