import { expect, test } from 'vitest';

import { normalizeCif } from '../normalize.ts';
import { readCif } from '../read.ts';

import { miniCif } from './fixture.ts';

test('a quoted string may carry its own delimiter', () => {
  // cif-to-json ends the string at the first `'` and drops the rest.
  expect(normalizeCif("_a 'O'Brien and Sons'\n").text).toBe(
    '_a "O\'Brien and Sons"\n',
  );
  expect(
    readCif(miniCif("_chemical_name_mineral 'ADENOSINE-5'-TRIPHOSPHATE'"))
      .source.note,
  ).toBe("ADENOSINE-5'-TRIPHOSPHATE");
});

test('a quoted string may carry the other delimiter', () => {
  expect(normalizeCif('_a "2,2\'-bipyridine"\n').text).toBe(
    '_a "2,2\'-bipyridine"\n',
  );
  expect(
    readCif(miniCif('_chemical_name_mineral "2,2\'-bipyridine"')).source.note,
  ).toBe("2,2'-bipyridine");
});

test('a value carrying both delimiters becomes a text field', () => {
  expect(normalizeCif("_a 'O'Brien \"x\" Sons'\n").text).toBe(
    '_a\n;O\'Brien "x" Sons\n;\n',
  );
  expect(
    readCif(miniCif("_chemical_name_mineral 'O'Brien \"x\" Sons'")).source.note,
  ).toBe('O\'Brien "x" Sons');
});

test('an unquoted value keeps an embedded hash', () => {
  // cif-to-json truncates the token at `#`; CIF only opens a comment after
  // whitespace.
  expect(normalizeCif('_a C#N\n').text).toBe("_a 'C#N'\n");
  expect(readCif(miniCif('_chemical_formula_sum C#N')).formula).toBe('C#N');
});

test('a comment and a multi-line text field are left alone', () => {
  const text = "# a comment with 'one quote\n_a 1\n";
  expect(normalizeCif(text).text).toBe(text);
  expect(readCif(miniCif('_chemical_formula_sum\n;\n Na Cl\n;')).formula).toBe(
    'Na Cl',
  );
  expect(
    readCif(miniCif("_chemical_name_mineral\n;\nit's a mineral\n;")).source
      .note,
  ).toBe("it's a mineral");
});

test('the data block is named, whatever case it was written in', () => {
  expect(normalizeCif('data_1100231\n_a 1\n').name).toBe('1100231');
  expect(normalizeCif('DATA_Up\n_a 1\n').name).toBe('Up');
  expect(normalizeCif('DATA_Up\n_a 1\n').text).toBe('data_Up\n_a 1\n');
  expect(normalizeCif('_a 1\n').name).toBe('');
  expect(normalizeCif("data_x _a 'O'Brien'\n")).toStrictEqual({
    name: 'x',
    text: 'data_x\n_a "O\'Brien"\n',
  });
});

test('a comment after a value, and an unclosed quote, are left alone', () => {
  expect(normalizeCif('_a 1 # the rest is a comment\n').text).toBe(
    '_a 1 # the rest is a comment\n',
  );
  expect(normalizeCif("_a 'unclosed\n").text).toBe("_a 'unclosed\n");
  expect(readCif(miniCif('_chemical_formula_sum C # carbon')).formula).toBe(
    'C',
  );
});

test('a file with more than one data block is refused', () => {
  expect(() => normalizeCif('data_one\n_a 1\ndata_two\n_a 2\n')).toThrow(
    'This file holds 2 data blocks (one, two). Split it and load one structure at a time.',
  );
  expect(() => readCif('data_one\ndata_two\n')).toThrow('2 data blocks');
  // A `data_` inside a text field is text, not a header.
  expect(normalizeCif('data_one\n_a\n;\ndata_two\n;\n').name).toBe('one');
});
