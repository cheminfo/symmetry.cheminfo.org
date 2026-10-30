/**
 * The deck: how far the student is, and every question with where they stand
 * on it — the family's exercise list, fed this site's progress and the kind of
 * each question.
 */

import { Card, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { ExerciseList } from 'react-cheminfo/ui';

import { EXERCISES } from '../../data/exercises/index.ts';
import { clearAllProgress, state } from '../../state/index.ts';

import { clearAllDrafts } from './answerState.ts';
import { KIND_LABEL } from './labels.ts';

/** What {@link ExerciseDeck} needs. */
export interface ExerciseDeckProps {
  /** The exercise on screen, or `null` for none. */
  readonly activeId: string | null;
  /** Called with the id of the exercise to open. */
  readonly onSelect: (id: string) => void;
}

/**
 * The progress bar and the list of questions.
 * @param props - See {@link ExerciseDeckProps}.
 * @returns The deck.
 */
export function ExerciseDeck(props: ExerciseDeckProps): ReactElement {
  useSignals();
  const { activeId, onSelect } = props;

  return (
    <Card compact>
      <ExerciseList
        exercises={EXERCISES}
        progress={state.preferences.exercises.progress.value}
        activeId={activeId}
        onSelect={onSelect}
        tags={(exercise) => (
          <Tag minimal round>
            {KIND_LABEL[exercise.kind]}
          </Tag>
        )}
        clearWarning="This forgets every answer, every revealed hint and every solved question, on this browser. There is no undo."
        onClearAll={() => {
          clearAllProgress();
          clearAllDrafts();
        }}
      />
    </Card>
  );
}
