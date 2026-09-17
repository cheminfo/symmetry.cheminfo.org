import { expect, test } from 'vitest';

import { drawingPrimitives, elementGroups } from '../elementDrawing.ts';
import type { ElementStyle } from '../primitives.ts';
import type { SymmetryDrawing } from '../types.ts';

/** Round numbers, so an expected value can be written down exactly. */
const STYLE: ElementStyle = {
  axisRadius: 0.1,
  arrowRadius: 0.2,
  arrowLength: 0.5,
  centreRadius: 0.25,
  arrowOffset: 5,
  dashSegments: 7,
  labelSize: 0.5,
  labelGap: 0.5,
};

test('a rotation axis is one rod, centred on its point', () => {
  const drawing: SymmetryDrawing = {
    kind: 'rotation',
    id: 'c3',
    label: 'C3',
    point: [0, 0, 0],
    direction: [0, 0, 2],
    length: 4,
    order: 3,
  };
  expect(drawingPrimitives(drawing, STYLE)).toStrictEqual([
    { shape: 'rod', start: [0, 0, -2], end: [0, 0, 2], radius: 0.1 },
  ]);
});

test('a screw axis carries an arrow as long as its pitch, beside the rod', () => {
  const drawing: SymmetryDrawing = {
    kind: 'screw',
    id: '21',
    label: '2₁',
    point: [0, 0, 0],
    direction: [0, 0, 1],
    length: 4,
    order: 2,
    pitch: 3,
  };
  expect(drawingPrimitives(drawing, STYLE)).toStrictEqual([
    { shape: 'rod', start: [0, 0, -2], end: [0, 0, 2], radius: 0.1 },
    { shape: 'rod', start: [0.5, 0, 0], end: [0.5, 0, 2.5], radius: 0.1 },
    { shape: 'cone', base: [0.5, 0, 2.5], tip: [0.5, 0, 3], radius: 0.2 },
  ]);
});

test('a left-handed screw points its arrow the other way', () => {
  const drawing: SymmetryDrawing = {
    kind: 'screw',
    id: '32',
    label: '3₂',
    point: [0, 0, 0],
    direction: [0, 0, 1],
    length: 4,
    order: 3,
    pitch: -3,
  };
  const primitives = drawingPrimitives(drawing, STYLE);
  expect(primitives[2]).toStrictEqual({
    shape: 'cone',
    base: [0.5, 0, -2.5],
    tip: [0.5, 0, -3],
    radius: 0.2,
  });
});

test('a screw of no pitch draws no arrow at all', () => {
  const drawing: SymmetryDrawing = {
    kind: 'screw',
    id: '2',
    label: '2',
    point: [0, 0, 0],
    direction: [0, 0, 1],
    length: 4,
    order: 2,
    pitch: 0,
  };
  expect(drawingPrimitives(drawing, STYLE)).toHaveLength(1);
});

test('a mirror plane is one square, spanned by the frame of its normal', () => {
  const drawing: SymmetryDrawing = {
    kind: 'mirror',
    id: 'sh',
    label: 'σh',
    point: [0, 0, 1],
    normal: [0, 0, 1],
    size: 6,
  };
  expect(drawingPrimitives(drawing, STYLE)).toStrictEqual([
    {
      shape: 'plate',
      centre: [0, 0, 1],
      major: [1, 0, 0],
      minor: [0, 1, 0],
      size: 6,
    },
  ]);
});

test('a glide plane adds its glide vector as an arrow lying in the plane', () => {
  const drawing: SymmetryDrawing = {
    kind: 'glide',
    id: 'c',
    label: 'c',
    point: [0, 0, 0],
    normal: [0, 0, 1],
    size: 6,
    glide: [1.5, 0, 0],
  };
  expect(drawingPrimitives(drawing, STYLE)).toStrictEqual([
    {
      shape: 'plate',
      centre: [0, 0, 0],
      major: [1, 0, 0],
      minor: [0, 1, 0],
      size: 6,
    },
    { shape: 'rod', start: [0, 0, 0], end: [1, 0, 0], radius: 0.1 },
    { shape: 'cone', base: [1, 0, 0], tip: [1.5, 0, 0], radius: 0.2 },
  ]);
});

test('a rotoinversion is a broken rod with a ball at the point it inverts through', () => {
  const drawing: SymmetryDrawing = {
    kind: 'rotoinversion',
    id: 'm4',
    label: '-4',
    point: [0, 0, 0],
    direction: [0, 0, 1],
    length: 4,
    order: 4,
  };
  expect(drawingPrimitives(drawing, STYLE)).toStrictEqual([
    {
      shape: 'dashes',
      start: [0, 0, -2],
      end: [0, 0, 2],
      radius: 0.1,
      segments: 7,
    },
    { shape: 'sphere', centre: [0, 0, 0], radius: 0.25 },
  ]);
});

test('an inversion centre is one ball', () => {
  const drawing: SymmetryDrawing = {
    kind: 'inversion',
    id: 'i',
    label: 'i',
    point: [1, 2, 3],
  };
  expect(drawingPrimitives(drawing, STYLE)).toStrictEqual([
    { shape: 'sphere', centre: [1, 2, 3], radius: 0.25 },
  ]);
});

test('a group takes the colour of its kind unless the drawing names one', () => {
  const groups = elementGroups(
    [
      {
        kind: 'rotation',
        id: 'c3',
        label: 'C3',
        point: [0, 0, 0],
        direction: [0, 0, 1],
        length: 4,
        order: 3,
      },
      {
        kind: 'inversion',
        id: 'i',
        label: 'i',
        point: [0, 0, 0],
        colour: '#123456',
      },
    ],
    { style: STYLE },
  );
  expect(groups.map((group) => group.colour)).toStrictEqual([
    '#1d4ed8',
    '#123456',
  ]);
  expect(groups.map((group) => group.id)).toStrictEqual(['c3', 'i']);
  expect(groups[0]?.labels).toHaveLength(1);
});

test('labels: false leaves the shapes and drops the text', () => {
  const groups = elementGroups(
    [
      {
        kind: 'rotation',
        id: 'c3',
        label: 'C3',
        point: [0, 0, 0],
        direction: [0, 0, 1],
        length: 4,
        order: 3,
      },
    ],
    { style: STYLE, labels: false },
  );
  expect(groups[0]?.primitives).toHaveLength(1);
  expect(groups[0]?.labels).toStrictEqual([]);
});
