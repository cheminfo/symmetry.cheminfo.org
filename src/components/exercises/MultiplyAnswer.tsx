/**
 * One product per row: apply the right operation first, then the left one.
 *
 * The order is written above the rows because it is the half of the question
 * students get wrong, and the marking composes the matrices rather than
 * comparing names — so `C3⁻¹` where the table prints `C3²` is right.
 */

import { HTMLSelect } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import type { MultiplyExercise } from '../../data/exercises/types.ts';

/** What {@link MultiplyAnswer} needs. */
export interface MultiplyAnswerProps {
  /** The question, for the products and the operations it offers. */
  readonly exercise: MultiplyExercise;
  /** One answer per product, in order; an empty string is unanswered. */
  readonly value: readonly string[];
  /** Called with the new list. */
  readonly onChange: (value: readonly string[]) => void;
}

/**
 * A row per product, each with the group's operations to choose from.
 * @param props - See {@link MultiplyAnswerProps}.
 * @returns The rows.
 */
export function MultiplyAnswer(props: MultiplyAnswerProps): ReactElement {
  const { exercise, value, onChange } = props;

  return (
    <div className="answer-products">
      <p className="answer-products__order">
        {`Each row reads a ∘ b: apply b first, then a, in ${exercise.pointGroup}.`}
      </p>
      {exercise.products.map((product, index) => (
        <div key={`${product.a}-${product.b}`} className="answer-products__row">
          <span className="answer-products__term">
            {`${product.a} ∘ ${product.b} =`}
          </span>
          <HTMLSelect
            value={value[index] ?? ''}
            onChange={(event) => {
              onChange(replace(value, index, event.currentTarget.value));
            }}
          >
            <option value="">choose…</option>
            {exercise.offered.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </HTMLSelect>
        </div>
      ))}
    </div>
  );
}

/** The list with one entry replaced, keeping the length the products need. */
function replace(
  value: readonly string[],
  index: number,
  entry: string,
): string[] {
  const next = [...value];
  while (next.length <= index) next.push('');
  next[index] = entry;
  return next;
}
