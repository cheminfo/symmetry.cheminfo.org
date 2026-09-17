import { expect, test } from 'vitest';

import { mergeDrawings, sameDrawings, withoutDrawings } from '../drawingSet.ts';
import type { SymmetryDrawing } from '../types.ts';

const axis: SymmetryDrawing = {
  kind: 'rotation',
  id: 'c3',
  label: 'C3',
  point: [0, 0, 0],
  direction: [0, 0, 1],
  length: 4,
  order: 3,
};

const mirror: SymmetryDrawing = {
  kind: 'mirror',
  id: 'sv',
  label: 'σv',
  point: [0, 0, 0],
  normal: [1, 0, 0],
  size: 4,
};

test('merging appends what is new and keeps the order', () => {
  expect(mergeDrawings([axis], [mirror]).map((one) => one.id)).toStrictEqual([
    'c3',
    'sv',
  ]);
});

test('merging replaces in place, so a relabelled axis does not move', () => {
  const relabelled: SymmetryDrawing = { ...axis, label: 'C3 along z' };
  const merged = mergeDrawings([axis, mirror], [relabelled]);
  expect(merged.map((one) => one.id)).toStrictEqual(['c3', 'sv']);
  expect(merged[0]).toBe(relabelled);
});

test('the last of two drawings sharing an id wins, and is appended once', () => {
  const second: SymmetryDrawing = { ...mirror, label: 'σd' };
  const merged = mergeDrawings([], [mirror, second]);
  expect(merged).toHaveLength(1);
  expect(merged[0]).toBe(second);
});

test('removing takes only the named ids and ignores the rest', () => {
  expect(
    withoutDrawings([axis, mirror], ['sv', 'nothing']).map((one) => one.id),
  ).toStrictEqual(['c3']);
});

test('two sets are the same only when they hold the same drawings in the same order', () => {
  expect(sameDrawings([axis, mirror], [axis, mirror])).toBe(true);
  expect(sameDrawings([axis, mirror], [mirror, axis])).toBe(false);
  expect(sameDrawings([axis], [axis, mirror])).toBe(false);
  expect(sameDrawings([axis], [{ ...axis }])).toBe(false);
});
