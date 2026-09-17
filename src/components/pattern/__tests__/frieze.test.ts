import { expect, test } from 'vitest';

import { planeElementTable } from '../../../symmetry/planeElements.ts';
import { patternLattice } from '../../plane/index.ts';
import { friezeGlyphs, friezeLines } from '../friezeElements.ts';
import {
  STRIP_REACH,
  friezeElementShifts,
  friezeFrame,
  friezeShifts,
  motifDomainPoints,
  stripPoint,
} from '../friezeFrame.ts';
import { planeGroupOperations, resolvePlaneGroup } from '../planeGroupRef.ts';

/** The square cell a frieze is drawn in, 100 units to the period. */
const LATTICE = patternLattice({ a: 100, b: 100, gamma: 90 });

/** The element table of one frieze group, over `periods` periods of its strip. */
function tableOf(id: string, periods: number) {
  return planeElementTable(
    planeGroupOperations(resolvePlaneGroup(id)),
    friezeElementShifts(periods),
  );
}

test('the strip is as long as its periods and one cell either side of the axis', () => {
  const frame = friezeFrame(LATTICE, 2);
  expect(frame.viewBox).toBe('0 -100 200 200');
  expect(frame.x).toBe(0);
  expect(frame.y).toBe(-100);
  expect(frame.width).toBe(200);
  expect(frame.height).toBe(200);
  expect(STRIP_REACH).toBe(1);
});

test('the padding grows the window on all four sides', () => {
  expect(friezeFrame(LATTICE, 2, 6).viewBox).toBe('-6 -106 212 212');
});

test('each period is outlined, and the one at the origin is marked', () => {
  const frame = friezeFrame(LATTICE, 3);
  expect(frame.periods).toHaveLength(3);
  expect(frame.periods[0]).toStrictEqual({
    key: '0',
    points: '0,-100 100,-100 100,100 0,100',
    primary: true,
  });
  expect(frame.periods[2]).toStrictEqual({
    key: '2',
    points: '200,-100 300,-100 300,100 200,100',
    primary: false,
  });
});

test('a strip translates along a and nowhere else', () => {
  expect(friezeShifts(3)).toStrictEqual([
    [0, 0],
    [1, 0],
    [2, 0],
  ]);
  // The element shifts run to twice the periods: a half-turn centre a whole
  // period away comes out of a translation of two.
  expect(friezeElementShifts(2)).toStrictEqual([
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
  ]);
});

test('p1m1 draws its mirrors across the strip, every half period', () => {
  const lines = friezeLines(tableOf('f:p1m1', 2), LATTICE, 2);
  expect(lines.map((line) => line.kind)).toStrictEqual([
    'mirror',
    'mirror',
    'mirror',
    'mirror',
    'mirror',
  ]);
  expect(lines.map((line) => line.x1)).toStrictEqual([0, 50, 100, 150, 200]);
  expect(lines[0]).toStrictEqual({
    key: 'm@1,0=0',
    kind: 'mirror',
    symbol: 'm',
    x1: 0,
    y1: -100,
    x2: 0,
    y2: 100,
  });
});

test('p11g draws a glide along the axis and no mirror at all', () => {
  const lines = friezeLines(tableOf('f:p11g', 2), LATTICE, 2);
  expect(lines).toStrictEqual([
    {
      key: 'g@0,1=0',
      kind: 'glide',
      symbol: 'g',
      // The segment runs along `(-k, h)`, so a line whose normal is `(0, 1)`
      // comes back right to left. A `<line>` does not care which end is which.
      x1: 200,
      y1: 0,
      x2: 0,
      y2: 0,
    },
  ]);
});

test('p2 puts a half-turn centre every half period, and no line', () => {
  const table = tableOf('f:p2', 2);
  expect(friezeLines(table, LATTICE, 2)).toStrictEqual([]);
  const glyphs = friezeGlyphs(table, LATTICE, 2);
  expect(glyphs.map((glyph) => glyph.order)).toStrictEqual([2, 2, 2, 2, 2]);
  expect(glyphs.map((glyph) => glyph.x)).toStrictEqual([0, 50, 100, 150, 200]);
  expect(glyphs.every((glyph) => glyph.y === 0)).toBe(true);
  expect(glyphs[0]?.key).toBe('2@0,0');
});

test('a centre beyond the drawn strip is left out', () => {
  // The table spans four periods; only the two drawn are glyphed.
  const glyphs = friezeGlyphs(tableOf('f:p2', 4), LATTICE, 1);
  expect(glyphs.map((glyph) => glyph.x)).toStrictEqual([0, 50, 100]);
});

test('a fractional point lands where the cell matrix puts it', () => {
  expect(stripPoint([100, 0, 0, 100], [1.5, -0.25])).toStrictEqual([150, -25]);
  expect(
    motifDomainPoints(
      [
        [0, 0],
        [0.5, 0],
        [0.5, 0.5],
        [0, 0.5],
      ],
      LATTICE,
    ),
  ).toBe('0,0 50,0 50,50 0,50');
});
