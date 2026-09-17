/**
 * Session data: what each workbench was given, and whether reading it worked.
 *
 * Only the *source* lives here — a molecule's coordinates, a crystal's CIF —
 * never what the symmetry engine derives from it. Detecting a point group,
 * expanding a cell and listing an orbit are pure functions of the source and
 * run in well under a frame, so a page derives them where it draws them and
 * there is no second copy to keep in step. Nothing here is persisted: a source
 * comes back from the library, or from the address, in milliseconds.
 */

import type { Signal } from '@preact/signals-react';
import { signal } from '@preact/signals-react';

/** Where a workbench is in reading what it was given. */
export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/** One workbench's source, and how reading it went. */
export interface SourceBucket {
  /** `id` of the library entry, or the file name of what was dropped on it. */
  id: Signal<string | null>;
  /** What to call it on screen. */
  name: Signal<string>;
  /** The text itself: XYZ for a molecule, CIF for a crystal. */
  text: Signal<string>;
  status: Signal<LoadStatus>;
  /** Message of the failure that put `status` at `error`. */
  error: Signal<string | null>;
}

/** The `data` bucket: plain object, signal leaves, never reassigned. */
export const data = {
  molecule: createSource(),
  crystal: createSource(),
};

/**
 * Announce that a source is being read, before the read runs.
 *
 * What is on screen stays there, so the view does not flash empty between two
 * structures.
 * @param source - The workbench's bucket.
 * @param id - Id of what is being read.
 * @param name - What to call it while it is read.
 */
export function startLoad(
  source: SourceBucket,
  id: string,
  name: string,
): void {
  source.id.value = id;
  source.name.value = name;
  source.status.value = 'loading';
  source.error.value = null;
}

/**
 * Publish a source that was read: every leaf at once, status `ready`.
 * @param source - The workbench's bucket.
 * @param id - Id of what was read.
 * @param name - What to call it.
 * @param text - The XYZ or CIF text itself.
 */
export function setLoaded(
  source: SourceBucket,
  id: string,
  name: string,
  text: string,
): void {
  source.id.value = id;
  source.name.value = name;
  source.text.value = text;
  source.status.value = 'ready';
  source.error.value = null;
}

/**
 * Record a failed read. The text is cleared, because a structure drawn beside
 * the name of the one that failed to load is the lie this site exists to avoid.
 * @param source - The workbench's bucket.
 * @param message - What to show the student.
 */
export function failLoad(source: SourceBucket, message: string): void {
  source.text.value = '';
  source.status.value = 'error';
  source.error.value = message;
}

/**
 * Empty a workbench entirely, back to the state it started in.
 * @param source - The workbench's bucket.
 */
export function clearSource(source: SourceBucket): void {
  source.id.value = null;
  source.name.value = '';
  source.text.value = '';
  source.status.value = 'idle';
  source.error.value = null;
}

function createSource(): SourceBucket {
  return {
    id: signal<string | null>(null),
    name: signal(''),
    text: signal(''),
    status: signal<LoadStatus>('idle'),
    error: signal<string | null>(null),
  };
}
