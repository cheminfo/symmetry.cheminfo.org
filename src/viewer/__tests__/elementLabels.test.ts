import { expect, test } from 'vitest';

import { drawingLabels, spacedLabels } from '../elementLabels.ts';
import type { ElementStyle } from '../primitives.ts';
import { resolveElementStyle } from '../primitives.ts';
import type { Point3, SymmetryDrawing } from '../types.ts';

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

test("an axis label sits past the end of its rod, a plane's past the edge", () => {
  const axis: SymmetryDrawing = {
    kind: 'rotation',
    id: 'c2',
    label: 'C2',
    point: [0, 0, 0],
    direction: [0, 0, 1],
    length: 4,
    order: 2,
  };
  expect(drawingLabels(axis, STYLE)).toStrictEqual([
    { text: 'C2', position: [0, 0, 2.5], size: 0.5 },
  ]);
  const plane: SymmetryDrawing = {
    kind: 'mirror',
    id: 'sv',
    label: 'σv',
    point: [0, 0, 0],
    normal: [0, 0, 1],
    size: 6,
  };
  // The label rides the first corner of the face, pushed out along the
  // diagonal, so it follows a plane clipped to the cell rather than floating
  // off a fixed offset the clipped face no longer reaches.
  const gap = 0.5 / Math.SQRT2;
  const [planeLabel] = drawingLabels(plane, STYLE);
  expect(planeLabel?.text).toBe('σv');
  expect(planeLabel?.size).toBe(0.5);
  expect(planeLabel?.position[0]).toBeCloseTo(-3 - gap, 9);
  expect(planeLabel?.position[1]).toBeCloseTo(-3 - gap, 9);
  expect(planeLabel?.position[2]).toBe(0);
});

test('an unnamed element gets no label', () => {
  expect(
    drawingLabels(
      { kind: 'inversion', id: 'i', label: '', point: [0, 0, 0] },
      STYLE,
    ),
  ).toStrictEqual([]);
});

test("an inversion centre's label sits above the ball, having no direction", () => {
  expect(
    drawingLabels(
      { kind: 'inversion', id: 'i', label: '-1', point: [1, 2, 3] },
      STYLE,
    ),
  ).toStrictEqual([{ text: '-1', position: [1, 2, 3.75], size: 0.5 }]);
});

test('a badge is written on the element in place of the whole label', () => {
  const drawing: SymmetryDrawing = {
    kind: 'rotation',
    id: 'c2',
    label: '2 along [010]',
    badge: '2',
    point: [0, 0, 0],
    direction: [0, 0, 1],
    length: 4,
    order: 2,
  };
  expect(drawingLabels(drawing, STYLE)[0]?.text).toBe('2');
});

test('the second name in one spot is dropped, and a name elsewhere is kept', () => {
  const style = resolveElementStyle(STYLE);
  const taken: Point3[] = [];
  const first: SymmetryDrawing = {
    kind: 'inversion',
    id: 'a',
    label: '-1',
    point: [0, 0, 0],
  };
  const same: SymmetryDrawing = { ...first, id: 'b', label: 'i' };
  const elsewhere: SymmetryDrawing = { ...first, id: 'c', point: [5, 0, 0] };
  expect(spacedLabels(first, style, taken)).toStrictEqual([
    { text: '-1', position: [0, 0, 0.75], size: 0.5 },
  ]);
  expect(spacedLabels(same, style, taken)).toStrictEqual([]);
  expect(spacedLabels(elsewhere, style, taken)).toStrictEqual([
    { text: '-1', position: [5, 0, 0.75], size: 0.5 },
  ]);
  expect(taken).toStrictEqual([
    [0, 0, 0.75],
    [5, 0, 0.75],
  ]);
});
