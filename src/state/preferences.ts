/**
 * Everything the student chose that must survive a reload: which layers are
 * drawn, which notation names them, and how far they got in the exercises.
 *
 * Two persisted buckets, two versioned keys — display settings are cheap and
 * change constantly, exercise progress is precious and changes rarely, and a
 * corrupt payload in one must not take the other down with it.
 */

import type { Signal } from '@preact/signals-react';
import { signal } from '@preact/signals-react';
import type { ExerciseStatus } from 'react-cheminfo/core';

import type { DisplayFlagKey } from './displayFlags.ts';
import { DISPLAY_FLAGS } from './displayFlags.ts';
import { persistBucket } from './persist.ts';

/** How a symmetry element is named on screen. */
export type Notation = 'schoenflies' | 'hermann-mauguin';

/** How far a student got on one exercise. */
export type { ExerciseStatus } from 'react-cheminfo/core';

/** Per-exercise progress, stored under `symmetry:exercises:v1`. */
export interface ExerciseProgress {
  status: ExerciseStatus;
  /** How many hints were revealed, kept as an honest difficulty signal. */
  hintsRevealed: number;
  showSolution: boolean;
}

const display = persistBucket('symmetry:preferences', {
  /**
   * Schoenflies by default: it is what a molecule is named in, and it is what a
   * first course meets first. The crystal workbench offers the other one.
   */
  notation: signal<Notation>('schoenflies'),
  /**
   * One signal per layer, so a chip re-renders only its own consumers. Built
   * from {@link DISPLAY_FLAGS} so the chip bar and the stored defaults cannot
   * name two different sets.
   */
  flags: defaultFlags(),
});

const exercises = persistBucket('symmetry:exercises', {
  /** Progress by exercise id. Absent ids read as {@link defaultProgress}. */
  progress: signal<Record<string, ExerciseProgress>>({}),
});

/** The `preferences` bucket: plain object, signal leaves, never reassigned. */
export const preferences = { ...display, exercises };

/**
 * Flip one layer.
 * @param key - Layer to flip.
 */
export function toggleDisplayFlag(key: DisplayFlagKey): void {
  const flag = preferences.flags[key];
  flag.value = !flag.value;
}

/**
 * Force one layer, e.g. when a tutorial step or a shared link asks for it.
 * @param key - Layer to set.
 * @param value - Its new state.
 */
export function setDisplayFlag(key: DisplayFlagKey, value: boolean): void {
  preferences.flags[key].value = value;
}

/**
 * Name the symmetry elements the other way.
 * @param notation - Which naming to use.
 */
export function setNotation(notation: Notation): void {
  preferences.notation.value = notation;
}

/**
 * Read one exercise's progress, defaults included.
 *
 * Reads the signal, so a component calling it re-renders when progress moves.
 * @param id - Exercise id.
 * @returns Its progress, or a fresh default when it has not been touched.
 */
export function getExerciseProgress(id: string): ExerciseProgress {
  return { ...defaultProgress(), ...preferences.exercises.progress.value[id] };
}

/**
 * Record an attempt or a success.
 * @param id - Exercise id.
 * @param status - New status.
 */
export function setExerciseStatus(id: string, status: ExerciseStatus): void {
  updateProgress(id, { status });
}

/**
 * Reveal the next hint of an exercise, one at a time.
 * @param id - Exercise id.
 * @param hintCount - How many hints it has, to stop at the last one.
 * Unbounded when omitted.
 */
export function revealNextHint(id: string, hintCount?: number): void {
  const revealed = getExerciseProgress(id).hintsRevealed + 1;
  updateProgress(id, {
    hintsRevealed:
      hintCount === undefined ? revealed : Math.min(revealed, hintCount),
  });
}

/**
 * Show or hide the sample answer.
 * @param id - Exercise id.
 * @param show - Whether the solution is visible.
 */
export function setShowSolution(id: string, show: boolean): void {
  updateProgress(id, { showSolution: show });
}

/**
 * Forget one exercise: status, hints and revealed solution.
 * @param id - Exercise id.
 */
export function resetExercise(id: string): void {
  const next: Record<string, ExerciseProgress> = {};
  for (const [key, value] of Object.entries(
    preferences.exercises.progress.value,
  )) {
    if (key !== id) next[key] = value;
  }
  preferences.exercises.progress.value = next;
}

/**
 * Forget every exercise. The UI puts this behind a confirmation dialog,
 * because it wipes a week of a student's work.
 */
export function clearAllProgress(): void {
  preferences.exercises.progress.value = {};
}

function updateProgress(id: string, patch: Partial<ExerciseProgress>): void {
  preferences.exercises.progress.value = {
    ...preferences.exercises.progress.value,
    [id]: { ...getExerciseProgress(id), ...patch },
  };
}

function defaultProgress(): ExerciseProgress {
  return { status: 'idle', hintsRevealed: 0, showSolution: false };
}

function defaultFlags(): Record<DisplayFlagKey, Signal<boolean>> {
  const flags: Partial<Record<DisplayFlagKey, Signal<boolean>>> = {};
  for (const meta of DISPLAY_FLAGS) {
    flags[meta.key] = signal(meta.initial);
  }
  return flags as Record<DisplayFlagKey, Signal<boolean>>;
}
