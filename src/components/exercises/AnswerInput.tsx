/**
 * The form of one question, whichever of the nine kinds it is.
 *
 * The **shape** picks the family of form — a typed symbol, a set of ticks, a
 * value per named box, atoms in a cell — and the kind picks the form inside it.
 * The shape is `answerShapeOf`'s, so a form and its validator can never
 * disagree about what is being handed over.
 */

import type { ReactElement } from 'react';

import type { Exercise } from '../../data/exercises/types.ts';
import type { ExerciseAnswer } from '../../symmetry/validate.ts';

import { AtomsAnswer } from './AtomsAnswer.tsx';
import { CharacterRowAnswer } from './CharacterRowAnswer.tsx';
import { FieldsAnswer } from './FieldsAnswer.tsx';
import { MultiplyAnswer } from './MultiplyAnswer.tsx';
import { ReduceAnswer } from './ReduceAnswer.tsx';
import { SelectAnswer } from './SelectAnswer.tsx';
import { TextAnswer } from './TextAnswer.tsx';

/** What {@link AnswerInput} needs. */
export interface AnswerInputProps {
  /** The question being answered. */
  readonly exercise: Exercise;
  /** What the student has written so far. */
  readonly answer: ExerciseAnswer;
  /** Called with the whole answer on every change. */
  readonly onChange: (answer: ExerciseAnswer) => void;
}

/**
 * The form the question is answered in.
 * @param props - See {@link AnswerInputProps}.
 * @returns The form, or nothing when the answer is not of the question's shape.
 */
export function AnswerInput(props: AnswerInputProps): ReactElement | null {
  const { exercise, answer, onChange } = props;
  switch (answer.shape) {
    case 'text': {
      return (
        <TypedForm
          exercise={exercise}
          value={answer.value}
          onChange={(value) => {
            onChange({ shape: 'text', value });
          }}
        />
      );
    }
    case 'set': {
      return (
        <TickedForm
          exercise={exercise}
          value={answer.value}
          onChange={(value) => {
            onChange({ shape: 'set', value });
          }}
        />
      );
    }
    case 'fields': {
      return (
        <BoxedForm
          exercise={exercise}
          value={answer.value}
          onChange={(value) => {
            onChange({ shape: 'fields', value });
          }}
        />
      );
    }
    case 'atoms': {
      return exercise.kind === 'place-atom' ? (
        <AtomsAnswer
          exercise={exercise}
          value={answer.value}
          onChange={(value) => {
            onChange({ shape: 'atoms', value });
          }}
        />
      ) : null;
    }
    // no default
  }
}

/** A single symbol: a Schoenflies name, or a plane-group name. */
function TypedForm(props: {
  readonly exercise: Exercise;
  readonly value: string;
  readonly onChange: (value: string) => void;
}): ReactElement | null {
  const { exercise, value, onChange } = props;
  if (exercise.kind === 'assign-point-group') {
    return (
      <TextAnswer
        value={value}
        label="Schoenflies symbol"
        placeholder="C2v"
        accepts="Subscripts are optional, and D∞h, Dinfh and D*h all mark the same."
        onChange={onChange}
      />
    );
  }
  if (exercise.kind !== 'identify-plane-group') return null;
  return (
    <TextAnswer
      value={value}
      label={`${exercise.pattern.namespace} group`}
      placeholder={exercise.pattern.namespace === 'frieze' ? 'p1m1' : 'p4m'}
      accepts="The short or the full IUCr symbol, or the orbifold — p4mm and *442 are the same answer."
      onChange={onChange}
    />
  );
}

/** A set of ticks, or one operation chosen per product. */
function TickedForm(props: {
  readonly exercise: Exercise;
  readonly value: readonly string[];
  readonly onChange: (value: readonly string[]) => void;
}): ReactElement | null {
  const { exercise, value, onChange } = props;
  if (exercise.kind === 'select') {
    return (
      <SelectAnswer exercise={exercise} value={value} onChange={onChange} />
    );
  }
  if (exercise.kind !== 'multiply') return null;
  return (
    <MultiplyAnswer exercise={exercise} value={value} onChange={onChange} />
  );
}

/** A value per named box: a count, a character, a multiplicity, a fact. */
function BoxedForm(props: {
  readonly exercise: Exercise;
  readonly value: Readonly<Record<string, string>>;
  readonly onChange: (value: Readonly<Record<string, string>>) => void;
}): ReactElement | null {
  const { exercise, value, onChange } = props;
  if (exercise.kind === 'character-row') {
    return (
      <CharacterRowAnswer
        exercise={exercise}
        value={value}
        onChange={onChange}
      />
    );
  }
  if (exercise.kind === 'reduce') {
    return (
      <ReduceAnswer exercise={exercise} value={value} onChange={onChange} />
    );
  }
  if (exercise.kind === 'count' || exercise.kind === 'space-group-facts') {
    return (
      <FieldsAnswer exercise={exercise} value={value} onChange={onChange} />
    );
  }
  return null;
}
