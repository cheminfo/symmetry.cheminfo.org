import { expect, test } from 'vitest';

import { createLattice } from '../../symmetry/core/index.ts';
import { cellSection, clipLineToCell } from '../cellClip.ts';
import { normalToCartesian, toCartesian } from '../latticeBasis.ts';
import type { Point3 } from '../types.ts';

/** A 10 Å cube, where the answer can be read off the drawing. */
const CUBIC = createLattice({
  a: 10,
  b: 10,
  c: 10,
  alpha: 90,
  beta: 90,
  gamma: 90,
});

/** No two edges alike and no right angle, where it cannot. */
const TRICLINIC = createLattice({
  a: 5,
  b: 6,
  c: 7,
  alpha: 80,
  beta: 105,
  gamma: 95,
});

test('a plane through the middle of a cube cuts a square out of it', () => {
  expectPoints(cellSection(CUBIC, [0, 0, 5], [0, 0, 1]), [
    [0, 0, 5],
    [10, 0, 5],
    [10, 10, 5],
    [0, 10, 5],
  ]);
});

test('a plane on a diagonal of the cube cuts the rectangle across it', () => {
  // x + y = 10 runs corner to corner: 10 Å up and 10√2 Å across.
  expectPoints(cellSection(CUBIC, [10, 0, 0], [1, 1, 0]), [
    [0, 10, 10],
    [10, 0, 10],
    [10, 0, 0],
    [0, 10, 0],
  ]);
});

test('a plane past the cube cuts nothing out of it', () => {
  expect(cellSection(CUBIC, [0, 0, 20], [0, 0, 1])).toStrictEqual([]);
});

test('a plane that only touches one corner cuts nothing out of it', () => {
  expect(cellSection(CUBIC, [0, 0, 0], [1, 1, 1])).toStrictEqual([]);
});

test('a plane lying exactly on a face comes back as that whole face', () => {
  expectPoints(cellSection(CUBIC, [0, 0, 0], [0, 0, 1]), [
    [0, 0, 0],
    [10, 0, 0],
    [10, 10, 0],
    [0, 10, 0],
  ]);
});

test('a box of two cells is cut at its own faces, not at the first cell', () => {
  expectPoints(cellSection(CUBIC, [0, 0, 5], [0, 0, 1], 2), [
    [0, 0, 5],
    [20, 0, 5],
    [20, 20, 5],
    [0, 20, 5],
  ]);
});

test('the (111) plane at x+y+z=1/2 cuts a triangle off a triclinic cell', () => {
  // The three corners are the half-way points of a, b and c. Taking the normal
  // as the direct-space [111] instead would tilt the plane and cut a
  // quadrilateral, which is what makes this cell worth testing.
  const section = cellSection(
    TRICLINIC,
    toCartesian(TRICLINIC, [0.5, 0, 0]),
    normalToCartesian(TRICLINIC, [1, 1, 1]),
  );
  expectPoints(section, [
    toCartesian(TRICLINIC, [0, 0, 0.5]),
    toCartesian(TRICLINIC, [0.5, 0, 0]),
    toCartesian(TRICLINIC, [0, 0.5, 0]),
  ]);
});

test('the plane halfway up c cuts the triclinic cell at its four c edges', () => {
  const section = cellSection(
    TRICLINIC,
    toCartesian(TRICLINIC, [0, 0, 0.5]),
    normalToCartesian(TRICLINIC, [0, 0, 1]),
  );
  expectPoints(section, [
    toCartesian(TRICLINIC, [0, 0, 0.5]),
    toCartesian(TRICLINIC, [1, 0, 0.5]),
    toCartesian(TRICLINIC, [1, 1, 0.5]),
    toCartesian(TRICLINIC, [0, 1, 0.5]),
  ]);
});

test('a line is trimmed to where it enters and leaves the cube', () => {
  const segment = clipLineToCell(CUBIC, [5, 5, -3], [0, 0, 2]);
  expectPoints(segmentPoints(segment), [
    [5, 5, 0],
    [5, 5, 10],
  ]);
});

test('a line across the cube leaves by the face it reaches first', () => {
  // [1, 2, 0] from the origin hits y = 10 at x = 5, not x = 10 at y = 20.
  expectPoints(segmentPoints(clipLineToCell(CUBIC, [0, 0, 0], [1, 2, 0])), [
    [0, 0, 0],
    [5, 10, 0],
  ]);
});

test('the body diagonal runs corner to corner', () => {
  expectPoints(segmentPoints(clipLineToCell(CUBIC, [0, 0, 0], [1, 1, 1])), [
    [0, 0, 0],
    [10, 10, 10],
  ]);
});

test('a box of two cells trims the line at its own far face', () => {
  expectPoints(segmentPoints(clipLineToCell(CUBIC, [5, 5, 0], [0, 0, 1], 2)), [
    [5, 5, 0],
    [5, 5, 20],
  ]);
});

test('a line beside the cube misses it', () => {
  expect(clipLineToCell(CUBIC, [15, 5, 5], [0, 0, 1])).toBeNull();
});

test('a line lying along an edge is kept; one just outside it is not', () => {
  expectPoints(segmentPoints(clipLineToCell(CUBIC, [0, 0, 0], [1, 0, 0])), [
    [0, 0, 0],
    [10, 0, 0],
  ]);
  expect(clipLineToCell(CUBIC, [0, -1e-3, 0], [1, 0, 0])).toBeNull();
});

test('a direction of no length is no line at all', () => {
  expect(clipLineToCell(CUBIC, [5, 5, 5], [0, 0, 0])).toBeNull();
});

test('the c axis of a triclinic cell is trimmed to the ab faces', () => {
  const segment = clipLineToCell(
    TRICLINIC,
    toCartesian(TRICLINIC, [0.5, 0.5, 0]),
    toCartesian(TRICLINIC, [0, 0, 1]),
  );
  expectPoints(segmentPoints(segment), [
    toCartesian(TRICLINIC, [0.5, 0.5, 0]),
    toCartesian(TRICLINIC, [0.5, 0.5, 1]),
  ]);
});

/** The two ends, so a segment is asserted the same way a polygon is. */
function segmentPoints(
  segment: { readonly start: Point3; readonly end: Point3 } | null,
): Point3[] {
  if (segment === null) {
    throw new Error('the line was expected to meet the box');
  }
  return [segment.start, segment.end];
}

/**
 * Every corner, in order, to nine decimals — `cos(90°)` is 6e-17 rather than
 * zero, so a right-angled cell is never bit-exact.
 */
function expectPoints(
  actual: readonly Point3[],
  expected: readonly Point3[],
): void {
  expect(actual).toHaveLength(expected.length);
  for (let index = 0; index < expected.length; index++) {
    const got = actual[index];
    const want = expected[index];
    for (let axis = 0; axis < 3; axis++) {
      expect(got?.[axis]).toBeCloseTo(want?.[axis] ?? Number.NaN, 9);
    }
  }
}
