/**
 * Marking an answer, one validator per kind of question.
 *
 * **The authored answer is never consulted.** Every verdict goes back to the
 * engine — the detector, the catalogues, the character tables, the space-group
 * operations — so an exercise whose data file is wrong fails the content tests
 * rather than a student. The page hands over what the student did in one of
 * four shapes, and the exercise says which.
 */

import type { ValidationResult } from 'react-cheminfo/core';
import { failedValidation, finishValidation } from 'react-cheminfo/core';

import type { Exercise, PlacedAtom } from '../data/exercises/types.ts';
import type { DisplayFlagKey } from '../state/displayFlags.ts';

import { validateCharacterRow, validateReduce } from './validate/characters.ts';
import {
  validateIdentifyPlaneGroup,
  validatePlaceAtom,
  validateSpaceGroupFacts,
} from './validate/crystal.ts';
import { displayLabels, missingDisplay } from './validate/display.ts';
import {
  validateAssignPointGroup,
  validateCount,
  validateMultiply,
  validateSelect,
} from './validate/molecular.ts';

export type { GeneratedAtom, GeneratedSite } from './validate/structure.ts';
export { checkConstraint, generateStructure } from './validate/structure.ts';
export {
  canonicalPlaneGroup,
  canonicalSchoenflies,
  groupOperationNames,
  operationByName,
} from './validate/names.ts';
export {
  characterRow,
  deriveCount,
  groupClassLabels,
  isSohncke,
  moleculePointGroup,
  properAxisCount,
  reduceToIrreps,
} from './validate/derive.ts';
export { spaceGroupFact } from './validate/crystal.ts';
export { displayLabels, missingDisplay } from './validate/display.ts';
export { selectMembership } from './validate/molecular.ts';
export { validateCharacterRow, validateReduce } from './validate/characters.ts';
export {
  validateAssignPointGroup,
  validateCount,
  validateMultiply,
  validateSelect,
} from './validate/molecular.ts';
export {
  validateIdentifyPlaneGroup,
  validatePlaceAtom,
  validateSpaceGroupFacts,
} from './validate/crystal.ts';

/**
 * What a student did, in the four shapes a page can hold.
 *
 * `text` is one typed symbol, `set` a list of ticks or one choice per row,
 * `fields` a value per named box, `atoms` what was placed in a cell.
 */
export type ExerciseAnswer =
  | { readonly shape: 'text'; readonly value: string }
  | { readonly shape: 'set'; readonly value: readonly string[] }
  | {
      readonly shape: 'fields';
      readonly value: Readonly<Record<string, string>>;
    }
  | { readonly shape: 'atoms'; readonly value: readonly PlacedAtom[] };

/** Which shape a kind of question is answered in. */
export function answerShapeOf(exercise: Exercise): ExerciseAnswer['shape'] {
  switch (exercise.kind) {
    case 'assign-point-group':
    case 'identify-plane-group': {
      return 'text';
    }
    case 'select':
    case 'multiply': {
      return 'set';
    }
    case 'place-atom': {
      return 'atoms';
    }
    case 'count':
    case 'character-row':
    case 'reduce':
    case 'space-group-facts': {
      return 'fields';
    }
    // no default
  }
}

/**
 * The verdict on one answer.
 *
 * A question that is read off the picture is not marked while a layer it needs
 * is switched off: the missing layers come back as `missingOptions` and no case
 * is run, so the student is told which chip to press rather than left to read
 * failing checks as a wrong answer.
 *
 * @param exercise - The question.
 * @param answer - What the student did, in the shape {@link answerShapeOf} names.
 * @param shown - The display layers currently drawn. Omitted where nothing is
 * on screen to switch, which is how the content tests mark the chemistry alone.
 * @returns Every graded case, the layers still to switch on, and whether the
 * answer is right.
 */
export function validateExercise(
  exercise: Exercise,
  answer: ExerciseAnswer,
  shown?: readonly DisplayFlagKey[],
): ValidationResult {
  if (answer.shape !== answerShapeOf(exercise)) {
    return failedValidation(
      `${exercise.id} is answered as ${answerShapeOf(exercise)}, not as ${answer.shape}.`,
    );
  }
  const missing = missingDisplay(exercise, shown);
  if (missing.length > 0) {
    return finishValidation([], { missingOptions: displayLabels(missing) });
  }
  switch (exercise.kind) {
    case 'assign-point-group': {
      return validateAssignPointGroup(exercise, asText(answer));
    }
    case 'identify-plane-group': {
      return validateIdentifyPlaneGroup(exercise, asText(answer));
    }
    case 'select': {
      return validateSelect(exercise, asSet(answer));
    }
    case 'multiply': {
      return validateMultiply(exercise, asSet(answer));
    }
    case 'count': {
      return validateCount(exercise, asFields(answer));
    }
    case 'character-row': {
      return validateCharacterRow(exercise, asFields(answer));
    }
    case 'reduce': {
      return validateReduce(exercise, asFields(answer));
    }
    case 'space-group-facts': {
      return validateSpaceGroupFacts(exercise, asFields(answer));
    }
    case 'place-atom': {
      return validatePlaceAtom(exercise, asAtoms(answer));
    }
    // no default
  }
}

function asText(answer: ExerciseAnswer): string {
  return answer.shape === 'text' ? answer.value : '';
}

function asSet(answer: ExerciseAnswer): readonly string[] {
  return answer.shape === 'set' ? answer.value : [];
}

function asFields(answer: ExerciseAnswer): Readonly<Record<string, string>> {
  return answer.shape === 'fields' ? answer.value : {};
}

function asAtoms(answer: ExerciseAnswer): readonly PlacedAtom[] {
  return answer.shape === 'atoms' ? answer.value : [];
}
