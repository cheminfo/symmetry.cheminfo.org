import { expect, test } from 'vitest';

import { WALLPAPER_GROUPS } from '../../../data/planeGroups.ts';
import type {
  CrystalOperation,
  Lattice,
} from '../../../symmetry/core/index.ts';
import type { PlaneLattice } from '../../../symmetry/planeGroups.ts';
import {
  friezeById,
  friezeOperations,
  latticeCell,
  wallpaperById,
  wallpaperOperations,
} from '../../../symmetry/planeGroups.ts';
import { coveringShifts, patternFrame } from '../frame.ts';
import {
  basisTransform,
  copyTransform,
  patternCopies,
  patternLattice,
  tileShifts,
} from '../transforms.ts';

/** The cell a lattice allows, at a 100-unit edge, with M and M⁻¹ ready. */
function cellOf(lattice: PlaneLattice): Lattice {
  return patternLattice(latticeCell(lattice, 100));
}

/** The coset list of one of the seventeen. */
function operationsOf(id: string): Array<CrystalOperation<2>> {
  const group = wallpaperById(id);
  if (group === undefined) throw new Error(`no wallpaper group ${id}`);
  return wallpaperOperations(group);
}

/** Every copy transform of one of the seventeen, in its own cell. */
function transformsOf(id: string): string[] {
  const group = wallpaperById(id);
  if (group === undefined) throw new Error(`no wallpaper group ${id}`);
  const lattice = cellOf(group.lattice);
  return wallpaperOperations(group).map((operation) =>
    copyTransform(operation, lattice, [0, 0]),
  );
}

test('p4 turns the motif by quarters about the origin', () => {
  expect(transformsOf('p4')).toStrictEqual([
    'matrix(1 0 0 1 0 0)',
    'matrix(0 1 -1 0 0 0)',
    'matrix(-1 0 0 -1 0 0)',
    'matrix(0 -1 1 0 0 0)',
  ]);
});

test('the hexagonal cell conjugates a 3-fold into a true 120° turn', () => {
  // The number that says γ is 120° and not 60°: at 60° the same conjugation
  // comes out sheared, det is still 1, and only the picture looks wrong.
  expect(transformsOf('p3')).toStrictEqual([
    'matrix(1 0 0 1 0 0)',
    'matrix(-0.5 0.866025 -0.866025 -0.5 0 0)',
    'matrix(-0.5 -0.866025 0.866025 -0.5 0 0)',
  ]);
  expect(transformsOf('p6')[1]).toBe('matrix(0.5 0.866025 -0.866025 0.5 0 0)');
});

test('a centred lattice carries its half-cell translation in the transform', () => {
  expect(transformsOf('cm')).toStrictEqual([
    'matrix(1 0 0 1 0 0)',
    'matrix(-1 0 0 1 0 0)',
    'matrix(1 0 0 1 50 37.5)',
    'matrix(-1 0 0 1 50 37.5)',
  ]);
  // pg's glide is half the cell edge along b, which is 75 units here.
  expect(transformsOf('pg')).toStrictEqual([
    'matrix(1 0 0 1 0 0)',
    'matrix(-1 0 0 1 0 37.5)',
  ]);
});

test('the cell matrix is what the <defs> group carries', () => {
  expect(basisTransform(cellOf('square'))).toBe('matrix(100 0 0 100 0 0)');
  expect(basisTransform(cellOf('rectangular'))).toBe('matrix(100 0 0 75 0 0)');
  expect(basisTransform(cellOf('centred-rectangular'))).toBe(
    'matrix(100 0 0 75 0 0)',
  );
  expect(basisTransform(cellOf('hexagonal'))).toBe(
    'matrix(100 0 -50 86.60254 0 0)',
  );
  expect(basisTransform(cellOf('oblique'))).toBe(
    'matrix(100 0 -32.352381 120.740728 0 0)',
  );
});

test('a lattice translation is added to the operation, not composed with it', () => {
  const square = cellOf('square');
  const quarterTurn = operationsOf('p4')[1];
  if (quarterTurn === undefined) throw new Error('p4 has no quarter turn');
  expect(copyTransform(quarterTurn, square, [1, 0])).toBe(
    'matrix(0 1 -1 0 100 0)',
  );
  expect(copyTransform(quarterTurn, square, [2, 3])).toBe(
    'matrix(0 1 -1 0 200 300)',
  );
});

test('a block of cells draws one copy per operation per cell', () => {
  const operations = operationsOf('p4m');
  expect(operations).toHaveLength(8);
  const copies = patternCopies(operations, cellOf('square'), tileShifts(3));
  expect(copies).toHaveLength(72);
  expect(copies[0]?.key).toBe('0:0:0');
  expect(copies[0]?.transform).toBe('matrix(1 0 0 1 0 0)');
  expect(copies.at(-1)?.key).toBe('2:2:7');
  // Half of p4m is reflections, and every one of its nine cells holds four.
  expect(copies.filter((copy) => copy.mirrored)).toHaveLength(36);
});

test('a sheared cell needs more translations than its own block to fill the window', () => {
  expect(coveringShifts(cellOf('square'), 2, 2)).toStrictEqual(tileShifts(2));
  expect(coveringShifts(cellOf('hexagonal'), 2, 2)).toStrictEqual([
    [-1, 0],
    [0, 0],
    [1, 0],
    [2, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
    [2, 1],
  ]);
});

test('the window is the bounding box of the block, written for the y-flip', () => {
  expect(patternFrame(cellOf('square'), 2, 2)).toStrictEqual({
    viewBox: '0 -200 200 200',
    x: 0,
    y: -200,
    width: 200,
    height: 200,
    cellCorners: [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ],
  });
  const hexagonal = patternFrame(cellOf('hexagonal'), 2, 2);
  expect(hexagonal.viewBox).toBe('-100 -173.205081 300 173.205081');
  expect(hexagonal.cellCorners).toStrictEqual([
    [0, 0],
    [100, 0],
    [50, 86.60254],
    [-50, 86.60254],
  ]);
});

test('every one of the seventeen tiles its own cell, and a frieze its strip', () => {
  const counts = WALLPAPER_GROUPS.map((group) => {
    const copies = patternCopies(
      wallpaperOperations(group),
      cellOf(group.lattice),
      tileShifts(2),
    );
    return `${group.id} ${copies.length}`;
  });
  expect(counts).toStrictEqual([
    'p1 4',
    'p2 8',
    'pm 8',
    'pg 8',
    'cm 16',
    'pmm 16',
    'pmg 16',
    'pgg 16',
    'cmm 32',
    'p4 16',
    'p4m 32',
    'p4g 32',
    'p3 12',
    'p3m1 24',
    'p31m 24',
    'p6 24',
    'p6m 48',
  ]);
  const p2mg = friezeById('p2mg');
  if (p2mg === undefined) throw new Error('no frieze group p2mg');
  // A frieze is a strip: one row of cells, four periods along it.
  const strip = patternCopies(
    friezeOperations(p2mg),
    cellOf('rectangular'),
    tileShifts(4, 1),
  );
  expect(strip).toHaveLength(16);
});
