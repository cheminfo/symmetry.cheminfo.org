import { expect, test } from 'vitest';

import { WALLPAPER_GROUPS } from '../../data/planeGroups.ts';
import type { PlaneElementTable } from '../planeElements.ts';
import {
  formatPlaneElement,
  linesInCell,
  planeElementTable,
  rotationsInCell,
  rotationsOffEveryLine,
} from '../planeElements.ts';
import {
  cellShifts,
  wallpaperById,
  wallpaperOperations,
} from '../planeGroups.ts';

/** The element diagram of one of the seventeen, over a 3 × 3 block of cells. */
function tableOf(id: string): PlaneElementTable {
  const group = wallpaperById(id);
  if (group === undefined) throw new Error(`no wallpaper group ${id}`);
  return planeElementTable(wallpaperOperations(group), cellShifts(2));
}

/** The rotation centres of the cell, as `4 at (1/2, 1/2)`. */
function rotations(table: PlaneElementTable): string[] {
  return rotationsInCell(table).map((rotation) => formatPlaneElement(rotation));
}

/** The mirror and glide lines that cross the cell, as `m: x + y = 1/2`. */
function lines(table: PlaneElementTable): string[] {
  return linesInCell(table).map((line) => formatPlaneElement(line));
}

/** The rotation centres of the cell that lie on no mirror. */
function free(table: PlaneElementTable): string[] {
  const off = new Set(rotationsOffEveryLine(table));
  return rotationsInCell(table)
    .filter((rotation) => off.has(rotation))
    .map((rotation) => formatPlaneElement(rotation));
}

test('p4g: mirrors on the diagonals, glides at the quarters, no 4-fold on a mirror', () => {
  const table = tableOf('p4g');
  expect(rotations(table)).toStrictEqual([
    '4 at (0, 0)',
    '2 at (0, 1/2)',
    '4 at (0, 1)',
    '2 at (1/2, 0)',
    '4 at (1/2, 1/2)',
    '2 at (1/2, 1)',
    '4 at (1, 0)',
    '2 at (1, 1/2)',
    '4 at (1, 1)',
  ]);
  expect(lines(table)).toStrictEqual([
    'g: y = 1/4, glide (1/2, 0)',
    'g: y = 3/4, glide (1/2, 0)',
    'm: x - y = -1/2',
    'g: x - y = 0, glide (1/2, 1/2)',
    'm: x - y = 1/2',
    'g: x = 1/4, glide (0, 1/2)',
    'g: x = 3/4, glide (0, 1/2)',
    'm: x + y = 1/2',
    'g: x + y = 1, glide (1/2, -1/2)',
    'm: x + y = 3/2',
  ]);
  // Every 4-fold is free of mirrors; every 2-fold sits where two of them cross.
  expect(free(table)).toStrictEqual([
    '4 at (0, 0)',
    '4 at (0, 1)',
    '4 at (1/2, 1/2)',
    '4 at (1, 0)',
    '4 at (1, 1)',
  ]);
});

test('p4m: four mirrors through every 4-fold, and the glides on the diagonals', () => {
  const table = tableOf('p4m');
  expect(rotations(table)).toStrictEqual(rotations(tableOf('p4g')));
  expect(lines(table)).toStrictEqual([
    'm: y = 0',
    'm: y = 1/2',
    'm: y = 1',
    'g: x - y = -1/2, glide (1/2, 1/2)',
    'm: x - y = 0',
    'g: x - y = 1/2, glide (1/2, 1/2)',
    'm: x = 0',
    'm: x = 1/2',
    'm: x = 1',
    'g: x + y = 1/2, glide (1/2, -1/2)',
    'm: x + y = 1',
    'g: x + y = 3/2, glide (1/2, -1/2)',
  ]);
  expect(free(table)).toStrictEqual([]);
});

test('p3m1 has every 3-fold on a mirror; p31m has two on none', () => {
  expect(free(tableOf('p3m1'))).toStrictEqual([]);
  expect(free(tableOf('p31m'))).toStrictEqual([
    '3 at (1/3, 2/3)',
    '3 at (2/3, 1/3)',
  ]);
  expect(rotations(tableOf('p3m1'))).toStrictEqual(rotations(tableOf('p31m')));
  // The mirrors of p3m1 are ⊥ to the cell edges; those of p31m run along them.
  expect(
    lines(tableOf('p3m1')).filter((line) => line.startsWith('m')),
  ).toStrictEqual([
    'm: x - 2y = -1',
    'm: x - 2y = 0',
    'm: x + y = 1',
    'm: 2x - y = 0',
    'm: 2x - y = 1',
  ]);
  expect(
    lines(tableOf('p31m')).filter((line) => line.startsWith('m')),
  ).toStrictEqual([
    'm: y = 0',
    'm: y = 1',
    'm: x - y = 0',
    'm: x = 0',
    'm: x = 1',
  ]);
});

