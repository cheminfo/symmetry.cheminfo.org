/**
 * The addresses a tutorial step and an exercise take, ready to wire.
 *
 * A step and an exercise each get an address of their own, because each is
 * something somebody searches for: the summary is one sentence written for a
 * search result, never the several-sentence description the page itself shows.
 * {@link LessonEntry} is the shape `src/seo/routes.ts` maps its data onto.
 */

import type { RouteMeta } from 'react-cheminfo/core';

import { describe } from './describe.ts';

/** What a route needs from one tutorial step or one exercise. */
export interface LessonEntry {
  /** The id the address already carries: `/tutorial/<id>`, `/exercises/<id>`. */
  readonly id: string;
  /** The step's or exercise's own name, as the page heads it. */
  readonly title: string;
  /**
   * One sentence saying what the reader does here, written for a search result
   * rather than copied from a description of several sentences.
   */
  readonly summary: string;
}

/** `/tutorial/<stepId>` for every step, in the order the tour walks them. */
export function tutorialRoutes(
  steps: readonly LessonEntry[],
): readonly RouteMeta[] {
  return steps.map((step, index) => ({
    path: `/tutorial/${step.id}`,
    // The step's own name, and nothing appended: the longest of them is 53
    // characters, and a search result cuts a title at about 60 before the
    // site name is even added. Which step it is, the description says.
    title: step.title,
    description: describe(step.summary, [
      [
        `Step ${index + 1} of ${steps.length} of the symmetry tutorial, worked in a live 3D view.`,
        `Step ${index + 1} of ${steps.length} of the symmetry tutorial.`,
      ],
      [
        'Change any of it and the view follows, so the step is a playground too.',
        'Change any of it and the view follows.',
      ],
    ]),
    short: step.title,
  }));
}

/** `/exercises/<id>` for every exercise, in the order the list offers them. */
export function exerciseRoutes(
  exercises: readonly LessonEntry[],
): readonly RouteMeta[] {
  return exercises.map((exercise, index) => ({
    path: `/exercises/${exercise.id}`,
    title: `${exercise.title} — symmetry exercise ${index + 1}`,
    description: describe(exercise.summary, [
      [
        `Exercise ${index + 1} of ${exercises.length}, checked as you type, with hints and an answer you can reveal.`,
        `Exercise ${index + 1} of ${exercises.length}, checked as you type.`,
      ],
      ['Every test case says what it got and what it expected.'],
    ]),
    short: exercise.title,
  }));
}
