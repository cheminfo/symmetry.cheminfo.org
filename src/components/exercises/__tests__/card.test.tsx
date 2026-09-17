/**
 * The open question and the list beside it, as a student sees them.
 *
 * What is asserted is the marking a student reads — the sentence that names
 * what they answered and what the structure is, the near misses that survive a
 * wrong answer, the hint count on the button and the honest "solved with n
 * hints" badge — rather than that the two components render.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, test } from 'vitest';

import { EXERCISES } from '../../../data/exercises/index.ts';
import type { Exercise } from '../../../data/exercises/types.ts';
import {
  clearAllProgress,
  revealNextHint,
  setExerciseStatus,
  setShowSolution,
} from '../../../state/index.ts';
import { ExerciseCard } from '../ExerciseCard.tsx';
import { ExerciseDeck } from '../ExerciseDeck.tsx';
import { clearAllDrafts, writeDraft } from '../answerState.ts';

/** How many times a string occurs in the markup. */
function times(markup: string, text: string): number {
  return markup.split(text).length - 1;
}

/** One question, by the id the address carries. */
function exerciseOf(id: string): Exercise {
  const found = EXERCISES.find((exercise) => exercise.id === id);
  if (found === undefined) throw new Error(`no exercise ${id}`);
  return found;
}

/** Nobody clicks a string. */
function ignore(): void {
  // Nothing.
}

const WATER = exerciseOf('point-group-water');

beforeEach(() => {
  clearAllProgress();
  clearAllDrafts();
});

test('an untouched question offers no verdict and a dead Check button', () => {
  const markup = renderToStaticMarkup(<ExerciseCard exercise={WATER} />);

  expect(markup).toContain('<h1>Assign water</h1>');
  expect(markup).toContain('Reveal hint (0/3)');
  expect(markup).toContain('Reveal solution');
  // Nothing is written, so Check cannot be pressed and nothing is marked.
  expect(markup).toContain('<button type="button" disabled="" tabindex="-1"');
  expect(markup).toContain('<div class="exercise-verdict"></div>');
  // A red cross on a question nobody has read yet is what closes the page.
  expect(times(markup, 'bp6-icon-cross-circle')).toBe(0);
});

test('a wrong answer is told what it said and what the structure is', () => {
  writeDraft(WATER.id, { shape: 'text', value: 'C3v' });
  setExerciseStatus(WATER.id, 'attempted');

  const markup = renderToStaticMarkup(<ExerciseCard exercise={WATER} />);

  expect(markup).toContain('<h5 class="bp6-heading">Not yet</h5>');
  expect(markup).toContain(
    '1 of 4 checks below did not come out. Each one says what it got and what it wanted.',
  );
  expect(markup).toContain('you answered C3v; this structure is C2v');
  // The three near misses are the negative cases, and they still pass.
  expect(markup).toContain(
    'not C2h — there is no σh: both of water’s planes contain the C2 axis, so both are σv.',
  );
  expect(markup).toContain(
    'not D2h — D2h needs two more C2 axes perpendicular to the first, and water has none.',
  );
  expect(markup).toContain(
    'not Cs — Cs stops at a single mirror plane. Water has two, and a C2 where they cross.',
  );
  // One failed case, three passed ones, and the callout's own cross above them.
  expect(times(markup, 'bp6-icon-cross-circle bp6-intent-danger')).toBe(1);
  expect(times(markup, 'bp6-icon-tick-circle bp6-intent-success')).toBe(3);
  // What was typed is still in the box, so it can be edited rather than retyped.
  expect(markup).toContain('value="C3v"');
});

test('the right answer is congratulated with the chemistry, not with a badge', () => {
  writeDraft(WATER.id, { shape: 'text', value: 'C2v' });
  setExerciseStatus(WATER.id, 'solved');

  const markup = renderToStaticMarkup(<ExerciseCard exercise={WATER} />);

  expect(markup).not.toContain('<h5 class="bp6-heading">Not yet</h5>');
  // Four cases out of four, and the sentence over them is the chemistry.
  expect(times(markup, 'bp6-icon-tick-circle bp6-intent-success')).toBe(4);
  expect(times(markup, 'bp6-icon-cross-circle')).toBe(0);
  expect(markup).toContain(`bp6-icon-tick-circle" data-icon="tick-circle">`);
  expect(WATER.solution).toBe('C2v');
  expect(markup).toContain('bp6-callout bp6-intent-success');
  // No confetti, no streak, no badge: being right is the reward.
  expect(markup).not.toContain('Great');
  expect(markup).not.toContain('Well done');
});

