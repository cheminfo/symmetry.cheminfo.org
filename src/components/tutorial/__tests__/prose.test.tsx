/**
 * The prose of a step, and the vocabulary it is read against.
 *
 * The two go together: `StepText` writes the paragraph and `SymmetryGlossary`
 * is what turns a `[[marker]]` in it into a definition a first-year can open.
 * Both halves are asserted here, including the one that matters most — prose
 * whose term nobody has defined yet still reads as prose.
 */

import { GlossaryDefinition } from 'react-cheminfo/ui';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import { GLOSSARY, GLOSSARY_TERMS } from '../../../data/glossary/index.ts';
import type { SymmetryGlossaryEntry } from '../../../data/glossary/types.ts';
import type { TutorialStep } from '../../../data/tutorial/index.ts';
import {
  TUTORIAL_STEPS,
  tutorialStepById,
} from '../../../data/tutorial/index.ts';
import { StepText } from '../StepText.tsx';
import { SymmetryGlossary } from '../SymmetryGlossary.tsx';

/** How many times a string occurs in the markup. */
function times(markup: string, text: string): number {
  return markup.split(text).length - 1;
}

/** One step, by the id the address carries. */
function stepOf(id: string): TutorialStep {
  const step = tutorialStepById(id);
  if (step === undefined) throw new Error(`no step ${id}`);
  return step;
}

/** One term, by the key a `[[marker]]` is lowercased to. */
function termOf(term: string): SymmetryGlossaryEntry {
  const entry = GLOSSARY[term];
  if (entry === undefined) throw new Error(`no term ${term}`);
  return entry;
}

test('a step is titled, placed in the tour, and says what to look at', () => {
  const markup = renderToStaticMarkup(
    <StepText step={stepOf('mirror-water')} position={1} total={18} />,
  );

  expect(TUTORIAL_STEPS).toHaveLength(18);
  expect(markup).toContain('<h1>The simplest operation: a mirror plane</h1>');
  expect(markup).toContain('Operations, elements and point groups');
  expect(markup).toContain(
    '<span class="step-text__position">Step 1 of 18</span>',
  );
  expect(markup).toContain('<h5 class="bp6-heading">Look for</h5>');
  expect(markup).toContain(
    'Reflect in either plane: the two hydrogens swap, and nothing you could measure has changed.',
  );
});

test('the level a step belongs to is named, not numbered', () => {
  const intermediate = renderToStaticMarkup(
    <StepText step={stepOf('character-table-c2v')} position={11} total={18} />,
  );
  expect(intermediate).toContain('Characters, and what they predict');
  expect(intermediate).toContain('bp6-intent-warning');

  const advanced = renderToStaticMarkup(
    <StepText step={stepOf('glide-and-screw')} position={17} total={18} />,
  );
  expect(advanced).toContain('Lattices, plane groups, space groups');
  expect(advanced).toContain('bp6-intent-danger');
  expect(advanced).toContain(
    '<span class="step-text__position">Step 17 of 18</span>',
  );
});

test('inside the glossary a marker becomes a definition to open', () => {
  const markup = renderToStaticMarkup(
    <SymmetryGlossary>
      <StepText step={stepOf('mirror-water')} position={1} total={18} />
    </SymmetryGlossary>,
  );

  expect(GLOSSARY_TERMS).toHaveLength(77);
  // Three terms are marked in that paragraph, and all three resolve.
  expect(times(markup, 'class="glossary-term"')).toBe(3);
  expect(markup).toContain('tabindex="0">symmetry operation</span>');
  expect(markup).toContain('tabindex="0">symmetry element</span>');
  // `[[mirror plane|mirror planes]]`: the entry is singular, the prose plural.
  expect(markup).toContain('tabindex="0">mirror planes</span>');
  expect(markup).not.toContain('[[');
});

test('a term nobody has defined yet reads as prose, never as brackets', () => {
  const markup = renderToStaticMarkup(
    <SymmetryGlossary>
      <StepText
        step={{
          ...stepOf('mirror-water'),
          description: 'A [[mirror plane]] and a [[quasicrystal]].',
        }}
        position={1}
        total={18}
      />
    </SymmetryGlossary>,
  );

  expect(times(markup, 'class="glossary-term"')).toBe(1);
  expect(markup).toContain('>mirror plane</span>');
  expect(markup).toContain(' and a quasicrystal.</p>');
  expect(markup).not.toContain('[[quasicrystal]]');
});

test('without the provider the same prose still reads, with no chips', () => {
  const markup = renderToStaticMarkup(
    <StepText step={stepOf('mirror-water')} position={1} total={18} />,
  );

  expect(times(markup, 'class="glossary-term"')).toBe(0);
  expect(markup).not.toContain('[[');
  expect(markup).toContain(
    'A symmetry operation moves an object onto a copy you cannot tell from the original.',
  );
});

test('a definition shows the object to open, not a line of code', () => {
  // This is the body that opens on hover; a static render never opens a
  // tooltip, so it is drawn straight from the provider instead.
  const markup = renderToStaticMarkup(
    <SymmetryGlossary>
      <GlossaryDefinition entry={termOf('glide plane')} tone="page" />
    </SymmetryGlossary>,
  );

  expect(markup).toContain('Glide plane');
  expect(markup).toContain(
    'A reflection combined with a translation of half a lattice vector',
  );
  expect(markup).toContain(
    '<div class="glossary-example"><span>The c glide across b: reflect, then slide c/2</span>',
  );
  expect(markup).toContain('<span class="bp6-button-text">Open it</span>');
  expect(times(markup, 'class="glossary-example"')).toBe(1);
});

test('an example with a note prints the note between it and the button', () => {
  const noted = GLOSSARY_TERMS.map(termOf).find((entry) =>
    entry.examples.some((example) => example.note !== undefined),
  );
  if (noted === undefined) throw new Error('no glossary entry carries a note');
  const note = noted.examples.find(
    (example) => example.note !== undefined,
  )?.note;
  if (note === undefined) throw new Error('no note');

  const markup = renderToStaticMarkup(
    <SymmetryGlossary>
      <GlossaryDefinition entry={noted} tone="page" />
    </SymmetryGlossary>,
  );

  expect(markup).toContain(
    `<span class="glossary-example__note">${note}</span>`,
  );
});
