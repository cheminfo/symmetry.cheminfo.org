import { expect, test } from 'vitest';

import type { SymmetryElement } from '../../symmetry/core/index.ts';
import {
  createLattice,
  parseOperation,
  symmetryElements,
} from '../../symmetry/core/index.ts';
import { crystalElementDrawing } from '../crystalDrawing.ts';
import type { UnitCell } from '../types.ts';

/** P2₁/c, unique axis b: a 2₁ along b, a centre at the origin, a c glide. */
const P21C = ['x,y,z', '-x,y+1/2,-z+1/2', '-x,-y,-z', 'x,-y+1/2,z+1/2'].map(
  (triplet) => parseOperation(triplet, 3),
);

const CELL: UnitCell = { a: 5, b: 6, c: 7, alpha: 90, beta: 105, gamma: 90 };

const LATTICE = createLattice(CELL);

const ELEMENTS = symmetryElements(P21C);

function elementOf(kind: SymmetryElement['kind']): SymmetryElement {
  const found = ELEMENTS.find((element) => element.kind === kind);
  if (found === undefined) throw new Error(`no ${kind} in P2_1/c`);
  return found;
}

test('P2_1/c decomposes into the four elements this test draws', () => {
  expect(ELEMENTS.map((element) => element.symbol).toSorted()).toStrictEqual([
    '-1',
    '1',
    '2_1',
    'c',
  ]);
});

test('the 2_1 screw points along b and its pitch is half the b edge', () => {
  const drawing = crystalElementDrawing(elementOf('screw'), LATTICE, {
    id: 'screw',
  });
  expect(drawing?.kind).toBe('screw');
  if (drawing?.kind !== 'screw') return;
  expect(drawing.label).toBe('2_1');
  expect(drawing.order).toBe(2);
  expect(drawing.pitch).toBeCloseTo(3, 10);
  expect(drawing.direction[0]).toBeCloseTo(0, 10);
  expect(drawing.direction[1]).toBeCloseTo(6, 10);
  expect(drawing.direction[2]).toBeCloseTo(0, 10);
  // It runs through (0, y, 1/4), which is c/4 from the origin.
  expect(drawing.point[0]).toBeCloseTo(0.25 * 7 * Math.cos(RADIANS_105), 10);
  expect(drawing.point[1]).toBeCloseTo(0, 10);
  expect(drawing.point[2]).toBeCloseTo(0.25 * 7 * Math.sin(RADIANS_105), 10);
});

test('the inversion centre sits at the origin', () => {
  const drawing = crystalElementDrawing(elementOf('inversion'), LATTICE, {
    id: 'centre',
  });
  expect(drawing?.kind).toBe('inversion');
  expect(drawing?.kind === 'inversion' ? drawing.point : null).toStrictEqual([
    0, 0, 0,
  ]);
});

test('the c glide sits at y = 1/4 and glides along c, in the plane', () => {
  const element = elementOf('glide');
  const drawing = crystalElementDrawing(element, LATTICE, { id: 'glide' });
  expect(drawing?.kind).toBe('glide');
  if (drawing?.kind !== 'glide') return;
  expect(drawing.point[1]).toBeCloseTo(1.5, 10);
  // The glide is c/2, which in this cell leans out of the a direction.
  expect(drawing.glide[0]).toBeCloseTo(0.5 * 7 * Math.cos(RADIANS_105), 10);
  expect(drawing.glide[1]).toBeCloseTo(0, 10);
  expect(drawing.glide[2]).toBeCloseTo(0.5 * 7 * Math.sin(RADIANS_105), 10);
  // A glide vector lies in its own plane.
  expect(dot(drawing.glide, drawing.normal)).toBeCloseTo(0, 12);
});

