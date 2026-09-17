import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import { EXERCISES, exerciseById } from '../../../data/exercises/index.ts';
import type { Exercise } from '../../../data/exercises/types.ts';
import type { ExerciseAnswer } from '../../../symmetry/validate.ts';
import { AnswerInput } from '../AnswerInput.tsx';
import { ExerciseFigure } from '../ExerciseFigure.tsx';
import { blankAnswer } from '../answerState.ts';

/** The question with this id. @throws When nobody minted it. */
function question(id: string): Exercise {
  const found = exerciseById(id);
  if (found === undefined) throw new Error(`no exercise ${id}`);
  return found;
}

/** The form of a question, as the page draws it before anything is written. */
function form(id: string, answer?: ExerciseAnswer): string {
  const exercise = question(id);
  return renderToStaticMarkup(
    <AnswerInput
      exercise={exercise}
      answer={answer ?? blankAnswer(exercise)}
      onChange={() => undefined}
    />,
  );
}

/** How many times a tag opens in the markup. */
function count(markup: string, tag: string): number {
  return markup.split(`<${tag}`).length - 1;
}

test('every question of the site draws a form', () => {
  for (const exercise of EXERCISES) {
    const markup = renderToStaticMarkup(
      <AnswerInput
        exercise={exercise}
        answer={blankAnswer(exercise)}
        onChange={() => undefined}
      />,
    );
    expect(markup).not.toBe('');
  }
});

test('a Schoenflies answer is one box, and it says what else it takes', () => {
  const markup = form('point-group-water');

  expect(count(markup, 'input')).toBe(1);
  expect(markup).toContain('Schoenflies symbol');
  expect(markup).toContain('Dinfh and D*h all mark the same');
  // A phone keyboard must not "correct" C2v to C2V. Attribute names are
  // case-insensitive in HTML, and React writes this one as it was given.
  expect(markup.toLowerCase()).toContain('spellcheck="false"');
  expect(markup.toLowerCase()).toContain('autocorrect="off"');
});

test('a plane-group answer names the namespace it is asked in', () => {
  expect(form('wallpaper-p4m')).toContain('wallpaper group');
  expect(form('frieze-sidle')).toContain('frieze group');
});

test('a set question offers every option, the ones that do not belong included', () => {
  const exercise = question('ops-of-water');
  if (exercise.kind !== 'select') throw new Error('not a select question');
  const markup = form('ops-of-water');

  expect(exercise.offered).toHaveLength(6);
  expect(exercise.answer).toHaveLength(4);
  expect(count(markup, 'input')).toBe(6);
  expect(markup.split('type="checkbox"')).toHaveLength(7);
  for (const option of exercise.offered) {
    expect(markup).toContain(option.label ?? option.id);
  }
});

test('a counting question opens one numbered box per quantity, in its own words', () => {
  const markup = form('order-of-ammonia');

  expect(count(markup, 'input')).toBe(3);
  expect(markup).toContain('Order h');
  expect(markup).toContain('Classes');
  expect(markup).toContain('Mirror planes');
  expect(markup).not.toContain('mirrorPlanes');
});

test('a blanked row is drawn inside the table it has to be orthogonal to', () => {
  const markup = form('character-row-c2v-b1');

  expect(markup).toContain('<table');
  expect(markup).toContain('class="answer-row"');
  // One box per class of C2v, and the given rows printed above them — set in
  // the workbench's own type, since it is the workbench's table.
  expect(count(markup, 'input')).toBe(4);
  expect(markup).toContain(
    '<th scope="row" class="mol-table__irrep"><span>A<sub>1</sub></span></th>',
  );
});

test('a reduction offers a box for every irrep, zeroes included', () => {
  const markup = form('reduce-water-stretch');

  // C2v has four irreps, so four boxes — not just the ones that occur.
  expect(count(markup, 'input')).toBe(4);
  expect(markup).toContain('the bond stretches');
  for (const mulliken of ['A1', 'A2', 'B1', 'B2']) {
    expect(markup).toContain(`>${mulliken}</span>`);
  }
});

test('a product question says which operation is applied first', () => {
  const exercise = question('multiply-c2v');
  if (exercise.kind !== 'multiply') throw new Error('not a multiply question');
  const markup = form('multiply-c2v');

  expect(markup).toContain('apply b first, then a, in C2v');
  expect(count(markup, 'select')).toBe(exercise.products.length);
  // Each row offers every operation of the group, plus the unanswered entry.
  expect(count(markup, 'option')).toBe(
    exercise.products.length * (exercise.offered.length + 1),
  );
});

test('a facts question uses a list where the answer is one of a few', () => {
  const exercise = question('facts-p21c');
  if (exercise.kind !== 'space-group-facts') {
    throw new Error('not a facts question');
  }
  const markup = form('facts-p21c');

  expect(exercise.asked).toContain('crystalSystem');
  expect(markup).toContain('Crystal system');
  expect(markup).toContain('>monoclinic</option>');
  expect(count(markup, 'select')).toBe(4);
});

test('placing an atom says what is already in the cell', () => {
  const markup = form('place-rock-salt');

  expect(markup).toContain('Already in the cell: Na at (0, 0, 0).');
  // One row of three fractional coordinates for the one chlorine asked for.
  expect(count(markup, 'input')).toBe(3);
  expect(markup).toContain('>Cl1</span>');
});

test('what is written comes back into the form', () => {
  const markup = form('point-group-water', { shape: 'text', value: 'C2h' });

  expect(markup).toContain('value="C2h"');
});

test('a pattern question shows the pattern, and the diagram only when asked', () => {
  const exercise = question('wallpaper-p4m');
  const plain = renderToStaticMarkup(<ExerciseFigure exercise={exercise} />);
  const aided = renderToStaticMarkup(
    <ExerciseFigure exercise={exercise} detail />,
  );

  // The tiling is the question; the element diagram is the aid.
  expect(count(plain, 'svg')).toBe(1);
  expect(count(aided, 'svg')).toBe(2);
  expect(aided).toContain('its symmetry elements');
  expect(plain).not.toContain('its symmetry elements');
});

test('a cell question lists the positions only behind Show diagram', () => {
  const exercise = question('facts-p21c');

  expect(renderToStaticMarkup(<ExerciseFigure exercise={exercise} />)).toBe('');
  expect(
    renderToStaticMarkup(<ExerciseFigure exercise={exercise} detail />),
  ).toContain('P 1 21/c 1 · multiplicity 4 · centring P');
});

test('a question about a table has no picture at all', () => {
  expect(
    renderToStaticMarkup(
      <ExerciseFigure exercise={question('multiply-c2v')} detail />,
    ),
  ).toBe('');
});

test('a molecule question says why there is no 3D rather than showing a blank', () => {
  const markup = renderToStaticMarkup(
    <ExerciseFigure exercise={question('point-group-water')} />,
  );

  expect(markup).toContain('No 3D on this machine');
});