test('pg glides through the origin, cm alternates mirror and glide', () => {
  // The glide line of pg passes through the origin: ITA puts the origin on it.
  expect(lines(tableOf('pg'))).toStrictEqual([
    'g: x = 0, glide (0, 1/2)',
    'g: x = 1/2, glide (0, 1/2)',
    'g: x = 1, glide (0, 1/2)',
  ]);
  expect(lines(tableOf('pm'))).toStrictEqual([
    'm: x = 0',
    'm: x = 1/2',
    'm: x = 1',
  ]);
  expect(lines(tableOf('cm'))).toStrictEqual([
    'm: x = 0',
    'g: x = 1/4, glide (0, 1/2)',
    'm: x = 1/2',
    'g: x = 3/4, glide (0, 1/2)',
    'm: x = 1',
  ]);
  expect(tableOf('cm').centring).toStrictEqual([[0.5, 0.5]]);
  expect(tableOf('pm').centring).toStrictEqual([]);
});

test('cmm holds a second family of 2-folds, where the glide lines cross', () => {
  const table = tableOf('cmm');
  expect(free(table)).toStrictEqual([
    '2 at (1/4, 1/4)',
    '2 at (1/4, 3/4)',
    '2 at (3/4, 1/4)',
    '2 at (3/4, 3/4)',
  ]);
  expect(table.centring).toStrictEqual([[0.5, 0.5]]);
  expect(rotations(table)).toHaveLength(13);
});

test('pmg puts its half-turns on the glide lines, pmm on the mirror crossings', () => {
  expect(lines(tableOf('pmg'))).toStrictEqual([
    'g: y = 0, glide (1/2, 0)',
    'g: y = 1/2, glide (1/2, 0)',
    'g: y = 1, glide (1/2, 0)',
    'm: x = 1/4',
    'm: x = 3/4',
  ]);
  expect(free(tableOf('pmg'))).toHaveLength(9);
  expect(free(tableOf('pmm'))).toStrictEqual([]);
  expect(lines(tableOf('pgg')).every((line) => line.startsWith('g'))).toBe(
    true,
  );
  expect(free(tableOf('pgg'))).toHaveLength(9);
});

test('p1 has no element at all, and p6 has one 6-fold, two 3-folds, three 2-folds', () => {
  const nothing = tableOf('p1');
  expect(nothing.rotations).toStrictEqual([]);
  expect(nothing.lines).toStrictEqual([]);
  expect(nothing.centring).toStrictEqual([]);
  const table = tableOf('p6');
  expect(table.lines).toStrictEqual([]);
  expect(rotations(table)).toStrictEqual([
    '6 at (0, 0)',
    '2 at (0, 1/2)',
    '6 at (0, 1)',
    '3 at (1/3, 2/3)',
    '2 at (1/2, 0)',
    '2 at (1/2, 1/2)',
    '2 at (1/2, 1)',
    '3 at (2/3, 1/3)',
    '6 at (1, 0)',
    '2 at (1, 1/2)',
    '6 at (1, 1)',
  ]);
});

test('p6m draws both mirror families: six directions, 30° apart', () => {
  const sixfold = lines(tableOf('p6m')).filter((line) => line.startsWith('m'));
  const first = lines(tableOf('p3m1')).filter((line) => line.startsWith('m'));
  const second = lines(tableOf('p31m')).filter((line) => line.startsWith('m'));
  for (const line of [...first, ...second]) {
    expect(sixfold).toContain(line);
  }
  expect(new Set(sixfold.map((line) => line.split(' = ', 1)[0])).size).toBe(6);
});

test('every one of the seventeen has as many element kinds as its orbifold says', () => {
  const summary = WALLPAPER_GROUPS.map((group) => {
    const table = planeElementTable(wallpaperOperations(group), cellShifts(2));
    const mirrors = linesInCell(table).filter(
      (line) => line.kind === 'mirror',
    ).length;
    const glides = linesInCell(table).filter(
      (line) => line.kind === 'glide',
    ).length;
    return `${group.id} ${rotationsInCell(table).length}/${mirrors}/${glides}`;
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
