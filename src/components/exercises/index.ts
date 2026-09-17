/**
 * The exercises: the deck, the open question, its form and its marking.
 *
 * The character table and the glossary come from `../tutorial`, because a
 * question and the step that taught it must print a class header and define a
 * term the same way.
 */

import './exercises.css';

export type { AnswerInputProps } from './AnswerInput.tsx';
export { AnswerInput } from './AnswerInput.tsx';
export type { AtomsAnswerProps } from './AtomsAnswer.tsx';
export { AtomsAnswer } from './AtomsAnswer.tsx';
export type { CharacterRowAnswerProps } from './CharacterRowAnswer.tsx';
export { CharacterRowAnswer } from './CharacterRowAnswer.tsx';
export type { ExerciseCardProps } from './ExerciseCard.tsx';
export { ExerciseCard } from './ExerciseCard.tsx';
export type { ExerciseDeckProps } from './ExerciseDeck.tsx';
export { ExerciseDeck } from './ExerciseDeck.tsx';
export type { ExerciseFigureProps } from './ExerciseFigure.tsx';
export { ExerciseFigure } from './ExerciseFigure.tsx';
export type { ExerciseVerdictProps } from './ExerciseVerdict.tsx';
export { ExerciseVerdict } from './ExerciseVerdict.tsx';
export type { FieldsAnswerProps } from './FieldsAnswer.tsx';
export { FieldsAnswer } from './FieldsAnswer.tsx';
export type { MultiplyAnswerProps } from './MultiplyAnswer.tsx';
export { MultiplyAnswer } from './MultiplyAnswer.tsx';
export type { ReduceAnswerProps } from './ReduceAnswer.tsx';
export { ReduceAnswer } from './ReduceAnswer.tsx';
export type { SelectAnswerProps } from './SelectAnswer.tsx';
export { SelectAnswer } from './SelectAnswer.tsx';
export type { TextAnswerProps } from './TextAnswer.tsx';
export { TextAnswer } from './TextAnswer.tsx';
export {
  answerIsBlank,
  blankAnswer,
  clearAllDrafts,
  clearDraft,
  readDraft,
  writeDraft,
} from './answerState.ts';
export {
  NO_LAYERS,
  hasFigure,
  moleculeOf,
  spaceGroupOf,
} from './figureSubject.ts';
export type { FieldInput } from './labels.ts';
export {
  FIELD_LABEL,
  KIND_LABEL,
  QUANTITY_LABEL,
  fieldInput,
} from './labels.ts';
