/**
 * The authored answer of an exercise, in the shape a page would hand over.
 *
 * Used only by the content tests: they run every exercise through the real
 * validator with the value written in its data file, so an authored answer the
 * engine disagrees with fails the build. `wrongAnswer` is the other half — a
 * gate nobody has watched fail is not a gate.
 */

import type { ExerciseAnswer } from '../../symmetry/validate.ts';
import type { Exercise } from '../exercises/types.ts';

/** What the data file says the answer is. */
export function authoredAnswer(exercise: Exercise): ExerciseAnswer {
  switch (exercise.kind) {
    case 'assign-point-group':
    case 'identify-plane-group': {
      return { shape: 'text', value: exercise.solution };
    }
    case 'select':
    case 'multiply': {
      return { shape: 'set', value: exercise.answer };
    }
    case 'place-atom': {
      return { shape: 'atoms', value: exercise.answer };
    }
    case 'count':
    case 'character-row':
    case 'reduce':
    case 'space-group-facts': {
      return { shape: 'fields', value: asFields(exercise.answer) };
    }
    // no default
  }
}

/** One answer away from the authored one, and therefore wrong. */
export function wrongAnswer(exercise: Exercise): ExerciseAnswer {
  switch (exercise.kind) {
    case 'assign-point-group': {
      return {
        shape: 'text',
        value: exercise.solution === 'C1' ? 'C2v' : 'C1',
      };
    }
    case 'identify-plane-group': {
      return { shape: 'text', value: exercise.solution === 'p1' ? 'p2' : 'p1' };
    }
    case 'select': {
      return { shape: 'set', value: exercise.answer.slice(1) };
    }
    case 'multiply': {
      const first = exercise.answer[0];
      const other = exercise.offered.find((name) => name !== first);
      return {
        shape: 'set',
        value: [other ?? '', ...exercise.answer.slice(1)],
      };
    }
    case 'place-atom': {
      return {
        shape: 'atoms',
        value: exercise.answer.map((atom) => ({
          element: atom.element,
          x: 0.37,
          y: 0.19,
          z: 0.11,
        })),
      };
    }
    case 'count':
    case 'character-row':
    case 'reduce':
    case 'space-group-facts': {
      return { shape: 'fields', value: bump(asFields(exercise.answer)) };
    }
    // no default
  }
}

/** Every value as the string a form control would hold. */
function asFields(
  answer: Readonly<Record<string, string | number | boolean>>,
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(answer)) {
    fields[key] = String(value);
  }
  return fields;
}

/** The first field, moved off its value. */
function bump(fields: Record<string, string>): Record<string, string> {
  const changed = { ...fields };
  const first = Object.keys(changed)[0];
  if (first === undefined) return changed;
  const value = Number(changed[first]);
  changed[first] = Number.isFinite(value)
    ? String(value + 1)
    : `not ${changed[first]}`;
  return changed;
}
