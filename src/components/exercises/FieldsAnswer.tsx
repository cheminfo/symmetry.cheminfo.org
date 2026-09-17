/**
 * A box per quantity, and a box per fact.
 *
 * Both kinds of question hand the validator one string per named box, so they
 * are one form: what differs is the label and whether the box is a number, a
 * choice or free text.
 */

import { HTMLSelect, InputGroup } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import type {
  CountExercise,
  SpaceGroupFactsExercise,
} from '../../data/exercises/types.ts';

import { FIELD_LABEL, QUANTITY_LABEL, fieldInput } from './labels.ts';

/** What {@link FieldsAnswer} needs. */
export interface FieldsAnswerProps {
  /** The question, for the boxes it asks for. */
  readonly exercise: CountExercise | SpaceGroupFactsExercise;
  /** What is in each box, keyed as the validator keys it. */
  readonly value: Readonly<Record<string, string>>;
  /** Called with the whole record on every keystroke. */
  readonly onChange: (value: Readonly<Record<string, string>>) => void;
}

/**
 * The boxes of a counting or a fact-reading question.
 * @param props - See {@link FieldsAnswerProps}.
 * @returns The form.
 */
export function FieldsAnswer(props: FieldsAnswerProps): ReactElement {
  const { exercise, value, onChange } = props;
  const write = (key: string, entry: string): void => {
    onChange({ ...value, [key]: entry });
  };

  return (
    <div className="answer-fields">
      {exercise.kind === 'count'
        ? exercise.asked.map((quantity) => (
            <label key={quantity} className="answer-field">
              <span className="answer-field__label">
                {QUANTITY_LABEL[quantity]}
              </span>
              <InputGroup
                type="number"
                value={value[quantity] ?? ''}
                placeholder="a whole number"
                onValueChange={(entry) => {
                  write(quantity, entry);
                }}
              />
            </label>
          ))
        : exercise.asked.map((field) => (
            <label key={field} className="answer-field">
              <span className="answer-field__label">{FIELD_LABEL[field]}</span>
              <FactInput
                field={field}
                value={value[field] ?? ''}
                onChange={(entry) => {
                  write(field, entry);
                }}
              />
            </label>
          ))}
    </div>
  );
}

function FactInput(props: {
  readonly field: SpaceGroupFactsExercise['asked'][number];
  readonly value: string;
  readonly onChange: (value: string) => void;
}): ReactElement {
  const { field, value, onChange } = props;
  const input = fieldInput(field);
  if (input.kind === 'choice') {
    return (
      <HTMLSelect
        value={value}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
      >
        <option value="">choose…</option>
        {input.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </HTMLSelect>
    );
  }
  return (
    <InputGroup
      type={input.kind === 'number' ? 'number' : 'text'}
      value={value}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      autoComplete="off"
      placeholder={input.kind === 'number' ? 'a whole number' : 'e.g. 2/m'}
      onValueChange={onChange}
    />
  );
}
