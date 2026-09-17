/**
 * The deck: how far the student is, and every question with where they stand
 * on it.
 *
 * The hint count is shown rather than hidden. It is not a mark against anybody
 * — it is the honest record of which questions were hard, which is exactly what
 * a student revisiting the list a week later wants to know.
 */

import { Card, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { progressSummary } from 'react-cheminfo/core';
import {
  ExerciseLevelTag,
  ExerciseProgressHeader,
  ExerciseStatusIcon,
  useListKeyboardNavigation,
} from 'react-cheminfo/ui';

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
  const records = state.preferences.exercises.progress.value;
  const summary = progressSummary(
    records,
    EXERCISES.map((exercise) => exercise.id),
  );
  const activeIndex = EXERCISES.findIndex(
    (exercise) => exercise.id === activeId,
  );
  const onKeyDown = useListKeyboardNavigation({
    length: EXERCISES.length,
    selectedIndex: activeIndex,
    onSelect: (index) => {
      const next = EXERCISES[index];
      if (next !== undefined) onSelect(next.id);
    },
  });

  return (
    <Card compact className="exercise-deck">
      <ExerciseProgressHeader
        summary={summary}
        clearDisabled={Object.keys(records).length === 0}
        clearWarning="This forgets every answer, every revealed hint and every solved question, on this browser. There is no undo."
        onClearAll={() => {
          clearAllProgress();
          clearAllDrafts();
        }}
      />

      <div
        className="exercise-deck__list"
        tabIndex={0}
        role="listbox"
        aria-label="Exercises"
        onKeyDown={onKeyDown}
      >
        {EXERCISES.map((exercise) => {
          const progress = records[exercise.id];
          const status = progress?.status ?? 'idle';
          const hints = progress?.hintsRevealed ?? 0;
          const active = exercise.id === activeId;
          return (
            <button
              key={exercise.id}
              type="button"
              role="option"
              aria-selected={active}
              data-selected={active ? 'true' : undefined}
              className={
                active
                  ? 'exercise-deck__item exercise-deck__item--active'
                  : 'exercise-deck__item'
              }
              onClick={() => {
                onSelect(exercise.id);
              }}
            >
              <ExerciseStatusIcon
                status={status}
                title={STATUS_TITLE[status]}
              />
              <span className="exercise-deck__title">{exercise.title}</span>
              <ExerciseLevelTag level={exercise.level} active={active} />
              <Tag minimal round>
                {KIND_LABEL[exercise.kind]}
              </Tag>
              {status === 'solved' && hints > 0 && (
                <Tag minimal round intent="success">
                  {`Solved with ${hints} hint${hints === 1 ? '' : 's'}`}
                </Tag>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/** What the status icon says to a pointer and to a screen reader. */
const STATUS_TITLE = {
  idle: 'not started',
  attempted: 'handed in, not right yet',
  solved: 'right',
} as const;
