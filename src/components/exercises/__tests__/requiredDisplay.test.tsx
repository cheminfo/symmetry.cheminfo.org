/**
 * A question read off the picture, with the layer it is read from switched off.
 *
 * What is asserted is the sentence the student gets and the chip that answers
 * it: the marking has to say which control to press, because half-marked checks
 * on a right answer teach nothing except that the page is broken.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, test } from 'vitest';

import { EXERCISES } from '../../../data/exercises/index.ts';
import type { Exercise } from '../../../data/exercises/types.ts';
import {
  DISPLAY_FLAGS,
  clearAllProgress,
  setDisplayFlag,
  setExerciseStatus,
} from '../../../state/index.ts';
import { ExerciseCard } from '../ExerciseCard.tsx';
import { clearAllDrafts, writeDraft } from '../answerState.ts';
import { drawnLayerKey, layerKeysOf, shownLayerKey } from '../layerState.ts';

/** One question, by the id the address carries. */
function exerciseOf(id: string): Exercise {
  const found = EXERCISES.find((exercise) => exercise.id === id);
  if (found === undefined) throw new Error(`no exercise ${id}`);
  return found;
}

/** The allene card, answered rightly and handed in. */
function handedIn(exercise: Exercise, value: string): string {
  writeDraft(exercise.id, { shape: 'text', value });
  setExerciseStatus(exercise.id, 'attempted');
  return renderToStaticMarkup(<ExerciseCard exercise={exercise} />);
}

const ALLENE = exerciseOf('point-group-allene');

beforeEach(() => {
  clearAllProgress();
  clearAllDrafts();
  for (const meta of DISPLAY_FLAGS) setDisplayFlag(meta.key, meta.initial);
});

test('the layers a visitor has not touched are the ones the site opens with', () => {
  expect(shownLayerKey()).toBe('axes mirrors inversion unitCell labels');
  expect(layerKeysOf(shownLayerKey())).toStrictEqual([
    'axes',
    'mirrors',
    'inversion',
    'unitCell',
    'labels',
  ]);
  expect(layerKeysOf('')).toStrictEqual([]);
  expect(layerKeysOf('axes nonsense')).toStrictEqual(['axes']);
});

test('a figure draws the layers its question names, and only while they are on', () => {
  // The improper axis is what allene is about, and it opens switched off.
  expect(drawnLayerKey(ALLENE, shownLayerKey())).toBe('');
  expect(drawnLayerKey(ALLENE, 'improper')).toBe('improper');
  expect(drawnLayerKey(exerciseOf('ops-of-water'), shownLayerKey())).toBe(
    'mirrors axes',
  );
  // A question that names no layer shows the bare structure: the axes and the
  // mirrors a visitor has on elsewhere would be the answer to it.
  expect(drawnLayerKey(exerciseOf('point-group-water'), shownLayerKey())).toBe(
    '',
  );
});

test('the question offers the chip for each layer it is read with', () => {
  const markup = renderToStaticMarkup(<ExerciseCard exercise={ALLENE} />);

  expect(markup).toContain('class="chip-bar"');
  expect(markup).toContain('>Improper axes</button>');
  expect(markup).toContain('aria-pressed="false"');
  // Nothing has been handed in, so nothing is said about it yet.
  expect(markup).not.toContain('Not marked yet');
});

test('a right answer with the layer off says which chip to press, and marks nothing', () => {
  const markup = handedIn(ALLENE, 'D2d');

  expect(markup).toContain('<h5 class="bp6-heading">Not marked yet</h5>');
  expect(markup).toContain(
    'This question is read off the picture, and a layer it needs is switched off. Switch on: Improper axes.',
  );
  // The answer was never marked, so it is neither right nor wrong on screen.
  expect(markup).not.toContain('<h5 class="bp6-heading">Not yet</h5>');
  expect(markup).not.toContain('bp6-icon-cross-circle bp6-intent-danger');
  expect(markup).not.toContain('bp6-icon-tick-circle bp6-intent-success');
});

test('switching that layer on marks the answer and solves the question', () => {
  setDisplayFlag('improper', true);
  const markup = handedIn(ALLENE, 'D2d');

  expect(markup).not.toContain('Not marked yet');
  expect(markup).toContain('aria-pressed="true"');
  expect(markup).toContain('D2d: right.');
  expect(markup).toContain('bp6-callout bp6-intent-success');
  // One case for the group and one per near miss, all four passed.
  expect(ALLENE.kind).toBe('assign-point-group');
  expect(markup.split('bp6-icon-tick-circle bp6-intent-success')).toHaveLength(
    5,
  );
});

test('a wrong answer with the layer on is marked as wrong, not as a missing layer', () => {
  setDisplayFlag('improper', true);
  const markup = handedIn(ALLENE, 'D2h');

  expect(markup).not.toContain('Not marked yet');
  expect(markup).toContain('<h5 class="bp6-heading">Not yet</h5>');
  expect(markup).toContain('you answered D2h; this structure is D2d');
});

test('a question that names no layer is never held up by one', () => {
  for (const meta of DISPLAY_FLAGS) setDisplayFlag(meta.key, false);
  const markup = handedIn(exerciseOf('point-group-water'), 'C2v');

  expect(markup).not.toContain('Not marked yet');
  expect(markup).not.toContain('class="chip-bar"');
  expect(markup).toContain('C2v: right.');
});
