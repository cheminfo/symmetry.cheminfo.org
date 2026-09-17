/**
 * What a step says: its heading, its paragraph, and the one line telling the
 * student what to look at.
 *
 * The prose carries `[[term]]` markers and is rendered through the shared
 * glossary, so a word a first-year has not met is hoverable here exactly as it
 * is in a hint or an exercise.
 */

import { Callout } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { ExerciseLevelTag, GlossaryText } from 'react-cheminfo/ui';

import type { TutorialStep } from '../../data/tutorial/index.ts';
import { TUTORIAL_LEVEL_LABELS } from '../../data/tutorial/index.ts';

/** What {@link StepText} needs. */
export interface StepTextProps {
  /** The step on screen. */
  readonly step: TutorialStep;
  /** Where it sits in the tour, from 1. */
  readonly position: number;
  /** How many steps there are. */
  readonly total: number;
}

/**
 * The heading, the paragraph and the observation of one step.
 * @param props - See {@link StepTextProps}.
 * @returns The prose of the step.
 */
export function StepText(props: StepTextProps): ReactElement {
  const { step, position, total } = props;

  return (
    <div className="step-text">
      <div className="step-text__heading">
        <h1>{step.title}</h1>
        <ExerciseLevelTag
          level={step.level}
          label={TUTORIAL_LEVEL_LABELS[step.level]}
        />
        <span className="step-text__position">{`Step ${position} of ${total}`}</span>
      </div>

      <p className="step-text__prose">
        <GlossaryText text={step.description} />
      </p>

      <Callout intent="primary" icon="eye-open" title="Look for">
        <GlossaryText text={step.observe} />
      </Callout>
    </div>
  );
}
