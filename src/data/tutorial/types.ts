/**
 * What a tutorial step preloads into the workbench.
 *
 * A step is a working configuration the student is free to edit, never a slide:
 * it names the object to open, the layers to switch on, and one thing to look
 * for. Which workbench that is follows from the object, so no step says it
 * twice.
 */

import type { TutorialStep as GuidedStep } from 'react-cheminfo/core';

import type { DisplayFlagKey } from '../../state/displayFlags.ts';
import type { ObjectRef } from '../glossary/types.ts';

/** The panel a step opens beside the viewer. */
export type TutorialPanel =
  /** The six questions, with the answers so far struck through. */
  | 'flowchart'
  /** The character table of the group. */
  | 'characterTable'
  /** The group multiplication table, clickable. */
  | 'multiplication'
  /** The generated positions of the cell. */
  | 'positions';

/** One step of the guided tour. */
export type TutorialStep = GuidedStep<{
  /** What the step opens; {@link objectRefMode} says in which workbench. */
  object: ObjectRef;
  /** Layers switched on. Every layer the list leaves out starts off. */
  show: DisplayFlagKey[];
  /**
   * The operation played once when the step opens, named as
   * `groupOperationNames` names it — `C3`, `σv(xz)`, `S4`, `i`.
   * @default undefined — nothing is animated
   */
  animate?: string;
  /**
   * The panel beside the viewer.
   * @default undefined — the viewer fills the page
   */
  panel?: TutorialPanel;
  /** One line under the viewer: what to look for. */
  observe: string;
}>;
