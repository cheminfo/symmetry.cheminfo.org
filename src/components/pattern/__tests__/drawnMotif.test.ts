import { expect, test } from 'vitest';

import { SHARE_PARAMS } from '../../../share/params.ts';
import {
  DRAWN_PREFIX,
  MAX_DRAWN_POINTS,
  decodeDrawnMotif,
  drawnMotif,
  encodeDrawnMotif,
  isDrawnMotifId,
  motifFor,
} from '../drawnMotif.ts';

/** A triangle, on hundredths so the codec loses nothing. */
const TRIANGLE = [
  [0.1, 0.2],
  [0.6, 0.25],
  [0.3, 0.7],
] as const;

test('a drawing survives the round trip through the address', () => {
  const id = encodeDrawnMotif(TRIANGLE);
  expect(id).toBe('d:102060253070');
  expect(isDrawnMotifId(id)).toBe(true);
  expect(decodeDrawnMotif(id)).toStrictEqual([
    [0.1, 0.2],
    [0.6, 0.25],
    [0.3, 0.7],
  ]);
});

test('a coordinate outside the cell is brought back inside it', () => {
  expect(encodeDrawnMotif([[-0.4, 1.8]])).toBe('d:0099');
  expect(decodeDrawnMotif('d:0099')).toStrictEqual([[0, 0.99]]);
});

test('the link carries fifteen corners and drops the rest', () => {
  const many: Array<readonly [number, number]> = [];
  for (let index = 0; index < 20; index++) many.push([0.5, 0.5]);
  const id = encodeDrawnMotif(many);
  expect(id).toHaveLength(DRAWN_PREFIX.length + 4 * MAX_DRAWN_POINTS);
  expect(decodeDrawnMotif(id)).toHaveLength(MAX_DRAWN_POINTS);
  // Sixty-two characters, inside the sixty-four the share codec allows.
  expect(SHARE_PARAMS.motif.serialize(id)).toBe(id);
});

test('an id naming no drawing decodes to nothing at all', () => {
  expect(decodeDrawnMotif('flag')).toBeNull();
  expect(decodeDrawnMotif(null)).toBeNull();
  expect(decodeDrawnMotif(undefined)).toBeNull();
  expect(isDrawnMotifId('flag')).toBe(false);
  // A link cut short mid-corner keeps the corners it did carry.
  expect(decodeDrawnMotif('d:102060')).toStrictEqual([[0.1, 0.2]]);
});

test('fewer than three corners enclose nothing, so nothing is drawn', () => {
  expect(drawnMotif([]).paths).toStrictEqual([]);
  expect(drawnMotif([[0.1, 0.1]]).paths).toStrictEqual([]);
  expect(
    drawnMotif([
      [0.1, 0.1],
      [0.4, 0.2],
    ]).paths,
  ).toStrictEqual([]);
  expect(drawnMotif(TRIANGLE).paths).toStrictEqual([
    { d: 'M 0.1,0.2 L 0.6,0.25 L 0.3,0.7 Z' },
  ]);
});

test('a drawn motif has no accent, so a reflected copy still reads as one', () => {
  const motif = drawnMotif(TRIANGLE);
  expect(motif.name).toBe('Your drawing');
  expect(motif.paths.every((path) => path.accent === undefined)).toBe(true);
  expect(motif.domain).toStrictEqual([
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ]);
});

test('the motif a link names is a drawing, a shipped one, or the first one', () => {
  expect(motifFor('d:102060253070').id).toBe('d:102060253070');
  expect(motifFor('flag').id).toBe('flag');
  expect(motifFor(null).id).toBe('comma');
  expect(motifFor('nothing-by-that-name').id).toBe('comma');
});
