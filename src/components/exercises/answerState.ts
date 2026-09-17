/**
 * What a student has written, while the page is open.
 *
 * The answer is **not** persisted. What is worth remembering across a reload is
 * the status, the hints opened and the revealed solution, which
 * `state.preferences` already keeps; a half-typed symbol is not, and storing it
 * would make a stale draft override a fresh start. Within one visit the drafts
 * survive moving to another exercise and back, which is the case that actually
 * annoys anybody.
 */

import type { Exercise, PlacedAtom } from '../../data/exercises/types.ts';
import type { ExerciseAnswer } from '../../symmetry/validate.ts';
import { answerShapeOf } from '../../symmetry/validate.ts';

/** The answer an untouched exercise starts from. */
export function blankAnswer(exercise: Exercise): ExerciseAnswer {
  switch (answerShapeOf(exercise)) {
    case 'text': {
      return { shape: 'text', value: '' };
    }
    case 'set': {
      return {
        shape: 'set',
        value:
          exercise.kind === 'multiply' ? exercise.products.map(() => '') : [],
      };
    }
    case 'fields': {
      return { shape: 'fields', value: {} };
    }
    case 'atoms': {
      return { shape: 'atoms', value: blankAtoms(exercise) };
    }
    // no default
  }
}

/**
 * Whether there is anything to mark yet.
 *
 * An untouched answer is not a wrong one: the test cases are drawn as not
 * evaluated, and Check is dead until something is written.
 * @param answer - What the student has so far.
 * @returns True while nothing has been written.
 */
export function answerIsBlank(answer: ExerciseAnswer): boolean {
  switch (answer.shape) {
    case 'text': {
      return answer.value.trim() === '';
    }
    case 'set': {
      return answer.value.every((entry) => entry === '');
    }
    case 'fields': {
      return Object.values(answer.value).every((entry) => entry.trim() === '');
    }
    case 'atoms': {
      return answer.value.every(
        (atom) => atom.x === 0 && atom.y === 0 && atom.z === 0,
      );
    }
    // no default
  }
}

/** What the student last wrote here in this visit, or a blank answer. */
export function readDraft(exercise: Exercise): ExerciseAnswer {
  return DRAFTS.get(exercise.id) ?? blankAnswer(exercise);
}

/** Keep what the student wrote, so leaving the exercise does not lose it. */
export function writeDraft(id: string, answer: ExerciseAnswer): void {
  DRAFTS.set(id, answer);
}

/** Forget one draft, for Reset. */
export function clearDraft(id: string): void {
  DRAFTS.delete(id);
}

/** Forget every draft, for *Clear all answers*. */
export function clearAllDrafts(): void {
  DRAFTS.clear();
}

/** Session only, and deliberately not a signal: nothing outside a card reads it. */
const DRAFTS = new Map<string, ExerciseAnswer>();

/** One row per atom the question asks for, all at the origin. */
function blankAtoms(exercise: Exercise): PlacedAtom[] {
  if (exercise.kind !== 'place-atom') return [];
  const rows: PlacedAtom[] = [];
  for (let index = 0; index < exercise.asked.count; index++) {
    rows.push({ element: exercise.asked.element, x: 0, y: 0, z: 0 });
  }
  return rows;
}
