import { aboutProblems, resolveAbout } from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import { ABOUT } from '../about.ts';

test('the About record is short enough for anyone to read it', () => {
  expect(aboutProblems(ABOUT)).toStrictEqual([]);
});

test('what a visitor can do here is six lines, each starting on a verb', () => {
  expect(ABOUT.can).toHaveLength(6);
  expect(ABOUT.can[0]).toBe(
    'Assign the point group of any molecule, one flowchart question at a time.',
  );
  expect(ABOUT.can[5]).toBe(
    'Work through checked exercises, and print the cheatsheet.',
  );
});

test('every borrowed work the site runs on is named, and resolves', () => {
  expect(ABOUT.credits).toStrictEqual([
    'molstar',
    'blueprint',
    'react',
    'vite',
    'ml-matrix',
    'react-mf',
    'ml-xsadd',
    'cif-to-json',
    'react-cheminfo',
    'cheminfo-font',
  ]);

  const about = resolveAbout(ABOUT);

  expect(about.credits.map((credit) => credit.name)).toStrictEqual([
    'Mol*',
    'Blueprint',
    'React',
    'Vite',
    'ml-matrix',
    'react-mf',
    'ml-xsadd',
    'cif-to-json',
    'react-cheminfo',
    'cheminfo-font',
  ]);
  expect(about.license).toBe('MIT');
  expect(about.repository).toBe(
    'https://github.com/cheminfo/symmetry.cheminfo.org',
  );
  expect(about.issues).toBe(
    'https://github.com/cheminfo/symmetry.cheminfo.org/issues',
  );
});

test('why symmetry is worth learning, and that nothing leaves the page', () => {
  expect(ABOUT.paragraphs).toHaveLength(2);
  expect(ABOUT.paragraphs?.[0]).toContain('the shortest route to a spectrum');
  expect(ABOUT.paragraphs?.[1]).toContain('nothing you build is sent anywhere');
});

test('the platform and the teaching are what the site asks to be cited', () => {
  expect(ABOUT.cite?.map((work) => work.reference.doi)).toStrictEqual([
    '10.2533/chimia.2025.66',
    '10.2533/chimia.2023.683',
  ]);
});