test('the hint button counts what is open, and the ladder shows only those', () => {
  revealNextHint(WATER.id, WATER.hints.length);
  revealNextHint(WATER.id, WATER.hints.length);

  const markup = renderToStaticMarkup(<ExerciseCard exercise={WATER} />);

  expect(WATER.hints).toHaveLength(3);
  expect(markup).toContain('Reveal hint (2/3)');
  expect(markup).toContain(
    'Find the highest-order rotation axis first: everything else is named against it.',
  );
  expect(markup).toContain(
    'Both mirror planes contain the C2 axis, which makes them σv rather than σh.',
  );
  // The third is still closed: the ladder opens one at a time.
  expect(markup).not.toContain(WATER.hints[2] ?? 'no third hint');
  expect(times(markup, '<li style="line-height:1.45">')).toBe(2);
});

test('the solution is never withheld, and says so when it is open', () => {
  setShowSolution(WATER.id, true);

  const markup = renderToStaticMarkup(<ExerciseCard exercise={WATER} />);

  expect(markup).toContain('Hide solution');
  expect(markup).toContain('<h5 class="bp6-heading">One answer</h5>C2v');
});

test('a question with nothing to draw offers no diagram button', () => {
  const rowQuestion = exerciseOf('character-row-c2v-b1');
  const markup = renderToStaticMarkup(<ExerciseCard exercise={rowQuestion} />);

  expect(markup).toContain('<h1>Complete the B₁ row of C₂ᵥ</h1>');
  expect(markup).not.toContain('Show diagram');
  // The blanked row is the figure: the three given rows are drawn in the table.
  expect(markup).toContain('Reveal hint (0/3)');
});

test('an answer the engine cannot mark says so, rather than blanking', () => {
  // C7 ships no character table, so marking a row of it throws by name. The
  // card must report that where the marking goes, not lose the page to it.
  const broken = { ...exerciseOf('character-row-c2v-b1'), pointGroup: 'C7' };
  writeDraft(broken.id, { shape: 'fields', value: { E: '1' } });
  setExerciseStatus(broken.id, 'attempted');

  const markup = renderToStaticMarkup(<ExerciseCard exercise={broken} />);

  expect(markup).toContain('no character table for C7');
  expect(markup).toContain('bp6-intent-warning');
  // No "Not yet": nothing was marked, so nothing is counted wrong.
  expect(markup).not.toContain('<h5 class="bp6-heading">Not yet</h5>');
});

test('the deck lists every question, none solved on a fresh browser', () => {
  const markup = renderToStaticMarkup(
    <ExerciseDeck activeId={null} onSelect={ignore} />,
  );

  expect(EXERCISES).toHaveLength(29);
  expect(times(markup, 'role="option"')).toBe(29);
  expect(markup).toContain('0 / 29 solved');
  expect(times(markup, 'aria-selected="true"')).toBe(0);
  // Nothing to clear, so the destructive button is dead.
  expect(markup).toContain('Clear all answers');
  expect(times(markup, 'aria-label="not started"')).toBe(29);
});

test('the deck records how many hints each solved question took', () => {
  revealNextHint('point-group-water', 3);
  revealNextHint('point-group-water', 3);
  setExerciseStatus('point-group-water', 'solved');
  revealNextHint('point-group-methane', 3);
  setExerciseStatus('point-group-methane', 'solved');
  setExerciseStatus('point-group-bf3', 'attempted');

  const markup = renderToStaticMarkup(
    <ExerciseDeck activeId="point-group-bf3" onSelect={ignore} />,
  );

  expect(markup).toContain('2 / 29 solved');
  expect(markup).toContain('Solved with 2 hints');
  expect(markup).toContain('Solved with 1 hint');
  expect(times(markup, 'aria-label="right"')).toBe(2);
  expect(times(markup, 'aria-label="handed in, not right yet"')).toBe(1);
  expect(times(markup, 'aria-label="not started"')).toBe(26);
  // The open question is the selected option, and it is the only one.
  expect(times(markup, 'aria-selected="true"')).toBe(1);
  expect(markup).toContain(
    'data-selected="true" class="exercise-deck__item exercise-deck__item--active"',
  );
});
