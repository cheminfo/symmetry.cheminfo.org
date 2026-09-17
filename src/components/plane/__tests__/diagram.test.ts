import { expect, test } from 'vitest';

import { WALLPAPER_GROUPS } from '../../../data/planeGroups.ts';
import type { Lattice } from '../../../symmetry/core/index.ts';
import type { PlaneLattice } from '../../../symmetry/planeGroups.ts';
import {
  latticeCell,
  wallpaperById,
  wallpaperOperations,
} from '../../../symmetry/planeGroups.ts';
import { clipToBlock } from '../clip.ts';
import type { PlaneDiagram } from '../diagram.ts';
import { planeDiagramOf } from '../diagram.ts';
import { patternLattice } from '../transforms.ts';

/** The cell a lattice allows, at a 100-unit edge. */
function cellOf(lattice: PlaneLattice): Lattice {
  return patternLattice(latticeCell(lattice, 100));
}

/** The diagram of one of the seventeen, over a block of `cells` cells. */
function diagramOf(id: string, cells = 1): PlaneDiagram {
  const group = wallpaperById(id);
  if (group === undefined) throw new Error(`no wallpaper group ${id}`);
  return planeDiagramOf(
    wallpaperOperations(group),
    cellOf(group.lattice),
    cells,
  );
}

/** Every rotation point, as `order at x,y`. */
function glyphs(diagram: PlaneDiagram): string[] {
  return diagram.glyphs.map(
    (glyph) => `${glyph.order} at ${glyph.x},${glyph.y}`,
  );
}

/** Every line, as `symbol x1,y1 x2,y2`. */
function lines(diagram: PlaneDiagram): string[] {
  return diagram.lines.map(
    (line) => `${line.symbol} ${line.x1},${line.y1} ${line.x2},${line.y2}`,
  );
}

test('p4g: the mirrors run on the diagonals and no 4-fold sits on one', () => {
  const diagram = diagramOf('p4g');
  expect(glyphs(diagram)).toStrictEqual([
    '4 at 0,0',
    '2 at 0,50',
    '4 at 0,100',
    '2 at 50,0',
    '4 at 50,50',
    '2 at 50,100',
    '4 at 100,0',
    '2 at 100,50',
    '4 at 100,100',
  ]);
  expect(lines(diagram)).toStrictEqual([
    'g 0,25 100,25',
    'g 0,75 100,75',
    'm 0,50 50,100',
    'g 0,0 100,100',
    'm 50,0 100,50',
    'g 25,0 25,100',
    'g 75,0 75,100',
    'm 0,50 50,0',
    'g 0,100 100,0',
    'm 50,100 100,50',
  ]);
  expect(diagram.lines.filter((line) => line.kind === 'mirror')).toHaveLength(
    4,
  );
  expect(diagram.lines.filter((line) => line.kind === 'glide')).toHaveLength(6);
});

test('p4m: four mirrors through every 4-fold, and glides on the diagonals', () => {
  const diagram = diagramOf('p4m');
  // The rotation points of p4m and p4g are the same; only the lines differ,
  // which is the whole of the confusion the two diagrams settle.
  expect(glyphs(diagram)).toStrictEqual(glyphs(diagramOf('p4g')));
  expect(lines(diagram)).toStrictEqual([
    'm 0,0 100,0',
    'm 0,50 100,50',
    'm 0,100 100,100',
    'g 0,50 50,100',
    'm 0,0 100,100',
    'g 50,0 100,50',
    'm 0,0 0,100',
    'm 50,0 50,100',
    'm 100,0 100,100',
    'g 0,50 50,0',
    'm 0,100 100,0',
    'g 50,100 100,50',
  ]);
  expect(diagram.lines.filter((line) => line.kind === 'mirror')).toHaveLength(
    8,
  );
  expect(diagram.lines.filter((line) => line.kind === 'glide')).toHaveLength(4);
});

