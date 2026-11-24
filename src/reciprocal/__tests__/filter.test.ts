import { expect, test } from 'vitest';

import { exampleById, exampleImage } from '../examples.ts';
import type { Mask } from '../filter.ts';
import {
  MAX_SPOTS,
  applyMask,
  applyPhase,
  isKept,
  keptCount,
  snapToPeak,
  toggleSpot,
} from '../filter.ts';
import {
  FIELD_CENTRE,
  FIELD_SIZE,
  amplitudeAt,
  fourierTransform,
} from '../fourier.ts';
import { DEFAULT_LATTICE, latticeImage } from '../lattice.ts';
import {
  cutToRegion,
  formatRegion,
  parseRegion,
  regionBetween,
} from '../region.ts';
import { formatSpots, parseSpots } from '../spots.ts';

const lattice = fourierTransform(latticeImage(DEFAULT_LATTICE));

test('a low-pass disk keeps its inside, a high-pass one its outside', () => {
  const low: Mask = { kind: 'low', radius: 10, spots: [] };
  const high: Mask = { kind: 'high', radius: 10, spots: [] };

  expect(isKept(low, 6, 8)).toBe(true);
  expect(isKept(low, 7, 8)).toBe(false);
  expect(isKept(high, 6, 8)).toBe(false);
  expect(isKept(high, 7, 8)).toBe(true);
  expect(keptCount({ kind: 'low', radius: 1, spots: [] })).toBe(5);
  expect(keptCount({ kind: 'all', radius: 1, spots: [] })).toBe(
    FIELD_SIZE * FIELD_SIZE,
  );
});

test('a spot is kept with its Friedel mate, three pixels around each', () => {
  const mask: Mask = { kind: 'spots', radius: 16, spots: [{ u: 16, v: 0 }] };

  expect(isKept(mask, 16, 0)).toBe(true);
  expect(isKept(mask, -16, 0)).toBe(true);
  expect(isKept(mask, -16, 3)).toBe(true);
  expect(isKept(mask, -16, 4)).toBe(false);
  expect(isKept(mask, 0, 0)).toBe(false);
  // 29 pixels lie within three of a point, and the two disks do not overlap.
  expect(keptCount(mask)).toBe(58);
  expect(keptCount({ ...mask, spots: [{ u: 0, v: 0 }] })).toBe(29);
});

test('a mask sets to zero everything it drops, and leaves the rest alone', () => {
  const kept = applyMask(lattice, {
    kind: 'spots',
    radius: 16,
    spots: [{ u: 16, v: 0 }],
  });

  expect(amplitudeAt(kept, 16, 0)).toBe(amplitudeAt(lattice, 16, 0));
  expect(amplitudeAt(kept, -16, 0)).toBe(amplitudeAt(lattice, -16, 0));
  expect(amplitudeAt(kept, 0, 0)).toBe(0);
  expect(amplitudeAt(kept, 0, 16)).toBe(0);
  expect(amplitudeAt(lattice, 0, 16)).toBeGreaterThan(0);
});

test('a click a pixel or two off a spot lands on the spot', () => {
  expect(snapToPeak(lattice, { u: 14, v: 1 })).toStrictEqual({ u: 16, v: 0 });
  expect(snapToPeak(lattice, { u: -31, v: 17 })).toStrictEqual({
    u: -32,
    v: 16,
  });
  // The centre is only picked when aimed at, never by snapping towards it.
  expect(snapToPeak(lattice, { u: 1, v: 1 })).toStrictEqual({ u: 0, v: 0 });
  expect(snapToPeak(lattice, { u: 3, v: 0 })).not.toStrictEqual({ u: 0, v: 0 });
});

