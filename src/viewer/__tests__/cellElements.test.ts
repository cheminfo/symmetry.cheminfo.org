import { expect, test } from 'vitest';

import type { SymmetryElement } from '../../symmetry/core/index.ts';
import {
  createLattice,
  elementKey,
  parseOperation,
  symmetryElements,
} from '../../symmetry/core/index.ts';
import { cellSection } from '../cellClip.ts';
import { NO_SHIFT, cellShiftFor, cellShifts } from '../cellElements.ts';
import { elementLocus } from '../crystalDrawing.ts';

/**
 * Part of P 4/m -3 2/m: the three mirrors on the cell faces and the one on the
 * diagonal, which is the one that misses its own cell.
 */
const PM3M = ['x,y,z', 'x,y,-z', 'x,-y,z', '-x,y,z', '-y,-x,z'].map((triplet) =>
  parseOperation(triplet, 3),
);

const LATTICE = createLattice({
  a: 4,
  b: 4,
  c: 4,
  alpha: 90,
  beta: 90,
  gamma: 90,
});

const ELEMENTS = symmetryElements(PM3M);

function mirrorNormalTo(normal: readonly number[]): SymmetryElement {
  const found = ELEMENTS.find(
    (element) =>
      element.kind === 'mirror' &&
      element.normal?.join(' ') === normal.join(' '),
  );
  if (found === undefined) throw new Error(`no m ⟂ (${normal.join(' ')})`);
  return found;
}

test('a plane that already cuts the cell is drawn where it is', () => {
  expect(cellShiftFor(mirrorNormalTo([0, 0, 1]), LATTICE)).toStrictEqual(
    NO_SHIFT,
  );
  expect(cellShiftFor(mirrorNormalTo([1, 0, 0]), LATTICE)).toStrictEqual(
    NO_SHIFT,
  );
});

test('a diagonal plane through the origin is drawn one cell over, where it cuts', () => {
  // m ⟂ (110) through the origin meets the cell along one edge and nothing
  // else; the same element one b over is the diagonal that halves the cell.
  const element = mirrorNormalTo([1, 1, 0]);
  expect(
    cellSection(LATTICE, locusPoint(element, NO_SHIFT), [1, 1, 0]),
  ).toEqual([]);

  const shift = cellShiftFor(element, LATTICE);
  expect(shift).toStrictEqual([0, 1, 0]);
  const corners = cellSection(LATTICE, locusPoint(element, shift), [1, 1, 0]);
  expect(corners).toHaveLength(4);
  // 4 Å up the c axis by 4√2 Å across the face diagonal.
  expect(area(corners)).toBeCloseTo(4 * 4 * Math.SQRT2, 6);
});

test('every element of the cell gets a shift, keyed the way the drawings are', () => {
  const shifts = cellShifts(ELEMENTS, LATTICE, elementKey);
  expect(shifts.size).toBe(ELEMENTS.length);
  for (const element of ELEMENTS) {
    expect(shifts.has(elementKey(element))).toBe(true);
  }
  // The identity has nothing to place, so it stays where it is.
  const identity = ELEMENTS.find((element) => element.kind === 'identity');
  if (identity === undefined) throw new Error('no identity in P m -3 m');
  expect(shifts.get(elementKey(identity))).toStrictEqual(NO_SHIFT);
});

/** Where the element sits, Cartesian, drawn in the cell `shift` cells over. */
function locusPoint(
  element: SymmetryElement,
  shift: readonly [number, number, number],
) {
  const locus = elementLocus(element, LATTICE, shift);
  if (locus === null) throw new Error(`${element.symbol} has no locus`);
  return locus.point;
}

/** The area of a convex polygon, as the fan of triangles it is drawn as. */
function area(corners: ReadonlyArray<readonly number[]>): number {
  let total = 0;
  const first = corners[0] ?? [0, 0, 0];
  for (let index = 1; index + 1 < corners.length; index++) {
    const second = corners[index] ?? first;
    const third = corners[index + 1] ?? first;
    const u = [0, 1, 2].map((i) => (second[i] ?? 0) - (first[i] ?? 0));
    const v = [0, 1, 2].map((i) => (third[i] ?? 0) - (first[i] ?? 0));
    total +=
      Math.hypot(
        (u[1] ?? 0) * (v[2] ?? 0) - (u[2] ?? 0) * (v[1] ?? 0),
        (u[2] ?? 0) * (v[0] ?? 0) - (u[0] ?? 0) * (v[2] ?? 0),
        (u[0] ?? 0) * (v[1] ?? 0) - (u[1] ?? 0) * (v[0] ?? 0),
      ) / 2;
  }
  return total;
}
