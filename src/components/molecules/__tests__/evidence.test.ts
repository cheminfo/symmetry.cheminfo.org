import { expect, test } from 'vitest';

import { MOLECULES, moleculeById } from '../../../data/molecules.ts';
import { analyseMolecule } from '../assignment.ts';
import { symbol } from '../evidence.ts';

/** What the walk asked of this molecule, and what it answered. */
function walk(id: string): string[] {
  const entry = moleculeById(id);
  if (entry === undefined) throw new Error(`no molecule ${id}`);
  return analyseMolecule(entry).steps.map(
    (step) => `${step.id} ${step.answer ? 'yes' : 'no'} ${step.evidence}`,
  );
}

test('water is talked through the six questions with a count each time', () => {
  expect(walk('water')).toStrictEqual([
    'linear no The atoms do not lie on one line.',
    'multi-high-axis no There is no axis above two-fold.',
    'any-axis yes There is 1 proper axis, the highest C₂.',
    'perp-c2 no There is no C₂ axis perpendicular to the principal C₂.',
    'c-sigma-h no No plane is perpendicular to the principal C₂.',
    'c-sigma-v yes There are 2 planes holding the principal C₂.',
  ]);
});

test('benzene stops after five, on the horizontal plane', () => {
  expect(walk('benzene')).toStrictEqual([
    'linear no The atoms do not lie on one line.',
    'multi-high-axis no There is 1 axis above two-fold.',
    'any-axis yes There are 7 proper axes, the highest C₆.',
    'perp-c2 yes There are 6 C₂ axes perpendicular to the principal C₆.',
    'd-sigma-h yes One plane is perpendicular to the principal C₆.',
  ]);
});

test('methane goes down the many-axes branch and fails on the centre', () => {
  expect(walk('methane')).toStrictEqual([
    'linear no The atoms do not lie on one line.',
    'multi-high-axis yes There are 4 axes above two-fold.',
    'has-c5 no There is no C₅ axis.',
    'has-c4 no There is no C₄ axis.',
    'tetra-mirror yes There are 6 mirror planes.',
    'tetra-i no There is no centre of inversion.',
  ]);
});

test('a linear molecule is decided in two questions', () => {
  expect(walk('carbon-dioxide')).toStrictEqual([
    'linear yes Every atom lies on one line.',
    'linear-i yes There is a centre of inversion.',
  ]);
  expect(walk('hydrogen-chloride')).toStrictEqual([
    'linear yes Every atom lies on one line.',
    'linear-i no There is no centre of inversion.',
  ]);
});

test('the improper question names the S2n it is looking for', () => {
  const steps = walk('tetraphenylmethane');
  expect(steps.at(-1)).toBe(
    'improper yes There is an S₄ along the principal C₂.',
  );
  expect(walk('hydrogen-peroxide').at(-1)).toBe(
    'improper no There is no S₄ along the principal C₂.',
  );
});

test('a molecule with nothing at all is walked to the end', () => {
  expect(walk('bromochlorofluoromethane')).toStrictEqual([
    'linear no The atoms do not lie on one line.',
    'multi-high-axis no There is no axis above two-fold.',
    'any-axis no There is no proper rotation axis.',
    'lone-mirror no There is no mirror plane.',
    'lone-i no There is no centre of inversion.',
  ]);
});

test('every question the library reaches is answered with a sentence', () => {
  let checked = 0;
  for (const entry of MOLECULES) {
    for (const step of analyseMolecule(entry).steps) {
      expect(step.evidence.endsWith('.')).toBe(true);
      expect(step.evidence.slice(0, 1)).toBe(
        step.evidence.slice(0, 1).toUpperCase(),
      );
      expect(step.evidence.length).toBeGreaterThan(15);
      checked++;
    }
  }
  expect(checked).toBe(285);
});

test('an order is set below its letter', () => {
  expect(symbol('C', 2)).toBe('C₂');
  expect(symbol('S', 4)).toBe('S₄');
  expect(symbol('S', 10)).toBe('S₁₀');
});
