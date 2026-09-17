import { expect, test } from 'vitest';

import { MOTIFS, motifById } from '../../plane/index.ts';
import { drawnMotif } from '../drawnMotif.ts';
import { motifDomainEdge, patternMotifScale } from '../motifScale.ts';
import { planeGroupOperations, resolvePlaneGroup } from '../planeGroupRef.ts';

/** A drawing covering the whole pad, as `MotifEditor` produces. */
const DRAWN = drawnMotif([
  [0.1, 0.2],
  [0.6, 0.25],
  [0.3, 0.7],
]);

/** How wide the motif ends up on the page, in cell units. */
function edge(operations: number): number {
  return patternMotifScale(operations, DRAWN) * motifDomainEdge(DRAWN);
}

test('a shipped motif is drawn in a quarter cell and a drawn one in the whole one', () => {
  expect(MOTIFS.every((motif) => motifDomainEdge(motif) === 0.5)).toBe(true);
  expect(motifDomainEdge(DRAWN)).toBe(1);
  // A motif that declares no region is taken to cover the cell.
  expect(motifDomainEdge({ ...DRAWN, domain: undefined })).toBe(1);
});

test('the two kinds of motif end up the same size on the page', () => {
  // What matters is the drawn edge — the scale times the region — not the
  // scale, and the two must agree or a shipped motif reads as confetti beside
  // a drawn one.
  for (const operations of [1, 2, 4, 8, 12]) {
    const shipped = patternMotifScale(operations, motifById('comma')) * 0.5;
    const drawn = patternMotifScale(operations, DRAWN) * 1;
    expect(shipped).toBeCloseTo(drawn, 12);
  }
});

test('the drawn edge follows the fundamental domain, and stops at the cell', () => {
  expect(edge(1)).toBe(1);
  expect(edge(2)).toBe(1);
  expect(edge(4)).toBeCloseTo(Math.SQRT1_2, 12);
  expect(edge(8)).toBe(0.5);
  expect(edge(12)).toBeCloseTo(Math.sqrt(2 / 12), 12);
});

test('the twelve-fold groups still draw a motif a student can see', () => {
  const p6m = planeGroupOperations(resolvePlaneGroup('p6m'));
  expect(p6m).toHaveLength(12);
  expect(patternMotifScale(p6m.length, motifById('comma'))).toBeCloseTo(
    0.8165,
    4,
  );
  expect(patternMotifScale(p6m.length, DRAWN)).toBeCloseTo(0.4082, 4);
});

test('p4m doubles what the old quarter-cell sizing gave it', () => {
  const p4m = planeGroupOperations(resolvePlaneGroup('p4m'));
  expect(p4m).toHaveLength(8);
  expect(patternMotifScale(p4m.length, motifById('flag'))).toBe(1);
});

test('nothing is ever scaled to a speck', () => {
  expect(patternMotifScale(1000, DRAWN)).toBe(0.25);
  expect(patternMotifScale(0, DRAWN)).toBe(1);
});
