import { expect, test } from 'vitest';

import { createLattice } from '../../symmetry/core/index.ts';
import { dotProduct } from '../../symmetry/point/vec3.ts';
import {
  normalToCartesian,
  normalToFractional,
  toCartesian,
  toFractional,
} from '../latticeBasis.ts';

/** No two edges alike and no right angle: where the two roads across differ. */
const TRICLINIC = createLattice({
  a: 5,
  b: 6,
  c: 7,
  alpha: 80,
  beta: 105,
  gamma: 95,
});

test('the first fractional axis is the a edge, along x by convention', () => {
  const a = toCartesian(TRICLINIC, [1, 0, 0]);
  expect(a[0]).toBeCloseTo(5, 9);
  expect(a[1]).toBeCloseTo(0, 9);
  expect(a[2]).toBeCloseTo(0, 9);
});

test('a point read into Cartesian and back is the point it started as', () => {
  const back = toFractional(
    TRICLINIC,
    toCartesian(TRICLINIC, [0.25, 0.5, 0.8]),
  );
  expect(back[0]).toBeCloseTo(0.25, 9);
  expect(back[1]).toBeCloseTo(0.5, 9);
  expect(back[2]).toBeCloseTo(0.8, 9);
});

test('the (001) normal stands at right angles to a and b; [001] does not', () => {
  const a = toCartesian(TRICLINIC, [1, 0, 0]);
  const b = toCartesian(TRICLINIC, [0, 1, 0]);
  const normal = normalToCartesian(TRICLINIC, [0, 0, 1]);
  expect(dotProduct(normal, a)).toBeCloseTo(0, 12);
  expect(dotProduct(normal, b)).toBeCloseTo(0, 12);
  // Taking the direct-space direction instead is the classic way to draw a
  // mirror at the wrong tilt: c leans 105° off a, so it is 8.7 Å² from normal.
  expect(dotProduct(toCartesian(TRICLINIC, [0, 0, 1]), a)).toBeCloseTo(
    5 * 7 * Math.cos((105 * Math.PI) / 180),
    9,
  );
});

test('a height read in fractions equals the same height read in ångström', () => {
  const normal = [0.3, -0.7, 0.5] as const;
  const offset = [0.2, 0.4, -0.1] as const;
  expect(dotProduct(normalToFractional(TRICLINIC, normal), offset)).toBeCloseTo(
    dotProduct(normal, toCartesian(TRICLINIC, offset)),
    9,
  );
});
