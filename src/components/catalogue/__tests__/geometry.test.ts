import { expect, test } from 'vitest';

import { planeElementTable } from '../../../symmetry/planeElements.ts';
import {
  cellShifts,
  friezeById,
  friezeOperations,
  wallpaperById,
  wallpaperOperations,
} from '../../../symmetry/planeGroups.ts';
import { handledHere } from '../anchorClick.ts';
import { stripDiagram, stripShifts } from '../friezeDiagram.ts';
import {
  cellElementLabels,
  cellLines,
  cellRotations,
  elementLegend,
} from '../planeElementList.ts';
import { friezeEntry, wallpaperEntry } from '../planeEntry.ts';
import { compactSymbol } from '../spaceGroupFacts.ts';

/** The element table of one wallpaper group, over two cells of shifts. */
function tableOf(id: string) {
  const group = wallpaperById(id);
  if (group === undefined) throw new Error(`no wallpaper group ${id}`);
  return planeElementTable(wallpaperOperations(group), cellShifts(2));
}

test('a cell holds each element once, not once per corner it touches', () => {
  // The cheatsheet says p2 has four inequivalent twofold centres, and a list
  // over the closed cell says nine: the corners are one element, drawn four
  // times.
  expect(
    cellRotations(tableOf('p2')).map((entry) => entry.point),
  ).toStrictEqual([
    [0, 0],
    [0, 0.5],
    [0.5, 0],
    [0.5, 0.5],
  ]);
  const counts = (id: string) => {
    const table = tableOf(id);
    return [cellRotations(table).length, cellLines(table).length];
  };
  expect(counts('p1')).toStrictEqual([0, 0]);
  expect(counts('p4')).toStrictEqual([4, 0]);
  expect(counts('p4m')).toStrictEqual([4, 8]);
  expect(counts('p4g')).toStrictEqual([4, 8]);
  expect(counts('p3')).toStrictEqual([3, 0]);
  expect(counts('p3m1')).toStrictEqual([3, 6]);
  expect(counts('p31m')).toStrictEqual([3, 6]);
  expect(counts('p6m')).toStrictEqual([6, 12]);
});

test("pg's glide lines are at x = 0 and x = 1/2, where its own positions put them", () => {
  // Not x = 1/4 and 3/4: that is cm's answer, and the report that gave it to pg
  // contradicted the general positions it printed two lines above.
  expect(cellElementLabels(tableOf('pg'))).toStrictEqual([
    'g: x = 0, glide (0, 1/2)',
    'g: x = 1/2, glide (0, 1/2)',
  ]);
  expect(cellElementLabels(tableOf('cm'))).toStrictEqual([
    'm: x = 0',
    'g: x = 1/4, glide (0, 1/2)',
    'm: x = 1/2',
    'g: x = 3/4, glide (0, 1/2)',
  ]);
});

test('a strip translates along a alone, because it has no second direction', () => {
  expect(stripShifts(0)).toStrictEqual([[0, 0]]);
  expect(stripShifts(2)).toStrictEqual([
    [0, 0],
    [1, 0],
    [2, 0],
  ]);
});

test('a frieze strip draws each period and nothing across it', () => {
  const group = friezeById('p2mm');
  if (group === undefined) throw new Error('no p2mm');
  const diagram = stripDiagram(friezeOperations(group), 3);
  expect(diagram.viewBox).toBe('-10 -52 320 104');
  expect(diagram.boundaries).toStrictEqual([0, 100, 200, 300]);
  expect(diagram.top).toBe(42);
  // Mirrors across the strip at x = 0 and x = 1/2 of each period, the mirror
  // along it at y = 0, and a half-turn wherever the two cross.
  expect(diagram.lines.filter((line) => line.x1 === line.x2)).toHaveLength(7);
  expect(diagram.lines.filter((line) => line.y1 === line.y2)).toHaveLength(1);
  expect(diagram.glyphs.length).toBeGreaterThan(0);
  for (const glyph of diagram.glyphs) expect(glyph.order).toBe(2);
});

test('the plainest frieze draws its period marks and nothing else', () => {
  const group = friezeById('p1');
  if (group === undefined) throw new Error('no frieze p1');
  const diagram = stripDiagram(friezeOperations(group), 2);
  expect(diagram.boundaries).toStrictEqual([0, 100, 200]);
  expect(diagram.lines).toStrictEqual([]);
  expect(diagram.glyphs).toStrictEqual([]);
});

test('every frieze group draws inside its own viewBox', () => {
  for (const id of ['p1', 'p11g', 'p1m1', 'p11m', 'p2', 'p2mg', 'p2mm']) {
    const group = friezeById(id);
    if (group === undefined) throw new Error(`no frieze ${id}`);
    const diagram = stripDiagram(friezeOperations(group), 3);
    for (const line of diagram.lines) {
      expect(line.x1, id).toBeGreaterThanOrEqual(0);
      expect(line.x2, id).toBeLessThanOrEqual(300);
      expect(Math.abs(line.y1), id).toBeLessThanOrEqual(42);
    }
    expect(new Set(diagram.lines.map((line) => line.key)).size).toBe(
      diagram.lines.length,
    );
    expect(new Set(diagram.glyphs.map((glyph) => glyph.key)).size).toBe(
      diagram.glyphs.length,
    );
  }
});

test('a Hermann-Mauguin symbol is compacted the way a student types it', () => {
  expect(compactSymbol('P n m a')).toBe('Pnma');
  expect(compactSymbol('F m -3 m')).toBe('Fm-3m');
  expect(compactSymbol('P 21/c')).toBe('P21/c');
  expect(compactSymbol('P 1')).toBe('P1');
});

test('a link only takes over a plain left click', () => {
  const plain = {
    defaultPrevented: false,
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
  };
  expect(handledHere(plain)).toBe(true);
  // Everything else is the browser's own navigation and is left to it.
  expect(handledHere({ ...plain, button: 1 })).toBe(false);
  expect(handledHere({ ...plain, metaKey: true })).toBe(false);
  expect(handledHere({ ...plain, ctrlKey: true })).toBe(false);
  expect(handledHere({ ...plain, shiftKey: true })).toBe(false);
  expect(handledHere({ ...plain, altKey: true })).toBe(false);
  expect(handledHere({ ...plain, defaultPrevented: true })).toBe(false);
});

test('a diagram names only the glyphs it draws', () => {
  expect(elementLegend(tableOf('p4g'))).toBe(
    'a lens is a two-fold, a square a four-fold, a heavy line a mirror and a dashed one a glide',
  );
  expect(elementLegend(tableOf('p6'))).toBe(
    'a lens is a two-fold, a triangle a three-fold and a hexagon a six-fold',
  );
  expect(elementLegend(tableOf('pm'))).toBe('a heavy line a mirror');
  expect(elementLegend(tableOf('pg'))).toBe('a dashed one a glide');
  // p1 draws nothing at all, and the caption says that rather than listing six
  // shapes the picture has none of.
  expect(elementLegend(tableOf('p1'))).toBe('');
});

test('a plane entry captions its picture with that legend', () => {
  expect(wallpaperEntry('p4g')?.figure?.caption).toBe(
    'The symmetry elements of p4g over four cells: a lens is a two-fold, a square a four-fold, a heavy line a mirror and a dashed one a glide.',
  );
  expect(wallpaperEntry('p1')?.figure?.caption).toBe(
    'p1 over four cells: it has nothing but its translations, so only the cell is drawn.',
  );
  expect(friezeEntry('p11g')?.figure?.caption).toBe(
    'The symmetry elements of p11g over three periods: a dashed one a glide.',
  );
});
