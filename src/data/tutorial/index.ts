/**
 * The guided tour: eighteen steps in three coloured strips.
 *
 * A step is addressed by its **id**, never by its number — `/tutorial/bravais`
 * survives a step being inserted before it, and a link handed out in a course
 * outlives our editing.
 */

import type { ExerciseLevel } from 'react-cheminfo/core';

import { ADVANCED_STEPS } from './advanced.ts';
import { BEGINNER_STEPS } from './beginner.ts';
import { INTERMEDIATE_STEPS } from './intermediate.ts';
import type { TutorialStep } from './types.ts';

export type { TutorialPanel, TutorialStep } from './types.ts';

/** What each coloured strip is called. */
export const TUTORIAL_LEVEL_LABELS: Record<ExerciseLevel, string> = {
  beginner: 'Operations, elements and point groups',
  intermediate: 'Characters, and what they predict',
  advanced: 'Lattices, plane groups, space groups',
};

/** Every step, in teaching order. */
export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  ...BEGINNER_STEPS,
  ...INTERMEDIATE_STEPS,
  ...ADVANCED_STEPS,
];

const BY_ID = new Map(TUTORIAL_STEPS.map((step) => [step.id, step]));

/** The step an address names, or `undefined` for an id nobody minted. */
export function tutorialStepById(id: string): TutorialStep | undefined {
  return BY_ID.get(id);
}

/** Where a step sits in the tour, from 0, or −1 when there is no such step. */
export function tutorialStepIndex(id: string): number {
  return TUTORIAL_STEPS.findIndex((step) => step.id === id);
}

/** The steps of one coloured strip. */
export function tutorialStepsOfLevel(
  level: ExerciseLevel,
): readonly TutorialStep[] {
  return TUTORIAL_STEPS.filter((step) => step.level === level);
}
