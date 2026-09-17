/**
 * The two panes beside the molecule canvas: the library on the left, and the
 * assignment walk on the right.
 *
 * Both reach a `react-cheminfo` hook, which is why neither could be mounted
 * until `vitest.config.ts` learned to dedupe React. What is asserted is the
 * list a student scrolls and the question the walk opens on — a static render
 * cannot press Yes, so the answered steps stay the e2e suite's.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import type { MoleculeEntry } from '../../../data/molecules.ts';
import { MOLECULES, moleculeById } from '../../../data/molecules.ts';
import { POINT_GROUPS } from '../../../data/pointGroups.ts';
import { FlowchartPanel } from '../FlowchartPanel.tsx';
import { MoleculePicker } from '../MoleculePicker.tsx';
import { moleculeFlow } from '../assignment.ts';

/** How many times a string occurs in the markup. */
function times(markup: string, text: string): number {
  return markup.split(text).length - 1;
}

/** One molecule of the library, by id. */
function molecule(id: string): MoleculeEntry {
  const entry = moleculeById(id);
  if (entry === undefined) throw new Error(`no molecule ${id}`);
  return entry;
}

/** Nobody clicks a string. */
function ignore(): void {
  // Nothing.
}

test('the picker lists all 56 molecules, under the 28 groups they fall in', () => {
  const markup = renderToStaticMarkup(
    <MoleculePicker selectedId="water" onSelect={ignore} />,
  );

  expect(MOLECULES).toHaveLength(56);
  expect(new Set(MOLECULES.map((entry) => entry.pointGroup)).size).toBe(28);
  expect(times(markup, 'class="mol-library__item"')).toBe(56);
  expect(times(markup, 'class="mol-library__group"')).toBe(28);
  expect(times(markup, 'role="option"')).toBe(56);
});

test('the list runs in the catalogue order, so scrolling is itself a lesson', () => {
  const markup = renderToStaticMarkup(
    <MoleculePicker selectedId="water" onSelect={ignore} />,
  );

  // The first group on the list is the one with no symmetry at all, and the
  // last is the fullest — that ordering is what makes the neighbours of an
  // entry the molecules it is most easily confused with.
  const groups = [...markup.matchAll(/aria-label="(?<name>[^"]+)"/g)].map(
    (match) => match.groups?.name,
  );
  expect(groups[0]).toBe('Search the molecule library');
  expect(groups[1]).toBe('Molecule library');
  expect(groups[2]).toBe('C1');
  expect(groups.at(-1)).toBe('D∞h');
  // Every group named is one the catalogue knows.
  const known = new Set(POINT_GROUPS.map((group) => group.schoenflies));
  for (const name of groups.slice(2)) {
    expect(known.has(name ?? ''), name).toBe(true);
  }
});

test('the molecule on the workbench is the one option marked selected', () => {
  const markup = renderToStaticMarkup(
    <MoleculePicker selectedId="benzene" onSelect={ignore} />,
  );

  expect(times(markup, 'aria-selected="true"')).toBe(1);
  expect(times(markup, 'data-selected="true"')).toBe(1);
  expect(markup).toContain(
    'aria-selected="true" data-selected="true"><span>Benzene</span>',
  );
  // A formula is typeset by react-mf, never dropped into the markup raw.
  expect(markup).toContain(
    '<span class="mol-library__formula"><span>C<sub>6</sub>H<sub>6</sub></span></span>',
  );
});

test('an id the library does not hold selects nothing, and hides nothing', () => {
  const markup = renderToStaticMarkup(
    <MoleculePicker selectedId="unobtainium" onSelect={ignore} />,
  );

  expect(times(markup, 'aria-selected="true"')).toBe(0);
  expect(times(markup, 'class="mol-library__item"')).toBe(56);
});

test('the walk opens on the first question, with nothing given away', () => {
  const flow = moleculeFlow(molecule('water'));
  const markup = renderToStaticMarkup(
    <FlowchartPanel steps={flow.steps} group={flow.group} />,
  );

  expect(flow.group).toBe('C2v');
  expect(flow.steps).toHaveLength(6);
  // One question, and only one: the answers are earned one at a time.
  expect(times(markup, 'class="mol-flow__step"')).toBe(1);
  expect(markup).toContain('<div class="mol-flow__number">1</div>');
  expect(markup).toContain('Are all the atoms on one straight line?');
  expect(markup).toContain(
    'Two atoms are always linear. Three or more: check that every bond angle is 180°.',
  );
  // Yes, No, and the way out for a student who cannot tell.
  expect(times(markup, '<button type="button"')).toBe(3);
  expect(markup).toContain('>Yes</span>');
  expect(markup).toContain('>No</span>');
  expect(markup).toContain('>Show me</span>');
  // The answer is not on the page before the questions are.
  expect(markup).not.toContain('Six questions or fewer');
  expect(markup).not.toContain('mol-flow__evidence');
});

test('a walk with nothing left to ask names the group it arrived at', () => {
  const markup = renderToStaticMarkup(<FlowchartPanel steps={[]} group="Oh" />);

  expect(markup).toContain('<div class="mol-flow__number">→</div>');
  expect(markup).toContain(
    'Six questions or fewer, and the group is <span>O<sub>h</sub></span>.',
  );
  expect(markup).toContain(
    '<span class="bp6-button-text">Walk it again</span>',
  );
  expect(times(markup, '<button type="button"')).toBe(1);
});

test('the walk of a linear molecule stops at the first question', () => {
  const flow = moleculeFlow(molecule('carbon-dioxide'));

  expect(flow.group).toBe('Dinfh');
  expect(flow.steps[0]?.id).toBe('linear');
  expect(flow.steps[0]?.answer).toBe(true);

  const markup = renderToStaticMarkup(
    <FlowchartPanel steps={flow.steps} group={flow.group} />,
  );
  expect(markup).toContain('Are all the atoms on one straight line?');
  expect(times(markup, 'class="mol-flow__step"')).toBe(1);
});
