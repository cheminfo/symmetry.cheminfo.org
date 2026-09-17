import { expect, test } from 'vitest';

import { CHARACTER_TABLES } from '../../../data/characterTables.ts';
import { formatCharacter, formatFunction, symbolParts } from '../characters.ts';

test('a whole character prints whole, with a typographic minus', () => {
  expect(formatCharacter(1)).toBe('1');
  expect(formatCharacter(-1)).toBe('−1');
  expect(formatCharacter(0)).toBe('0');
  expect(formatCharacter(3)).toBe('3');
  expect(formatCharacter(-2)).toBe('−2');
});

test('the rounding noise of a complex pair prints as zero, never as -0', () => {
  expect(formatCharacter(-1.224_646_799_147_353e-16)).toBe('0');
  expect(formatCharacter(1e-9)).toBe('0');
});

test('an irrational character prints to three decimals', () => {
  expect(formatCharacter(1.618_033_988_749_895)).toBe('1.618');
  expect(formatCharacter(-0.618_033_988_749_894_9)).toBe('−0.618');
  expect(formatCharacter(1.5)).toBe('1.5');
});

test('a power is raised only where a power can stand', () => {
  expect(formatFunction('x2+y2')).toBe('x²+y²');
  expect(formatFunction('x2+y2+z2')).toBe('x²+y²+z²');
  expect(formatFunction('x2-y2')).toBe('x²−y²');
  // T_d's E row: the leading 2 is a coefficient, not an exponent.
  expect(formatFunction('2z2-x2-y2')).toBe('2z²−x²−y²');
  expect(formatFunction('xy')).toBe('xy');
  expect(formatFunction('Rz')).toBe('Rz');
});

test('every basis function of every table survives being set', () => {
  const functions = new Set<string>();
  for (const table of CHARACTER_TABLES) {
    for (const irrep of table.irreps) {
      for (const one of irrep.linear) functions.add(one);
      for (const one of irrep.quadratic) functions.add(one);
    }
  }
  expect(functions.size).toBe(16);
  const set = [...functions].map((one) => formatFunction(one));
  // A digit left on the line is a coefficient; none of ours starts with a
  // superscript, which is what the T_d row used to do.
  for (const one of set) {
    expect(one.startsWith('²')).toBe(false);
    expect(one.startsWith('³')).toBe(false);
  }
  expect(set).toContain('2z²−x²−y²');
});

test('a Mulliken symbol splits into a letter and what is set below it', () => {
  expect(symbolParts('A1')).toStrictEqual({
    letter: 'A',
    subscript: '1',
    primes: '',
  });
  expect(symbolParts('T2g')).toStrictEqual({
    letter: 'T',
    subscript: '2g',
    primes: '',
  });
  expect(symbolParts('E')).toStrictEqual({
    letter: 'E',
    subscript: '',
    primes: '',
  });
});

test('a prime stays on the line, and the rest still drops', () => {
  expect(symbolParts('A1′')).toStrictEqual({
    letter: 'A',
    subscript: '1',
    primes: '′',
  });
  expect(symbolParts("E''")).toStrictEqual({
    letter: 'E',
    subscript: '',
    primes: "''",
  });
});

test('a Schoenflies symbol goes through the same split', () => {
  expect(symbolParts('C2v')).toStrictEqual({
    letter: 'C',
    subscript: '2v',
    primes: '',
  });
  expect(symbolParts('D∞h')).toStrictEqual({
    letter: 'D',
    subscript: '∞h',
    primes: '',
  });
});
