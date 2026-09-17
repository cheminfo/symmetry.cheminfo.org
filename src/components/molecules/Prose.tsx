/**
 * Authored prose, with its jargon hoverable.
 *
 * The questions of the assignment tree link terms like `[[principal axis]]`,
 * and a student meeting one for the first time must be able to read what it
 * means without leaving the question.
 */

import type { ReactElement, ReactNode } from 'react';
import { GlossaryText } from 'react-cheminfo/ui';

import type { SymmetryExample } from '../../data/glossary/index.ts';
import { GLOSSARY, splitObjectRef } from '../../data/glossary/index.ts';

/** Props of {@link Prose}. */
export interface ProseProps {
  /** The sentence, with its `[[markers]]`. */
  readonly text: string;
}

/**
 * One line of prose.
 * @param props - See {@link ProseProps}.
 * @returns The prose, with every term this site defines made hoverable.
 */
export function Prose(props: ProseProps): ReactElement {
  return (
    <GlossaryText<SymmetryExample>
      text={props.text}
      glossary={GLOSSARY}
      renderExample={renderExample}
    />
  );
}

/** An example of this site is an object and what to look at in it. */
function renderExample(example: SymmetryExample): ReactNode {
  return (
    <span>
      <strong>{splitObjectRef(example.object).id}</strong> —{' '}
      {example.observation}
    </span>
  );
}