test('clicking a kept spot, or its mate, drops it', () => {
  const one = toggleSpot([{ u: 0, v: 0 }], { u: 16, v: 0 });

  expect(one).toStrictEqual([
    { u: 0, v: 0 },
    { u: 16, v: 0 },
  ]);
  expect(toggleSpot(one, { u: -16, v: 0 })).toStrictEqual([{ u: 0, v: 0 }]);
  expect(toggleSpot(one, { u: 0, v: 0 })).toStrictEqual([{ u: 16, v: 0 }]);

  let many: Array<{ u: number; v: number }> = [];
  for (let i = 1; i <= MAX_SPOTS + 5; i++) {
    many = toggleSpot(many, { u: i, v: 0 });
  }
  expect(many).toHaveLength(MAX_SPOTS);
  expect(many[0]).toStrictEqual({ u: 6, v: 0 });
});

test('the phases can be zeroed, kept alone, or borrowed from another picture', () => {
  const f = exampleById('letter-f');
  const arrow = exampleById('arrow');
  if (f === undefined || arrow === undefined) throw new Error('missing');
  const own = fourierTransform(exampleImage(f));
  const lender = fourierTransform(exampleImage(arrow));
  const row = FIELD_CENTRE + 5;
  const column = FIELD_CENTRE + 3;

  const zero = applyPhase(own, 'zero');
  expect(zero.im[row]?.[column]).toBe(0);
  expect(zero.re[row]?.[column]).toBeCloseTo(amplitudeAt(own, 3, 5), 9);

  const unit = applyPhase(own, 'unit');
  expect(amplitudeAt(unit, 3, 5)).toBeCloseTo(1, 12);
  expect(
    Math.atan2(unit.im[row]?.[column] ?? 0, unit.re[row]?.[column] ?? 0),
  ).toBeCloseTo(
    Math.atan2(own.im[row]?.[column] ?? 0, own.re[row]?.[column] ?? 0),
    12,
  );

  const swapped = applyPhase(own, 'swap', lender);
  expect(amplitudeAt(swapped, 3, 5)).toBeCloseTo(amplitudeAt(own, 3, 5), 9);
  expect(
    Math.atan2(swapped.im[row]?.[column] ?? 0, swapped.re[row]?.[column] ?? 0),
  ).toBeCloseTo(
    Math.atan2(lender.im[row]?.[column] ?? 0, lender.re[row]?.[column] ?? 0),
    12,
  );
  expect(applyPhase(own, 'measured')).toBe(own);
});

test('a region is whole pixels inside the field, and a click is not one', () => {
  expect(regionBetween(10, 20, 3, 60)).toStrictEqual({
    x: 3,
    y: 20,
    width: 8,
    height: 41,
  });
  expect(regionBetween(250, 250, 400, 400)).toStrictEqual({
    x: 250,
    y: 250,
    width: 6,
    height: 6,
  });
  expect(regionBetween(10, 10, 12, 40)).toBeNull();
});

test('only the region is transformed: the rest counts as black', () => {
  const image = new Float64Array(FIELD_SIZE * FIELD_SIZE).fill(1);
  const cut = cutToRegion(image, { x: 10, y: 20, width: 5, height: 4 });

  let sum = 0;
  for (const value of cut) sum += value;
  expect(sum).toBe(20);
  expect(cut[20 * FIELD_SIZE + 10]).toBe(1);
  expect(cut[19 * FIELD_SIZE + 10]).toBe(0);
  expect(cutToRegion(image, null)).toBe(image);
});

test('a region and the spots travel in a link, and junk in one is dropped', () => {
  expect(parseRegion('10,20,5,40')).toStrictEqual({
    x: 10,
    y: 20,
    width: 5,
    height: 40,
  });
  expect(formatRegion(parseRegion('10,20,5,40'))).toBe('10,20,5,40');
  expect(parseRegion('10,20,5')).toBeNull();
  expect(parseRegion('a,b,c,d')).toBeNull();
  expect(formatRegion(null)).toBe('');

  expect(parseSpots('0,0,16,0,16,0,x,1,200,0,-128,5,1.5,2,7')).toStrictEqual([
    { u: 0, v: 0 },
    { u: 16, v: 0 },
    { u: -128, v: 5 },
  ]);
  expect(
    formatSpots([
      { u: 0, v: 0 },
      { u: -16, v: 8 },
    ]),
  ).toBe('0,0,-16,8');
  expect(parseSpots('')).toStrictEqual([]);
});
