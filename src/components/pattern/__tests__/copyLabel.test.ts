import { expect, test } from 'vitest';

import { copyCaption, copyLabels } from '../copyLabel.ts';
import { planeGroupOperations, resolvePlaneGroup } from '../planeGroupRef.ts';

/** The labels of one group, in the order the copies are drawn. */
function labelsOf(id: string): string[] {
  return copyLabels(planeGroupOperations(resolvePlaneGroup(id)));
}

test('p4m names its identity, its turns and its four mirrors', () => {
  // The order is the closure's, not the International Tables coordinate list's:
  // it is the order the copies are drawn in, and `?motif=` indexes into it.
  expect(labelsOf('p4m')).toStrictEqual([
    'x,y — the motif itself',
    '-y,x — 4-fold rotation',
    '-x,y — mirror line',
    '-x,-y — 2-fold rotation',
    'y,x — mirror line',
    '-y,-x — mirror line',
    'y,-x — 4-fold rotation',
    'x,-y — mirror line',
  ]);
});

test('pg has no mirror at all: its second operation is a glide', () => {
  expect(labelsOf('pg')).toStrictEqual([
    'x,y — the motif itself',
    '-x,y+1/2 — glide line',
  ]);
});

test('a centred group names its centring translation as one', () => {
  // The fourth operation is a glide only because the centring is known: on a
  // primitive lattice the same matrix would be read as a mirror.
  expect(labelsOf('cm')).toStrictEqual([
    'x,y — the motif itself',
    '-x,y — mirror line',
    'x+1/2,y+1/2 — centring translation t(1/2,1/2)',
    '-x+1/2,y+1/2 — glide line',
  ]);
});

test('p1 has one copy per cell and it is the motif', () => {
  expect(labelsOf('p1')).toStrictEqual(['x,y — the motif itself']);
});

test('p3 turns by thirds', () => {
  expect(labelsOf('p3')).toStrictEqual([
    'x,y — the motif itself',
    '-y,x-y — 3-fold rotation',
    '-x+y,-x — 3-fold rotation',
  ]);
});

test('a frieze group is labelled from the same decomposition', () => {
  expect(labelsOf('f:p2mg')).toStrictEqual([
    'x,y — the motif itself',
    '-x,y — mirror line',
    'x+1/2,-y — glide line',
    '-x+1/2,-y — 2-fold rotation',
  ]);
});

test('the caption names the cell only when the copy is not in the first one', () => {
  expect(copyCaption('x,y — the motif itself', [0, 0])).toBe(
    'x,y — the motif itself',
  );
  expect(copyCaption('-x,y — mirror line', [2, 1])).toBe(
    '-x,y — mirror line, in cell (2, 1)',
  );
});
