import { expect, test } from 'vitest';

import { dotProduct, vectorNorm } from '../../symmetry/point/vec3.ts';
import { cellAxes } from '../cellGeometry.ts';
import {
  principalAxisOf,
  sceneOrientation,
  threeQuarterView,
} from '../orientation.ts';
import type { Point3, SymmetryDrawing } from '../types.ts';

/** Water's C₂, along z, as the molecule workbench draws it. */
const AXIS: SymmetryDrawing = {
  kind: 'rotation',
  id: 'axis:z',
  label: 'C2',
  point: [0, 0, 0],
  direction: [0, 0, 1],
  length: 6,
  order: 2,
};

/** Its σv(xz): the plane of the molecule. */
const PLANE: SymmetryDrawing = {
  kind: 'mirror',
  id: 'plane:x',
  label: 'σv(xz)',
  point: [0, 0, 0],
  normal: [1, 0, 0],
  size: 5,
};

/** Its σv(yz), at right angles to the other. */
const OTHER_PLANE: SymmetryDrawing = {
  ...PLANE,
  id: 'plane:y',
  normal: [0, 1, 0],
};

/** How much of its length a rod draws, seen from `eye`. */
function rodLength(eye: Point3, direction: Point3): number {
  return Math.sqrt(1 - dotProduct(eye, direction) ** 2);
}

test('the view opens 65 degrees off the axis and 40 degrees round it', () => {
  const { eye } = threeQuarterView([0, 0, 1]);
  expect(eye[0]).toBeCloseTo(0.694272, 6);
  expect(eye[1]).toBeCloseTo(0.582563, 6);
  expect(eye[2]).toBeCloseTo(0.422618, 6);
  expect(vectorNorm(eye)).toBeCloseTo(1, 12);
});

test('water opens on a view where both mirror planes read as planes', () => {
  // The defect this module exists to fix: molstar opens looking down −z, where
  // a σv containing z is exactly edge-on and the C₂ is a dot behind the oxygen.
  const { eye } = sceneOrientation({
    elements: [AXIS, PLANE, OTHER_PLANE],
  });
  expect(Math.abs(dotProduct(eye, PLANE.normal))).toBeCloseTo(0.694272, 6);
  expect(Math.abs(dotProduct(eye, OTHER_PLANE.normal))).toBeCloseTo(
    0.582563,
    6,
  );
  expect(rodLength(eye, AXIS.direction)).toBeCloseTo(0.906308, 6);
});

test('a molecule built about x opens as readably as one built about z', () => {
  const along = threeQuarterView([1, 0, 0]);
  expect(rodLength(along.eye, [1, 0, 0])).toBeCloseTo(0.906308, 6);
  // And a plane holding that axis is as far from edge-on as water's second one
  // is from its own: the frame turns with the axis, the angles do not move.
  expect(Math.abs(dotProduct(along.eye, [0, 0, 1]))).toBeCloseTo(0.582563, 6);
  expect(Math.abs(dotProduct(along.eye, [0, 1, 0]))).toBeCloseTo(0.694272, 6);
});

test('up is a unit vector at right angles to the eye, tilted ten degrees', () => {
  const { eye, up } = threeQuarterView([0, 0, 1]);
  expect(vectorNorm(up)).toBeCloseTo(1, 12);
  expect(dotProduct(eye, up)).toBeCloseTo(0, 12);
  // The axis stands ten degrees off upright, which is what says the scene is a
  // solid seen in space rather than a diagram of one.
  const upright: Point3 = [-0.323744, -0.271654, 0.906308];
  expect(dotProduct(up, upright)).toBeCloseTo(Math.cos(Math.PI / 18), 5);
});

test('which way up the axis points does not change the view', () => {
  expect(threeQuarterView([0, 0, -1])).toStrictEqual(
    threeQuarterView([0, 0, 1]),
  );
  expect(threeQuarterView([0, -3, 0])).toStrictEqual(
    threeQuarterView([0, 2, 0]),
  );
});

test('the axis is the highest-order one, whatever order they were drawn in', () => {
  const sixfold: SymmetryDrawing = { ...AXIS, id: 'axis:c6', order: 6 };
  const twofold: SymmetryDrawing = {
    ...AXIS,
    id: 'axis:c2',
    direction: [1, 0, 0],
    order: 2,
  };
  expect(principalAxisOf([twofold, sixfold])).toStrictEqual([0, 0, 1]);
  expect(principalAxisOf([sixfold, twofold])).toStrictEqual([0, 0, 1]);
});

test('with no axis drawn the view is measured off a plane instead', () => {
  expect(principalAxisOf([PLANE, OTHER_PLANE])).toStrictEqual([1, 0, 0]);
  const { eye } = sceneOrientation({ elements: [PLANE, OTHER_PLANE] });
  // 65 degrees off the normal: the plane is seen at 42% of its face, so it is
  // a plane and not a line.
  expect(Math.abs(dotProduct(eye, PLANE.normal))).toBeCloseTo(0.422618, 6);
});

test('an inversion centre on its own points nowhere', () => {
  const centre: SymmetryDrawing = {
    kind: 'inversion',
    id: 'inversion',
    label: 'i',
    point: [0, 0, 0],
  };
  expect(principalAxisOf([centre])).toBeNull();
  expect(principalAxisOf([])).toBeNull();
});

test('a scene that draws nothing still opens off the world axis', () => {
  expect(sceneOrientation({})).toStrictEqual(threeQuarterView([0, 0, 1]));
});

test('a crystal is framed on its cell, and every edge of it reads', () => {
  // Quartz: a hexagonal cell, where a view down c would draw the box as a
  // rhombus and stack every atom of the column onto one disc.
  const cell = {
    a: 4.913,
    b: 4.913,
    c: 5.405,
    alpha: 90,
    beta: 90,
    gamma: 120,
  };
  const { eye } = sceneOrientation({ cell });
  const [a, b, c] = cellAxes(cell);
  expect(eye[0]).toBeCloseTo(0.694272, 6);
  expect(eye[1]).toBeCloseTo(0.582563, 6);
  expect(eye[2]).toBeCloseTo(0.422618, 6);
  // No edge of the box is pointing at the camera, so none of the three
  // collapses to a point.
  expect(rodLength(eye, unit(a))).toBeCloseTo(0.7197127, 6);
  expect(rodLength(eye, unit(b))).toBeCloseTo(0.9875383, 6);
  expect(rodLength(eye, unit(c))).toBeCloseTo(0.906308, 6);
});

test('a reference along the axis is no reference, and one is chosen instead', () => {
  // A cell whose a edge somehow lay along c would otherwise leave the azimuth
  // measured from nothing.
  expect(threeQuarterView([0, 0, 1], [0, 0, 4])).toStrictEqual(
    threeQuarterView([0, 0, 1]),
  );
});

test('a drawing with no direction at all is skipped', () => {
  const nowhere: SymmetryDrawing = {
    ...AXIS,
    id: 'axis:0',
    direction: [0, 0, 0],
    order: 6,
  };
  expect(principalAxisOf([nowhere, AXIS])).toStrictEqual([0, 0, 1]);
});

/** A cell edge, as a direction. */
function unit(vector: Point3): Point3 {
  const length = vectorNorm(vector);
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}
