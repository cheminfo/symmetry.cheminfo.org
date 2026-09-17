import { expect, test } from 'vitest';

import { atomName, toXyzText } from '../structureText.ts';

test('the file is a count, a comment and one line per atom', () => {
  expect(
    toXyzText([
      { element: 'Na', position: [0, 0, 0] },
      { element: 'Cl', position: [2.5, -1, 0.125] },
    ]),
  ).toBe(
    '2\nsymmetry.cheminfo.org\nNa 0.000000 0.000000 0.000000\nCl 2.500000 -1.000000 0.125000\n',
  );
});

test('the comment is the caller’s when it gives one', () => {
  expect(
    toXyzText([{ element: 'C', position: [0, 0, 0] }], 'methane').split(
      '\n',
      2,
    )[1],
  ).toBe('methane');
});

test('a negative zero is written as zero, so two identical scenes match', () => {
  expect(toXyzText([{ element: 'H', position: [-0, 0, 0] }])).toContain(
    'H 0.000000 0.000000 0.000000',
  );
});

test('an empty scene is refused: molstar reads a count of zero as the end of the file', () => {
  expect(() => toXyzText([])).toThrow('at least one atom');
});

test('an atom is named by its element and its place in the scene, from one', () => {
  expect(atomName('O', 0)).toBe('O 1');
  expect(atomName('H', 2)).toBe('H 3');
});

test('molstar upper-cases a symbol on the way in, and it comes back written properly', () => {
  // Hovering a quartz silicon said `SI 2` until this was applied.
  expect(atomName('SI', 1)).toBe('Si 2');
  expect(atomName('Si', 1)).toBe('Si 2');
  expect(atomName('cl', 0)).toBe('Cl 1');
});
