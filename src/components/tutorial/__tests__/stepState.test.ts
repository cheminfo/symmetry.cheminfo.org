import { expect, test } from 'vitest';

import type { TutorialStep } from '../../../data/tutorial/index.ts';
import { TUTORIAL_STEPS } from '../../../data/tutorial/index.ts';
import {
  DISPLAY_FLAG_KEYS,
  setActiveTab,
  setCatalogueItem,
  setDisplayFlag,
  state,
} from '../../../state/index.ts';
import {
  MODE_TAB,
  applyStepLayers,
  layersOfMode,
  openObject,
  openStepInWorkbench,
  resolveStepIndex,
} from '../stepState.ts';

/** The step with this id. @throws When the tour has no such step. */
function step(id: string): TutorialStep {
  const found = TUTORIAL_STEPS.find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`no tutorial step ${id}`);
  return found;
}

/** Which layers are on right now, in the order the chip bar shows them. */
function litLayers(): string[] {
  const lit: string[] = [];
  for (const key of DISPLAY_FLAG_KEYS) {
    if (state.preferences.flags[key].value) lit.push(key);
  }
  return lit;
}

test('every step id resolves to its own position in the tour', () => {
  expect(TUTORIAL_STEPS).toHaveLength(18);
  for (let index = 0; index < TUTORIAL_STEPS.length; index++) {
    const entry = TUTORIAL_STEPS[index] as TutorialStep;
    expect(resolveStepIndex(entry.id)).toBe(index);
  }
});

test('an address with no step, or one nobody minted, opens the first', () => {
  expect(resolveStepIndex(null)).toBe(0);
  expect(resolveStepIndex('a-step-that-was-never-written')).toBe(0);
});

test('opening a step lights exactly the layers it names', () => {
  for (const key of DISPLAY_FLAG_KEYS) setDisplayFlag(key, true);
  const first = step('mirror-water');
  expect(first.show).toStrictEqual(['mirrors', 'labels']);

  applyStepLayers(first);

  expect(litLayers()).toStrictEqual(['mirrors', 'labels']);
});

test('every step of the tour names layers the site knows how to draw', () => {
  const known = new Set<string>(DISPLAY_FLAG_KEYS);
  for (const entry of TUTORIAL_STEPS) {
    for (const key of entry.show) {
      expect(known.has(key)).toBe(true);
    }
  }
});

test('carrying a molecule step over opens it, animation included', () => {
  setActiveTab('cheatsheet');

  openStepInWorkbench(step('mirror-water'));

  expect(state.view.activeTab.value).toBe('molecules');
  expect(state.view.molecules.moleculeId.value).toBe('water');
  expect(state.view.molecules.operation.value).toBe('σv(xz)');
  expect(litLayers()).toStrictEqual(['mirrors', 'labels']);
});

test('carrying a space-group step over opens the cell on its number', () => {
  setActiveTab('cheatsheet');
  const glides = step('glide-and-screw');
  expect(glides.object).toBe('spaceGroup:14');

  openStepInWorkbench(glides);

  expect(state.view.activeTab.value).toBe('crystals');
  expect(state.view.crystals.spaceGroupNumber.value).toBe(14);
});

test('carrying a wallpaper step over opens the pattern workbench', () => {
  setActiveTab('cheatsheet');
  const plane = step('plane-groups');
  expect(plane.object).toBe('wallpaper:p4m');

  openStepInWorkbench(plane);

  expect(state.view.activeTab.value).toBe('plane');
  expect(state.view.plane.groupId.value).toBe('p4m');
});

test('a glossary example opens its object and leaves the layers alone', () => {
  applyStepLayers(step('mirror-water'));

  openObject('pointGroup:c2v');

  expect(state.view.activeTab.value).toBe('point-groups');
  expect(state.view.catalogue.itemId.value).toBe('c2v');
  expect(litLayers()).toStrictEqual(['mirrors', 'labels']);
  setCatalogueItem(null);
});

test('a workbench offers only the layers it can draw', () => {
  expect(layersOfMode('molecule')).toStrictEqual([
    'axes',
    'mirrors',
    'inversion',
    'improper',
    'labels',
  ]);
  expect(layersOfMode('crystal')).toStrictEqual([
    'unitCell',
    'axes',
    'mirrors',
    'glides',
    'screws',
    'labels',
  ]);
  expect(layersOfMode('plane')).toStrictEqual([
    'unitCell',
    'axes',
    'mirrors',
    'fundamentalDomain',
  ]);
  expect(MODE_TAB).toStrictEqual({
    molecule: 'molecules',
    crystal: 'crystals',
    plane: 'plane',
  });
});
