import { expect, test } from 'vitest';

import { formatCifNumber, formatNumber, parseCifNumber } from '../number.ts';

test('a standard uncertainty is read out of the parentheses', () => {
  expect(parseCifNumber('0.30475(3)')).toStrictEqual({
    value: 0.30475,
    su: 0.00003,
    raw: '0.30475(3)',
  });
  expect(parseCifNumber('9.1269(5)')).toStrictEqual({
    value: 9.1269,
    su: 0.0005,
    raw: '9.1269(5)',
  });
  expect(parseCifNumber('102.491(5)')).toStrictEqual({
    value: 102.491,
    su: 0.005,
    raw: '102.491(5)',
  });
  expect(parseCifNumber('5.6393(7)')).toStrictEqual({
    value: 5.6393,
    su: 0.0007,
    raw: '5.6393(7)',
  });
  expect(parseCifNumber('295(2)')).toStrictEqual({
    value: 295,
    su: 2,
    raw: '295(2)',
  });
  expect(parseCifNumber('179.34(2)')).toStrictEqual({
    value: 179.34,
    su: 0.02,
    raw: '179.34(2)',
  });
});

test('a plain number comes back unchanged', () => {
  expect(parseCifNumber('90')).toStrictEqual({
    value: 90,
    su: null,
    raw: '90',
  });
  expect(parseCifNumber('  4.2112 ')).toStrictEqual({
    value: 4.2112,
    su: null,
    raw: '4.2112',
  });
  expect(parseCifNumber('.5')).toStrictEqual({
    value: 0.5,
    su: null,
    raw: '.5',
  });
  expect(parseCifNumber('0.')).toStrictEqual({ value: 0, su: null, raw: '0.' });
  expect(parseCifNumber('+x,+y,+z')).toBeNull();
  expect(parseCifNumber('-1.5e2')).toStrictEqual({
    value: -150,
    su: null,
    raw: '-1.5e2',
  });
  expect(parseCifNumber('1.234(5)E1')).toStrictEqual({
    value: 12.34,
    su: 0.05,
    raw: '1.234(5)E1',
  });
});

test('an absent, inapplicable or unknown field is null', () => {
  expect(parseCifNumber(undefined)).toBeNull();
  expect(parseCifNumber(null)).toBeNull();
  expect(parseCifNumber('')).toBeNull();
  expect(parseCifNumber(' '.repeat(3))).toBeNull();
  expect(parseCifNumber('.')).toBeNull();
  expect(parseCifNumber('?')).toBeNull();
  expect(parseCifNumber('Uiso')).toBeNull();
  expect(parseCifNumber('1 2')).toBeNull();
});

test('formatCifNumber writes the standard uncertainty back', () => {
  expect(formatCifNumber({ value: 9.1269, su: 0.0005, raw: '' })).toBe(
    '9.1269(5)',
  );
  expect(formatCifNumber({ value: 0.30475, su: 0.00003, raw: '' })).toBe(
    '0.30475(3)',
  );
  expect(formatCifNumber({ value: 295, su: 2, raw: '' })).toBe('295(2)');
  expect(formatCifNumber({ value: 90, su: null, raw: '' })).toBe('90');
});

test('formatNumber reads back as the same double', () => {
  const values = [0, 0.5, 5.6402, 3.61491, 0.333333, -0.0625, 1e-7, 1 / 3];
  for (const value of values) {
    expect(parseCifNumber(formatNumber(value))?.value).toBe(value);
  }
  expect(formatNumber(-0)).toBe('0');
  expect(formatNumber(6.709)).toBe('6.709');
});
