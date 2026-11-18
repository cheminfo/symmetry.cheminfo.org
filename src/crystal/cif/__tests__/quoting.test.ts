import { expect, test } from 'vitest';

import { readCif } from '../read.ts';

import { miniCif } from './fixture.ts';

test('a quoted string may carry its own delimiter', () => {
  expect(
    readCif(miniCif("_chemical_name_mineral 'ADENOSINE-5'-TRIPHOSPHATE'"))
      .source.note,
  ).toBe("ADENOSINE-5'-TRIPHOSPHATE");
});

test('a quoted string may carry the other delimiter', () => {
  expect(
    readCif(miniCif('_chemical_name_mineral "2,2\'-bipyridine"')).source.note,
  ).toBe("2,2'-bipyridine");
});

test('a quoted string may carry both delimiters', () => {
  expect(
    readCif(miniCif("_chemical_name_mineral 'O'Brien \"x\" Sons'")).source.note,
  ).toBe('O\'Brien "x" Sons');
});

test('an unquoted value keeps an embedded hash', () => {
  expect(readCif(miniCif('_chemical_formula_sum C#N')).formula).toBe('C#N');
});

test('a comment after a value, and a multi-line text field, are read', () => {
  expect(readCif(miniCif('_chemical_formula_sum C # carbon')).formula).toBe(
    'C',
  );
  expect(readCif(miniCif('_chemical_formula_sum\n;\n Na Cl\n;')).formula).toBe(
    'Na Cl',
  );
  expect(
    readCif(miniCif("_chemical_name_mineral\n;\nit's a mineral\n;")).source
      .note,
  ).toBe("it's a mineral");
});

test('the data block is named, whatever case it was written in', () => {
  expect(readCif(miniCif('')).name).toBe('test');
  expect(readCif(miniCif('').replace('data_test', 'DATA_Up')).name).toBe('Up');
  expect(readCif(miniCif('').replace('data_test\n', '')).name).toBe('');
});

test('a file with more than one data block is refused', () => {
  expect(() => readCif(`${miniCif('')}data_two\n_a 2\n`)).toThrow(
    'This file holds 2 data blocks (test, two). Split it and load one structure at a time.',
  );
  // A `data_` inside a text field is text, not a header.
  expect(readCif(miniCif('_a\n;\ndata_two\n;')).name).toBe('test');
});
