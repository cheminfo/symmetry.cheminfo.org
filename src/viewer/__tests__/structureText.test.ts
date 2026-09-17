import { expect, test } from 'vitest';

import { toXyzText } from '../structureText.ts';

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
