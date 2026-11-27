/**
 * The site's glossary, and what an example of it does when clicked.
 *
 * An example here is not a line of code: it is an object and what to look at in
 * it, so the definition of a glide plane opens the group that has one. The
 * shell wraps every page in this once, so every `[[term]]` and every `{{CO2}}`
 * under it resolves — a step, an exercise statement, a revealed hint, a
 * cheatsheet line.
 */

import { Button } from '@blueprintjs/core';
import type { ReactElement, ReactNode } from 'react';
import { GlossaryProvider, InlineText } from 'react-cheminfo/ui';

import { GLOSSARY } from '../../data/glossary/index.ts';
import type { SymmetryExample } from '../../data/glossary/types.ts';
import { renderMf } from '../shared/prose.tsx';

import { openObject } from './stepState.ts';

/** What {@link SymmetryGlossary} needs. */
export interface SymmetryGlossaryProps {
  /** The part of the page whose prose resolves its markers. */
  readonly children: ReactNode;
}

/**
 * Hand the site's glossary to every piece of prose below.
 * @param props - See {@link SymmetryGlossaryProps}.
 * @returns The tree, with the terms in reach.
 */
export function SymmetryGlossary(props: SymmetryGlossaryProps): ReactElement {
  const { children } = props;

  return (
    <GlossaryProvider
      glossary={GLOSSARY}
      renderExample={renderExample}
      renderMf={renderMf}
    >
      {children}
    </GlossaryProvider>
  );
}

/** One example: what to look at, and the button that opens it. */
function renderExample(example: SymmetryExample): ReactNode {
  return (
    <div className="glossary-example">
      <span>
        <InlineText text={example.observation} />
      </span>
      {example.note !== undefined && (
        <span className="glossary-example__note">
          <InlineText text={example.note} />
        </span>
      )}
      <Button
        size="small"
        variant="minimal"
        icon="share"
        text="Open it"
        onClick={() => {
          openObject(example.object);
        }}
      />
    </div>
  );
}
