/**
 * The assignment tree, walked one question at a time.
 *
 * A student who reads the answer straight off the detector has learned a tool;
 * a student who answers six questions and is shown the count behind each answer
 * has learned to assign a point group without one. So the questions come one at
 * a time, and each is answered with a number the student can go and check on
 * the structure beside it.
 */

import { Button, Tag } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { Prose } from './Prose.tsx';
import { SymbolText } from './SymbolText.tsx';
import type { FlowStep } from './assignment.ts';

import './molecules.css';

/** Props of {@link FlowchartPanel}. */
export interface FlowchartPanelProps {
  /** The questions this molecule takes, in order. */
  readonly steps: readonly FlowStep[];
  /** Where the walk arrives, as the catalogue writes it. */
  readonly group: string;
}

/**
 * The walk.
 *
 * Mount it with the molecule's id as `key`, so changing the molecule starts the
 * walk again rather than carrying six revealed answers onto a new structure.
 * @param props - See {@link FlowchartPanelProps}.
 * @returns The questions answered so far, the open one, and the group.
 */
export function FlowchartPanel(props: FlowchartPanelProps): ReactElement {
  const { steps, group } = props;
  const [picks, setPicks] = useState<ReadonlyArray<boolean | null>>([]);
  const open = picks.length < steps.length ? steps[picks.length] : undefined;

  function answer(pick: boolean | null): void {
    setPicks([...picks, pick]);
  }

  return (
    <div className="mol-flow">
      {steps.slice(0, picks.length).map((step, index) => (
        <AnsweredStep
          key={step.id}
          step={step}
          number={index + 1}
          pick={picks[index] ?? null}
        />
      ))}
      {open !== undefined && (
        <div className="mol-flow__step">
          <div className="mol-flow__number">{picks.length + 1}</div>
          <div className="mol-flow__body">
            <div className="mol-flow__question">
              <Prose text={open.question} />
            </div>
            <div className="mol-flow__hint">{open.hint}</div>
            <div className="mol-flow__answer">
              <Button
                size="small"
                text="Yes"
                onClick={() => {
                  answer(true);
                }}
              />
              <Button
                size="small"
                text="No"
                onClick={() => {
                  answer(false);
                }}
              />
              <Button
                size="small"
                variant="minimal"
                text="Show me"
                onClick={() => {
                  answer(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
      {open === undefined && (
        <div className="mol-flow__step">
          <div className="mol-flow__number">→</div>
          <div className="mol-flow__body">
            <div className="mol-flow__question">
              Six questions or fewer, and the group is{' '}
              <SymbolText symbol={group} />.
            </div>
            <div>
              <Button
                size="small"
                variant="minimal"
                icon="reset"
                text="Walk it again"
                onClick={() => {
                  setPicks([]);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** One question the walk has passed, with what the molecule answered. */
function AnsweredStep(props: {
  step: FlowStep;
  number: number;
  pick: boolean | null;
}): ReactElement {
  const { step, number, pick } = props;
  return (
    <div className="mol-flow__step">
      <div className="mol-flow__number">{number}</div>
      <div className="mol-flow__body">
        <div className="mol-flow__question">
          <Prose text={step.question} />
        </div>
        <div className="mol-flow__answer">
          <Tag intent={step.answer ? 'primary' : 'none'} minimal>
            {step.answer ? 'Yes' : 'No'}
          </Tag>
          <span className="mol-flow__evidence">{step.evidence}</span>
        </div>
        {pick !== null && pick !== step.answer && (
          <div className="mol-flow__hint">
            You chose {pick ? 'yes' : 'no'}. {step.hint}
          </div>
        )}
      </div>
    </div>
  );
}