test('a plane normal is taken in reciprocal space, so it is normal to the plane itself', () => {
  // A monoclinic cell is where a direct-space normal goes wrong: (h k l) and
  // [u v w] differ once the cell is not orthogonal.
  const oblique = createLattice({
    a: 5,
    b: 6,
    c: 7,
    alpha: 80,
    beta: 105,
    gamma: 95,
  });
  const element = elementOf('glide');
  const drawing = crystalElementDrawing(element, oblique, { id: 'glide' });
  if (drawing?.kind !== 'glide') throw new Error('expected a glide');
  expect(element.span).toHaveLength(2);
  for (const direction of element.span) {
    expect(
      dot(drawing.normal, toCartesian(oblique.cartesian, direction)),
    ).toBeCloseTo(0, 12);
  }
});

test('a shift draws the same element one cell along', () => {
  const drawing = crystalElementDrawing(elementOf('inversion'), LATTICE, {
    id: 'centre',
    shift: [1, 0, 0],
  });
  expect(drawing?.kind === 'inversion' ? drawing.point[0] : null).toBeCloseTo(
    5,
    10,
  );
});

test('the identity has nothing to draw', () => {
  expect(
    crystalElementDrawing(elementOf('identity'), LATTICE, { id: 'e' }),
  ).toBeNull();
});

test('a two-dimensional element is refused: the plane groups are drawn in SVG', () => {
  const plane = symmetryElements([parseOperation('-x,y', 2)]);
  expect(() =>
    crystalElementDrawing(plane[0] as SymmetryElement, LATTICE, { id: 'm' }),
  ).toThrow(RangeError);
});

test('a pure rotation axis points along the direction it is named for', () => {
  const element = symmetryElements(
    ['x,y,z', '-x,y,-z'].map((triplet) => parseOperation(triplet, 3)),
  ).find((one) => one.kind === 'rotation');
  const drawing = crystalElementDrawing(element as SymmetryElement, LATTICE, {
    id: 'two',
    length: 10,
  });
  if (drawing?.kind !== 'rotation') throw new Error('expected a rotation');
  expect(drawing.label).toBe('2');
  expect(drawing.order).toBe(2);
  expect(drawing.length).toBe(10);
  expect(drawing.direction[1]).toBeCloseTo(6, 10);
});

test('a -4 axis comes back as a rotoinversion, with its point on the axis', () => {
  const tetragonal = createLattice({
    a: 5,
    b: 5,
    c: 7,
    alpha: 90,
    beta: 90,
    gamma: 90,
  });
  const element = symmetryElements(
    ['x,y,z', '-x,-y,z', 'y,-x,-z', '-y,x,-z'].map((triplet) =>
      parseOperation(triplet, 3),
    ),
  ).find((one) => one.kind === 'rotoinversion');
  const drawing = crystalElementDrawing(
    element as SymmetryElement,
    tetragonal,
    {
      id: 'bar4',
    },
  );
  if (drawing?.kind !== 'rotoinversion') {
    throw new Error('expected a rotoinversion');
  }
  expect(drawing.label).toBe('-4');
  expect(drawing.order).toBe(4);
  expect(drawing.direction[2]).toBeCloseTo(7, 10);
  expect(drawing.point).toStrictEqual([0, 0, 0]);
});

test('a plain mirror keeps its size and carries no glide', () => {
  const element = symmetryElements(
    ['x,y,z', 'x,-y,z'].map((triplet) => parseOperation(triplet, 3)),
  ).find((one) => one.kind === 'mirror');
  const drawing = crystalElementDrawing(element as SymmetryElement, LATTICE, {
    id: 'm',
    size: 12,
  });
  if (drawing?.kind !== 'mirror') throw new Error('expected a mirror');
  expect(drawing.label).toBe('m');
  expect(drawing.size).toBe(12);
  expect(drawing.normal[1]).toBeCloseTo(1 / 6, 10);
});

const RADIANS_105 = (105 * Math.PI) / 180;

function dot(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function toCartesian(
  matrix: readonly number[][],
  point: readonly number[],
): [number, number, number] {
  const image: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    let sum = 0;
    for (let j = 0; j < 3; j++) {
      sum += (matrix[i]?.[j] ?? 0) * (point[j] ?? 0);
    }
    image[i] = sum;
  }
  return image;
}
