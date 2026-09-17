/**
 * One question: what it asks, what is looked at, what is written, and what the
 * marking says.
 *
 * The answer is marked on every keystroke and *Check* commits the attempt, so
 * the test list is live and the status is deliberate. Nothing is withheld: the
 * hints open one at a time and the solution is always one click away, because
 * getting stuck and reading the answer is part of how the intuition is built.
 */

import { Button, Callout, Card, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import type { ValidationResult } from 'react-cheminfo/core';
import { failedValidation } from 'react-cheminfo/core';
import {
  ExerciseActions,
  ExerciseLevelTag,
  GlossaryText,
  HintLadder,
  PagePart,
} from 'react-cheminfo/ui';

import type { Exercise } from '../../data/exercises/types.ts';
import {
  getExerciseProgress,
  resetExercise,
  revealNextHint,
  setExerciseStatus,
  setShowSolution,
} from '../../state/index.ts';
import type { ExerciseAnswer } from '../../symmetry/validate.ts';
import { validateExercise } from '../../symmetry/validate.ts';

import { AnswerInput } from './AnswerInput.tsx';
import { ExerciseFigure } from './ExerciseFigure.tsx';
import { ExerciseVerdict } from './ExerciseVerdict.tsx';
import {
  answerIsBlank,
  clearDraft,
  readDraft,
  writeDraft,
} from './answerState.ts';
import { hasFigure } from './figureSubject.ts';
import { KIND_LABEL } from './labels.ts';

/** What {@link ExerciseCard} needs. */
export interface ExerciseCardProps {
  /** The question on screen. Give the card `key={exercise.id}`. */
  readonly exercise: Exercise;
}

/**
 * The open question, its form, and its marking.
 * @param props - See {@link ExerciseCardProps}.
 * @returns The card.
 */
export function ExerciseCard(props: ExerciseCardProps): ReactElement {
  useSignals();
  const { exercise } = props;
  const [answer, setAnswer] = useState(() => readDraft(exercise));
  const [diagram, setDiagram] = useState(false);
  const progress = getExerciseProgress(exercise.id);
  const result = useMemo(() => mark(exercise, answer), [exercise, answer]);
  const blank = answerIsBlank(answer);
  const attempted = progress.status !== 'idle';

  const write = (next: ExerciseAnswer): void => {
    setAnswer(next);
    writeDraft(exercise.id, next);
  };

  return (
    <Card className="exercise-card">
      <div className="exercise-card__heading">
        <h1>{exercise.title}</h1>
        <ExerciseLevelTag level={exercise.level} />
        <Tag minimal round>
          {KIND_LABEL[exercise.kind]}
        </Tag>
      </div>

      <p className="exercise-card__prose">
        <GlossaryText text={exercise.description} />
      </p>

      <ExerciseFigure exercise={exercise} detail={diagram} />

      <AnswerInput exercise={exercise} answer={answer} onChange={write} />

      <ExerciseActions
        checkDisabled={blank}
        hintsRevealed={progress.hintsRevealed}
        hintCount={exercise.hints.length}
        showSolution={progress.showSolution}
        onCheck={() => {
          setExerciseStatus(
            exercise.id,
            result.passed ? 'solved' : 'attempted',
          );
        }}
        onRevealHint={() => {
          revealNextHint(exercise.id, exercise.hints.length);
        }}
        onToggleSolution={() => {
          setShowSolution(exercise.id, !progress.showSolution);
        }}
        onReset={() => {
          clearDraft(exercise.id);
          resetExercise(exercise.id);
          setAnswer(readDraft(exercise));
          setDiagram(false);
        }}
      >
        {hasFigure(exercise) && (
          <Button
            icon={diagram ? 'eye-off' : 'diagram-tree'}
            text={diagram ? 'Hide diagram' : 'Show diagram'}
            onClick={() => {
              setDiagram(!diagram);
            }}
          />
        )}
      </ExerciseActions>

      <PagePart part="hints">
        <HintLadder hints={exercise.hints} revealed={progress.hintsRevealed} />
      </PagePart>

      <ExerciseVerdict
        result={result}
        attempted={attempted}
        blank={blank}
        solution={exercise.solution}
      />

      {progress.showSolution && (
        <PagePart part="solution">
          <Callout intent="warning" icon="key" title="One answer">
            <GlossaryText text={exercise.solution} />
          </Callout>
        </PagePart>
      )}
    </Card>
  );
}

/** Mark the answer, and report a thrown engine error rather than blanking. */
function mark(exercise: Exercise, answer: ExerciseAnswer): ValidationResult {
  try {
    return validateExercise(exercise, answer);
  } catch (error) {
    return failedValidation(
      error instanceof Error ? error.message : 'This answer cannot be marked.',
    );
  }
}
