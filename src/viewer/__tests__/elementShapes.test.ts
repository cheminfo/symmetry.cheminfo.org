import { expect, test } from 'vitest';

import { arrow, faceCorners, planeFace, rodEnds } from '../elementShapes.ts';
import { resolveElementStyle } from '../primitives.ts';
import type { MirrorDrawing } from '../types.ts';

const SIZES = resolveElementStyle({ arrowLength: 0.5, rimRadius: 0.03 });

/** A mirror with no outline, so it falls back to a square of `size`. */
const SQUARE_PLANE: MirrorDrawing = {
  kind: 'mirror',
  id: 'm',
  label: 'm',
  point: [0, 0, 0],
  normal: [0, 0, 1],
  size: 6,
};

test('a rod of length 4 reaches two units either side of its point', () => {
  expect(rodEnds([0, 0, 0], [0, 0, 2], 4)).toStrictEqual([
    [0, 0, -2],
    [0, 0, 2],
  ]);
});

test('a plane with no outline is drawn as a square of its size', () => {
  expect(faceCorners(SQUARE_PLANE)).toStrictEqual([
    [-3, -3, 0],
    [3, -3, 0],
    [3, 3, 0],
    [-3, 3, 0],
  ]);
  expect(planeFace(SQUARE_PLANE, SIZES)).toStrictEqual([
    {
      shape: 'plate',
      centre: [0, 0, 0],
      major: [1, 0, 0],
      minor: [0, 1, 0],
      size: 6,
    },
  ]);
});

test('a plane cut to a cell is drawn as that face, with a rod round its rim', () => {
  const outline = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
  ] as const;
  const clipped: MirrorDrawing = { ...SQUARE_PLANE, outline };
  expect(faceCorners(clipped)).toStrictEqual([...outline]);
  expect(planeFace(clipped, SIZES)).toStrictEqual([
    { shape: 'face', points: outline },
    { shape: 'rod', start: [0, 0, 0], end: [1, 0, 0], radius: 0.03 },
    { shape: 'rod', start: [1, 0, 0], end: [0, 1, 0], radius: 0.03 },
    { shape: 'rod', start: [0, 1, 0], end: [0, 0, 0], radius: 0.03 },
  ]);
});

test('an outline of fewer than three corners is no outline at all', () => {
  const degenerate: MirrorDrawing = {
    ...SQUARE_PLANE,
    outline: [
      [0, 0, 0],
      [1, 0, 0],
    ],
  };
  expect(faceCorners(degenerate)).toHaveLength(4);
  expect(planeFace(degenerate, SIZES)[0]?.shape).toBe('plate');
});

test('an arrow too short for its head is the head alone', () => {
  expect(arrow([0, 0, 0], [1, 0, 0], 0.3, SIZES)).toStrictEqual([
    { shape: 'cone', base: [0, 0, 0], tip: [0.3, 0, 0], radius: 0.16 },
  ]);
});

test('an arrow of no length is left out', () => {
  expect(arrow([0, 0, 0], [1, 0, 0], 0, SIZES)).toStrictEqual([]);
});
