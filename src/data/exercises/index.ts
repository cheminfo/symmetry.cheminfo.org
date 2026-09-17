/**
 * The checked exercises.
 *
 * Nothing here is marked by comparing a string to a string: every answer is run
 * against the engine that derives it, and `src/data/__tests__/content.test.ts`
 * holds the authored values to what that engine says.
 *
 * The files are split by what the question asks for, because that is what the
 * validator and the page both switch on. The list below is then sorted by
 * level, so the Exercises page reads green, amber, pink whatever order the
 * files happen to be in.
 */

import type { ExerciseLevel } from 'react-cheminfo/core';

import { ASSIGNMENT_EXERCISES } from './assignments.ts';
import { CHARACTER_EXERCISES } from './characters.ts';
import { COUNT_EXERCISES } from './counts.ts';
import { CRYSTAL_EXERCISES } from './crystals.ts';
import { OPERATION_EXERCISES } from './operations.ts';
import { PATTERN_EXERCISES } from './patterns.ts';
import { SPACE_GROUP_FACT_EXERCISES } from './spaceGroupFacts.ts';
import type { Exercise } from './types.ts';

export type * from './types.ts';
export { ASSIGNMENT_EXERCISES } from './assignments.ts';
export { CHARACTER_EXERCISES } from './characters.ts';
export { COUNT_EXERCISES } from './counts.ts';
export { CRYSTAL_EXERCISES } from './crystals.ts';
export { OPERATION_EXERCISES } from './operations.ts';
export { PATTERN_EXERCISES } from './patterns.ts';
export { SPACE_GROUP_FACT_EXERCISES } from './spaceGroupFacts.ts';

/** Green, then amber, then pink. */
const LEVEL_RANK: Record<ExerciseLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

/** Every question, in the order the files list them. */
const ALL: readonly Exercise[] = [
  ...ASSIGNMENT_EXERCISES,
  ...OPERATION_EXERCISES,
  ...COUNT_EXERCISES,
  ...CHARACTER_EXERCISES,
  ...PATTERN_EXERCISES,
  ...SPACE_GROUP_FACT_EXERCISES,
  ...CRYSTAL_EXERCISES,
];

/** Every question the site asks, easiest first. */
export const EXERCISES: readonly Exercise[] = ALL.toSorted(
  (one, other) => LEVEL_RANK[one.level] - LEVEL_RANK[other.level],
);

const BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));

/** The exercise an address names, or `undefined` for an id nobody minted. */
export function exerciseById(id: string): Exercise | undefined {
  return BY_ID.get(id);
}

/** The exercises of one level, in order. */
export function exercisesOfLevel(level: ExerciseLevel): readonly Exercise[] {
  return EXERCISES.filter((exercise) => exercise.level === level);
}
