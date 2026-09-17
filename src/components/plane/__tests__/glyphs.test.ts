import { expect, test } from 'vitest';

import {
  circlePath,
  commaPath,
  lensPath,
  polygonPath,
  rotationGlyphPath,
  squarePath,
} from '../glyphs.ts';

test('each order gets the glyph the International Tables give it', () => {
  // The lens: two quadratic arcs meeting in points, long axis up the page.
  expect(rotationGlyphPath(2, 0, 0, 100)).toBe(
    'M 0,4.2 Q 2.6,0 0,-4.2 Q -2.6,0 0,4.2 Z',
  );
  expect(rotationGlyphPath(3, 0, 0, 100)).toBe(
    'M 0,5 L -4.330127,-2.5 L 4.330127,-2.5 Z',
  );
  // The square stands on its edges, which are the cell edges — not on a vertex.
  expect(rotationGlyphPath(4, 0, 0, 100)).toBe(
    'M -3.8,-3.8 L 3.8,-3.8 L 3.8,3.8 L -3.8,3.8 Z',
  );
  expect(rotationGlyphPath(6, 0, 0, 100)).toBe(
    'M 0,5 L -4.330127,2.5 L -4.330127,-2.5 L 0,-5 L 4.330127,-2.5 L 4.330127,2.5 Z',
  );
});

test('a glyph is drawn about the point it marks, at the scale it is given', () => {
  expect(rotationGlyphPath(4, 50, 20, 200)).toBe(
    'M 42.4,12.4 L 57.6,12.4 L 57.6,27.6 L 42.4,27.6 Z',
  );
  expect(lensPath(10, 10, 100)).toBe(
    'M 10,14.2 Q 12.6,10 10,5.8 Q 7.4,10 10,14.2 Z',
  );
  expect(squarePath(0, 0, 5)).toBe('M -5,-5 L 5,-5 L 5,5 L -5,5 Z');
});

test('the polygon helper serves the orders no crystal has', () => {
  // A stereogram of an icosahedral or a D4d group needs 5 and 8.
  expect(polygonPath(0, 0, 10, 5).split(' L ')).toHaveLength(5);
  expect(rotationGlyphPath(5, 0, 0, 100).split(' L ')).toHaveLength(5);
  expect(rotationGlyphPath(8, 0, 0, 100).split(' L ')).toHaveLength(8);
  expect(polygonPath(0, 0, 10, 4)).toBe('M 0,10 L -10,0 L 0,-10 L 10,0 Z');
});

test('an order below 2 is not a rotation point', () => {
  expect(() => rotationGlyphPath(1, 0, 0, 100)).toThrow(
    '1 is not a rotation point',
  );
  expect(() => rotationGlyphPath(0, 0, 0, 100)).toThrow(RangeError);
});

test('a circle and a comma are path data too, so every mark is one node', () => {
  expect(circlePath(0, 0, 10)).toBe(
    'M -10,0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0 Z',
  );
  expect(commaPath(0, 0, 10).startsWith('M -3.3,1.1 C')).toBe(true);
  expect(commaPath(0, 0, 10).endsWith('Z')).toBe(true);
});
