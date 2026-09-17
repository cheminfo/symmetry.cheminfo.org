/**
 * The exercises: a deck on the left, the open question on the right.
 *
 * The address carries the question's id, so `/exercises/ops-of-water` is what a
 * teacher hands out and what the back button returns to. An id nobody minted
 * opens the list rather than an error — a link from a course made two years ago
 * must still land somewhere useful.
 */

import { Callout } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { PagePart } from 'react-cheminfo/ui';

import { ExerciseCard, ExerciseDeck } from '../components/exercises/index.ts';
import { SymmetryGlossary } from '../components/tutorial/index.ts';
import { EXERCISES, exerciseById } from '../data/exercises/index.ts';
import { setActiveExercise, state } from '../state/index.ts';

/**
 * The exercise page.
 * @returns The deck and the open question.
 */
export function Exercises(): ReactElement {
  useSignals();
  const activeId = state.view.exercises.activeId.value;
  const exercise = activeId === null ? undefined : exerciseById(activeId);

  return (
    <SymmetryGlossary>
      <section className="exercises-layout">
        <PagePart part="list">
          <div className="exercises-sidebar">
            <ExerciseDeck
              activeId={exercise?.id ?? null}
              onSelect={setActiveExercise}
            />
          </div>
        </PagePart>

        <div className="exercises-open">
          {exercise === undefined ? (
            <Callout intent="primary" icon="properties" title="Pick a question">
              {`${EXERCISES.length} questions, easiest first. Each one is marked against the engine rather than against a stored answer, so several right answers are all right.`}
            </Callout>
          ) : (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          )}
        </div>
      </section>
    </SymmetryGlossary>
  );
}