test('a block of cells carries the whole grid of centres, not one cell of it', () => {
  const diagram = diagramOf('p4g', 2);
  // Five by five half-cell positions, each a 4-fold or a 2-fold.
  expect(diagram.glyphs).toHaveLength(25);
  expect(diagram.glyphs.filter((glyph) => glyph.order === 4)).toHaveLength(13);
  expect(diagram.glyphs.filter((glyph) => glyph.order === 2)).toHaveLength(12);
  expect(diagram.cells).toHaveLength(4);
  expect(diagram.cells[0]?.primary).toBe(true);
  expect(diagram.cells[0]?.points).toBe('0,0 100,0 100,100 0,100');
  expect(diagram.cells[3]?.primary).toBe(false);
  expect(diagram.cells[3]?.points).toBe('100,100 200,100 200,200 100,200');
});

test('the hexagonal cell places its 3-folds where the rhombus does', () => {
  const diagram = diagramOf('p3m1');
  expect(glyphs(diagram)).toStrictEqual([
    '3 at 0,0',
    '3 at -50,86.60254',
    '3 at 0,57.735027',
    '3 at 50,28.867513',
    '3 at 100,0',
    '3 at 50,86.60254',
  ]);
  // (1/3, 2/3) in a γ = 120° cell of edge 100: x = 100/3 − 50·2/3 = 0.
  expect(diagram.glyphs[2]?.x).toBe(0);
  expect(diagram.glyphs[2]?.y).toBe(57.735027);
  expect(diagram.lines.filter((line) => line.kind === 'mirror')).toHaveLength(
    5,
  );
  expect(diagram.lines.filter((line) => line.kind === 'glide')).toHaveLength(8);
});

test('p1 has nothing to draw but its cell', () => {
  const diagram = diagramOf('p1');
  expect(diagram.glyphs).toStrictEqual([]);
  expect(diagram.lines).toStrictEqual([]);
  expect(diagram.cells).toHaveLength(1);
});

test('every one of the seventeen draws the elements its own table holds', () => {
  const summary = WALLPAPER_GROUPS.map((group) => {
    const diagram = planeDiagramOf(
      wallpaperOperations(group),
      cellOf(group.lattice),
      1,
    );
    const mirrors = diagram.lines.filter((line) => line.kind === 'mirror');
    const glides = diagram.lines.filter((line) => line.kind === 'glide');
    return `${group.id} ${diagram.glyphs.length}/${mirrors.length}/${glides.length}`;
  });
  expect(summary).toStrictEqual([
    'p1 0/0/0',
    'p2 9/0/0',
    'pm 0/3/0',
    'pg 0/0/3',
    'cm 0/3/2',
    'pmm 9/6/0',
    'pmg 9/2/3',
    'pgg 9/0/4',
    'cmm 13/6/4',
    'p4 9/0/0',
    'p4m 9/8/4',
    'p4g 9/4/6',
    'p3 6/0/0',
    'p3m1 6/5/8',
    'p31m 6/5/4',
    'p6 11/0/0',
    'p6m 11/10/12',
  ]);
});

test('a line that misses the block, or only touches a corner, is not drawn', () => {
  const through: Parameters<typeof clipToBlock>[0] = {
    kind: 'mirror',
    symbol: 'm',
    normal: [1, 1],
    offset: 0.5,
    glide: [0, 0],
  };
  // The ends come back left to right, whichever way the normal points.
  expect(clipToBlock(through, 1)).toStrictEqual([0, 0.5, 0.5, 0]);
  // x + y = 0 meets the unit cell at the origin and nowhere else.
  expect(clipToBlock({ ...through, offset: 0 }, 1)).toBeNull();
  expect(clipToBlock({ ...through, offset: 4 }, 1)).toBeNull();
  expect(clipToBlock({ ...through, normal: [0, 0] }, 1)).toBeNull();
  // The same line across a two-cell block runs corner to corner.
  expect(clipToBlock({ ...through, offset: 2 }, 2)).toStrictEqual([0, 2, 2, 0]);
});
