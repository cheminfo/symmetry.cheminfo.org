/**
 * Everything the student chose that must survive a reload: which layers are
 * drawn, which notation names them, and how far they got in the exercises.
 *
 * Two persisted buckets, two versioned keys — display settings are cheap and
 * change constantly, exercise progress is precious and changes rarely, and a
 * corrupt payload in one must not take the other down with it.
 */

import type { Signal } from '@preact/signals-react';
import { effect, signal } from '@preact/signals-react';
import type { ExerciseStatus } from 'react-cheminfo/core';
import {
  createProgressController,
  persistSignalBucket,
} from 'react-cheminfo/core';

import type { DisplayFlagKey } from './displayFlags.ts';
import { DISPLAY_FLAGS } from './displayFlags.ts';

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

const display = persistSignalBucket({
  key: 'symmetry:preferences',
  effect,
  bucket: {
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
  },
});

const exercises = persistSignalBucket({
  key: 'symmetry:exercises',
  effect,
  bucket: {
    /** Progress by exercise id. Absent ids read as {@link defaultProgress}. */
    progress: signal<Record<string, ExerciseProgress>>({}),
  },
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
 * The actions on the exercise progress, every one of them replacing the
 * records rather than mutating them, so whatever renders from them is told.
 * An exercise nobody has touched reads as {@link defaultProgress}, and a record
 * is stored with exactly its three fields.
 */
const progress = createProgressController(preferences.exercises.progress, {
  empty: defaultProgress,
});

/**
 * Read one exercise's progress, defaults included.
 *
 * Reads the signal, so a component calling it re-renders when progress moves.
 */
export const getExerciseProgress = progress.getExerciseProgress;

/** Record an attempt or a success. */
export const setExerciseStatus = progress.setExerciseStatus;

/**
 * Reveal the next hint of an exercise, one at a time, stopping at the last
 * when the hint count is given.
 */
export const revealNextHint = progress.revealNextHint;

/** Show or hide the sample answer. */
export const setShowSolution = progress.setShowSolution;

/** Forget one exercise: status, hints and revealed solution. */
export const resetExercise = progress.resetExercise;

/**
 * Forget every exercise. The UI puts this behind a confirmation dialog,
 * because it wipes a week of a student's work.
 */
export const clearAllProgress = progress.clearAllProgress;

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
