import { expect, test } from 'vitest';

import { drawingLabels } from '../elementLabels.ts';
import { plainName } from '../labelText.ts';
import type { RotationDrawing } from '../types.ts';

test('a prime is drawn without the caret that raises it', () => {
  expect(plainName('σv^′')).toBe('σv′');
  expect(plainName('σv^″')).toBe('σv″');
  expect(plainName('C2^′(1)')).toBe('C2′(1)');
  expect(plainName('C2^″(3)')).toBe('C2″(3)');
});

test('a power is set above the line', () => {
  expect(plainName('C3^2')).toBe('C3²');
  expect(plainName('S6^5')).toBe('S6⁵');
  expect(plainName('S4^3(x)')).toBe('S4³(x)');
  expect(plainName('C12^10')).toBe('C12¹⁰');
});

test('a name with nothing raised is handed back unchanged', () => {
  for (const name of ['C2(z)', 'σv(xz)', 'C3(111)', 'i', 'E', 'σh', '']) {
    expect(plainName(name), name).toBe(name);
  }
});

test('no caret survives into a name the canvas draws', () => {
  const drawn = ['C6', 'C2^′(1)', 'C2^″(3)', 'σv^′(2)', 'S6^5'];
  for (const label of drawn) {
    expect(plainName(label), label).not.toContain('^');
  }
});

test('the canvas draws the raised name, not the one the site matches on', () => {
  const axis: RotationDrawing = {
    kind: 'rotation',
    id: 'c2-prime-1',
    label: 'C2^′(1)',
    point: [0, 0, 0],
    direction: [0, 0, 1],
    length: 4,
    order: 2,
  };
  expect(drawingLabels(axis, { labelSize: 0.5, labelGap: 0.5 })[0]?.text).toBe(
    'C2′(1)',
  );
  expect(axis.label).toBe('C2^′(1)');
});
