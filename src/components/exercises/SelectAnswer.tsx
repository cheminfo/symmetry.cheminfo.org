/**
 * Tick exactly the members of a set.
 *
 * Every box is marked, ticked or not: leaving a member out is as wrong as
 * ticking something that does not belong, and a form that only checked the
 * ticks would pass a student who ticked everything.
 */

import { Checkbox } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import type { SelectExercise } from '../../data/exercises/types.ts';

/** What {@link SelectAnswer} needs. */
export interface SelectAnswerProps {
  /** The question, for the checkboxes it offers. */
  readonly exercise: SelectExercise;
  /** The ids ticked so far. */
  readonly value: readonly string[];
  /** Called with the new set. */
  readonly onChange: (value: readonly string[]) => void;
}

/**
 * One checkbox per offered item.
 * @param props - See {@link SelectAnswerProps}.
 * @returns The list of checkboxes.
 */
export function SelectAnswer(props: SelectAnswerProps): ReactElement {
  const { exercise, value, onChange } = props;
  const ticked = new Set(value);

  return (
    <div className="answer-checks">
      {exercise.offered.map((option) => (
        <Checkbox
          key={option.id}
          checked={ticked.has(option.id)}
          label={option.label ?? option.id}
          onChange={() => {
            onChange(toggle(value, option.id));
          }}
        />
      ))}
    </div>
  );
}

/** The set with one item added or removed, in the order it was offered. */
function toggle(value: readonly string[], id: string): string[] {
  return value.includes(id)
    ? value.filter((entry) => entry !== id)
    : [...value, id];
}
