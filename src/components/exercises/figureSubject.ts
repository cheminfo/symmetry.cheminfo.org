/**
 * What a question is a picture of.
 *
 * The nine kinds name their object in five different ways — a molecule id, an
 * object reference, a pattern, a space-group number — so the page asks here
 * rather than switching on the kind in three places.
 */

import type { Exercise } from '../../data/exercises/types.ts';
import { splitObjectRef } from '../../data/glossary/types.ts';

/** Whether the question has anything to show behind *Show diagram*. */
export function hasFigure(exercise: Exercise): boolean {
  return (
    moleculeOf(exercise) !== null ||
    exercise.kind === 'identify-plane-group' ||
    spaceGroupOf(exercise) !== null
  );
}

/** The library molecule a question is about, when it is about one. */
export function moleculeOf(exercise: Exercise): string | null {
  if (exercise.kind === 'assign-point-group') return exercise.molecule;
  if (exercise.kind !== 'select' && exercise.kind !== 'count') return null;
  const { kind, id } = splitObjectRef(exercise.object);
  return kind === 'molecule' ? id : null;
}

/** The space group a question is about, when it is about one. */
export function spaceGroupOf(exercise: Exercise): number | null {
  if (exercise.kind === 'space-group-facts' || exercise.kind === 'place-atom') {
    return exercise.spaceGroupNumber;
  }
  if (exercise.kind !== 'select' && exercise.kind !== 'count') return null;
  const { kind, id } = splitObjectRef(exercise.object);
  return kind === 'spaceGroup' ? Number(id) : null;
}

/** One empty list, so a question naming no layer does not rebuild the scene. */
export const NO_LAYERS: readonly string[] = [];
