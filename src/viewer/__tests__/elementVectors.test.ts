import { expect, test } from 'vitest';

import type { SymmetryElement } from '../../symmetry/core/index.ts';
import {
  createLattice,
  parseOperation,
  symmetryElements,
} from '../../symmetry/core/index.ts';
import {
  axisDirection,
  intrinsicVector,
  planeNormal,
} from '../elementVectors.ts';

const LATTICE = createLattice({
  a: 5,
  b: 6,
  c: 7,
  alpha: 90,
  beta: 105,
  gamma: 90,
});

/** The mirror at y = 0 and the two-fold along b, one element each. */
const MIRROR = elementOf(['x,y,z', 'x,-y,z'], 'mirror');
const ROTATION = elementOf(['x,y,z', '-x,y,-z'], 'rotation');

test('the two-fold along b points along the b edge, six ångström long', () => {
  const direction = axisDirection(LATTICE, ROTATION);
  expect(direction[0]).toBeCloseTo(0, 12);
  expect(direction[1]).toBeCloseTo(6, 12);
  expect(direction[2]).toBeCloseTo(0, 12);
});

test('asking a mirror for its axis says so, naming the element', () => {
  expect(() => axisDirection(LATTICE, MIRROR)).toThrow(
    'the m element carries no axis.',
  );
});

test('asking an axis for its plane normal says so, naming the element', () => {
  expect(() => planeNormal(LATTICE, ROTATION)).toThrow(
    'the 2 element carries no normal.',
  );
});

test('a plain mirror translates by nothing, so its glide vector is zero', () => {
  expect(intrinsicVector(LATTICE, MIRROR)).toStrictEqual([0, 0, 0]);
});

function elementOf(
  triplets: readonly string[],
  kind: SymmetryElement['kind'],
): SymmetryElement {
  const found = symmetryElements(
    triplets.map((triplet) => parseOperation(triplet, 3)),
  ).find((element) => element.kind === kind);
  if (found === undefined) throw new Error(`no ${kind} in ${String(triplets)}`);
  return found;
}
