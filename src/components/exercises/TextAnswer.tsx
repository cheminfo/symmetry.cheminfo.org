/**
 * A single typed symbol: a Schoenflies name, or a plane-group name.
 *
 * Spelling is the validator's problem, not the student's — `D∞h`, `Dinfh` and
 * `D*h` all mark the same, and so do `p4mm` and `*442` — so the field accepts
 * whatever is typed and says under it what else it would have taken.
 */

import { InputGroup } from '@blueprintjs/core';
import type { ReactElement } from 'react';

/** What {@link TextAnswer} needs. */
export interface TextAnswerProps {
  /** What is in the box. */
  readonly value: string;
  /** Called with the new text on every keystroke. */
  readonly onChange: (value: string) => void;
  /** What the box is asking for. */
  readonly label: string;
  /** An example of an accepted spelling. */
  readonly placeholder: string;
  /** The other spellings that mark the same, in one clause. */
  readonly accepts: string;
}

/**
 * One box, marked as it is typed.
 * @param props - See {@link TextAnswerProps}.
 * @returns The field and the line under it.
 */
export function TextAnswer(props: TextAnswerProps): ReactElement {
  const { value, onChange, label, placeholder, accepts } = props;

  return (
    <label className="answer-field">
      <span className="answer-field__label">{label}</span>
      <InputGroup
        size="large"
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        onValueChange={onChange}
      />
      <span className="answer-field__hint">{accepts}</span>
    </label>
  );
}
