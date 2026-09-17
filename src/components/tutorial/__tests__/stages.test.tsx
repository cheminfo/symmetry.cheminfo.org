import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import type { TutorialStep } from '../../../data/tutorial/index.ts';
import { TUTORIAL_STEPS } from '../../../data/tutorial/index.ts';
import { PlaneStage } from '../PlaneStage.tsx';
import { StepPanel } from '../StepPanel.tsx';
import { StepStage } from '../StepStage.tsx';

/** The step with this id. @throws When the tour has no such step. */
function step(id: string): TutorialStep {
  const found = TUTORIAL_STEPS.find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`no tutorial step ${id}`);
  return found;
}

/** How many times a tag opens in the markup. */
function count(markup: string, tag: string): number {
  return markup.split(`<${tag}`).length - 1;
}

test('the tiling and the element diagram are drawn from one cell', () => {
  const markup = renderToStaticMarkup(
    <PlaneStage groupId="p4m" namespace="wallpaper" tiles={2} />,
  );

  // The motif is written once and referenced per copy: eight operations over
  // four cells.
  expect(count(markup, 'defs')).toBe(1);
  expect(count(markup, 'use')).toBe(32);
  expect(count(markup, 'svg')).toBe(2);
  expect(markup).toContain('aria-label="p4m, tiled over 2 × 2 cells"');
  expect(markup).toContain('aria-label="p4m, its symmetry elements"');
});

test('the diagram can be left out, and frieze is its own namespace', () => {
  const markup = renderToStaticMarkup(
    <PlaneStage groupId="p2mg" namespace="frieze" tiles={2} diagram={false} />,
  );

  expect(count(markup, 'svg')).toBe(1);
  expect(markup).toContain('aria-label="p2mg, tiled over 2 × 2 cells"');
});

test('a group nobody minted says so rather than drawing nothing', () => {
  const markup = renderToStaticMarkup(
    <PlaneStage groupId="p9z" namespace="wallpaper" />,
  );

  expect(markup).toContain('No wallpaper group p9z.');
  expect(count(markup, 'svg use')).toBe(0);
});

test('a step with no panel draws none', () => {
  expect(renderToStaticMarkup(<StepPanel step={step('mirror-water')} />)).toBe(
    '',
  );
});

test('the positions panel of a step is the coset list of its own group', () => {
  const markup = renderToStaticMarkup(
    <StepPanel step={step('space-group-positions')} />,
  );

  expect(markup).toContain('F 4/m -3 2/m · multiplicity 192 · centring F');
  expect(count(markup, 'li')).toBe(192);
});

test('a plane step puts the pattern on the stage', () => {
  const markup = renderToStaticMarkup(
    <StepStage step={step('plane-groups')} />,
  );

  expect(markup).toContain('aria-label="p4m, its symmetry elements"');
});

test('a machine with no 3D is told so, not left with a blank rectangle', () => {
  const markup = renderToStaticMarkup(
    <StepStage step={step('mirror-water')} />,
  );

  expect(markup).toContain('No 3D on this machine');
  expect(markup).toContain(
    'The operations, the character tables, the exercises and the cheatsheet all work without it.',
  );
});
