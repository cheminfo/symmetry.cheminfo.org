/**
 * What a step preloads, and where it opens.
 *
 * A step is a working configuration, so opening one switches the layers it
 * names on and every other layer off, and puts its object on the workbench it
 * belongs to. The student is then free to change any of it: the chips write the
 * same layers the workbench reads, so an edit made here survives the jump.
 */

import { batch, useSignalEffect } from '@preact/signals-react';
import { useRef } from 'react';

import type { ObjectMode, ObjectRef } from '../../data/glossary/types.ts';
import { objectRefMode, splitObjectRef } from '../../data/glossary/types.ts';
import type { TutorialStep } from '../../data/tutorial/index.ts';
import {
  TUTORIAL_STEPS,
  tutorialStepIndex,
} from '../../data/tutorial/index.ts';
import type { DisplayFlagKey, TabId } from '../../state/index.ts';
import {
  DISPLAY_FLAG_KEYS,
  animateOperation,
  selectMolecule,
  selectPlaneGroup,
  selectSpaceGroup,
  setActiveTab,
  setCatalogueItem,
  setDisplayFlag,
  state,
} from '../../state/index.ts';

/** The page a step's object is edited on. */
export const MODE_TAB: Record<ObjectMode, TabId> = {
  molecule: 'molecules',
  crystal: 'crystals',
  plane: 'plane',
};

/**
 * Where in the tour an address lands.
 *
 * An id nobody minted opens the first step rather than an error: a link written
 * into a course two years ago must still land somewhere useful.
 * @param stepId - What the address carries, or `null` for the start.
 * @returns The position in {@link TUTORIAL_STEPS}, from 0.
 */
export function resolveStepIndex(stepId: string | null): number {
  if (stepId === null) return 0;
  const found = tutorialStepIndex(stepId);
  return found === -1 ? 0 : found;
}

/**
 * Switch the step's layers on and every other one off.
 * @param step - The step being opened.
 */
export function applyStepLayers(step: TutorialStep): void {
  const wanted = new Set<string>(step.show);
  batch(() => {
    for (const key of DISPLAY_FLAG_KEYS) {
      setDisplayFlag(key, wanted.has(key));
    }
  });
}

/**
 * Put the step's object on its workbench and open it.
 *
 * The layers go with it, so the workbench shows what the step was showing
 * rather than whatever was last looked at.
 * @param step - The step to carry over.
 */
export function openStepInWorkbench(step: TutorialStep): void {
  const { kind, id } = splitObjectRef(step.object);
  applyStepLayers(step);
  if (kind === 'molecule') {
    selectMolecule(id);
    animateOperation(step.animate ?? null);
  } else if (kind === 'spaceGroup') {
    selectSpaceGroup(Number(id));
  } else {
    selectPlaneGroup(id);
  }
  setActiveTab(MODE_TAB[objectRefMode(step.object)]);
}

/**
 * Open the object a glossary example or a demo link names.
 *
 * The layers are left alone: a term looked up mid-step must not throw away the
 * layers the student has just switched on.
 * @param ref - What to open.
 */
export function openObject(ref: ObjectRef): void {
  const { kind, id } = splitObjectRef(ref);
  if (kind === 'pointGroup') {
    setCatalogueItem(id);
    setActiveTab('point-groups');
    return;
  }
  if (kind === 'molecule') {
    selectMolecule(id);
  } else if (kind === 'spaceGroup') {
    selectSpaceGroup(Number(id));
  } else {
    selectPlaneGroup(id);
  }
  setActiveTab(MODE_TAB[objectRefMode(ref)]);
}

/**
 * Apply a step's layers once, whenever the step in the address changes.
 *
 * It follows the **address**, not a prop, because that is what actually moves:
 * the strip, the pager and a pasted link all arrive as a write to the same
 * signal. The guard is what makes a layer the student switched off stay off —
 * nothing is written again until another step is opened.
 */
export function useStepLayers(): void {
  const applied = useRef<string | null>(null);

  useSignalEffect(() => {
    const index = resolveStepIndex(state.view.tutorial.stepId.value);
    const step = TUTORIAL_STEPS[index];
    if (step === undefined || applied.current === step.id) return;
    applied.current = step.id;
    applyStepLayers(step);
  });
}

/** Which of the twelve layers a step's workbench can actually draw. */
export function layersOfMode(mode: ObjectMode): readonly DisplayFlagKey[] {
  return MODE_LAYERS[mode];
}

const MODE_LAYERS: Record<ObjectMode, readonly DisplayFlagKey[]> = {
  molecule: ['axes', 'mirrors', 'inversion', 'improper', 'labels'],
  crystal: ['unitCell', 'axes', 'mirrors', 'glides', 'screws', 'labels'],
  plane: ['unitCell', 'axes', 'mirrors', 'fundamentalDomain'],
};
