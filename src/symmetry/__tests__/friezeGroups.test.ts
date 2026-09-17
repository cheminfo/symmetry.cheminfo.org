import { expect, test } from 'vitest';

import { FRIEZE_GROUPS, FRIEZE_TO_WALLPAPER } from '../../data/friezeGroups.ts';
import {
  distinctRotations,
  operationKey,
  pointGroupName,
} from '../core/index.ts';
import type { PlaneElementTable } from '../planeElements.ts';
import {
  formatPlaneElement,
  linesInCell,
  planeElementTable,
  rotationsInCell,
  rotationsOffEveryLine,
} from '../planeElements.ts';
import {
  friezeById,
  friezeOperations,
  parsePlaneOperations,
  wallpaperById,
} from '../planeGroups.ts';

/** The operation keys of a list, sorted, so two transcriptions compare as sets. */
function keysOf(
  operations: ReadonlyArray<Parameters<typeof operationKey>[0]>,
): string[] {
  return operations.map((operation) => operationKey(operation)).toSorted();
}

/** The element diagram of one of the seven, over two periods. */
function tableOf(id: string): PlaneElementTable {
  const group = friezeById(id);
  if (group === undefined) throw new Error(`no frieze group ${id}`);
  return planeElementTable(friezeOperations(group), [
    [0, 0],
    [1, 0],
  ]);
}

/** The rotation centres, as `2 at (1/4, 0)`. */
function rotations(table: PlaneElementTable): string[] {
  return rotationsInCell(table).map((rotation) => formatPlaneElement(rotation));
}

/** The mirror and glide lines, as `m: x = 1/2`. */
function lines(table: PlaneElementTable): string[] {
  return linesInCell(table).map((line) => formatPlaneElement(line));
}

/** The rotation centres that lie on no mirror. */
function free(table: PlaneElementTable): string[] {
  const off = new Set(rotationsOffEveryLine(table));
  return rotationsInCell(table)
    .filter((rotation) => off.has(rotation))
    .map((rotation) => formatPlaneElement(rotation));
}

test('wallpaper and frieze are separate namespaces because the ids collide', () => {
  expect(wallpaperById('p1')?.number).toBe(1);
  expect(friezeById('p1')?.orbifold).toBe('∞∞');
  expect(wallpaperById('p2')?.orbifold).toBe('2222');
  expect(friezeById('p2')?.orbifold).toBe('22∞');
  // `p1m1` is the frieze called sidle, and the full symbol of the wallpaper pm.
  expect(friezeById('p1m1')?.conway).toBe('sidle');
  expect(wallpaperById('p1m1')?.id).toBe('pm');
});

test('the seven frieze groups close, and nothing translates across the strip', () => {
  expect(FRIEZE_GROUPS).toHaveLength(7);
  expect(
    FRIEZE_GROUPS.map((group) => friezeOperations(group).length),
  ).toStrictEqual([1, 2, 2, 2, 2, 4, 4]);
  expect(FRIEZE_GROUPS.map((group) => group.operationsPerPeriod)).toStrictEqual(
    [1, 2, 2, 2, 2, 4, 4],
  );
  const differing: string[] = [];
  const across: string[] = [];
  for (const group of FRIEZE_GROUPS) {
    const operations = friezeOperations(group);
    const listed = parsePlaneOperations(group.generalPositions);
    if (JSON.stringify(keysOf(operations)) !== JSON.stringify(keysOf(listed))) {
      differing.push(group.id);
    }
    for (const operation of operations) {
      if (operation.translation[1] !== 0) across.push(group.id);
    }
  }
  expect(differing).toStrictEqual([]);
  expect(across).toStrictEqual([]);
  expect(
    FRIEZE_GROUPS.map((group) =>
      pointGroupName(distinctRotations(friezeOperations(group)), 2),
    ),
  ).toStrictEqual(['1', 'm', 'm', 'm', '2', '2mm', '2mm']);
  expect(FRIEZE_GROUPS.map((group) => group.pointGroup)).toStrictEqual([
    '1',
    'm',
    'm',
    'm',
    '2',
    '2mm',
    '2mm',
  ]);
});

test('every frieze group is the strip of a wallpaper group that exists', () => {
  expect(Object.keys(FRIEZE_TO_WALLPAPER)).toStrictEqual(
    FRIEZE_GROUPS.map((group) => group.id),
  );
  for (const [frieze, wallpaper] of Object.entries(FRIEZE_TO_WALLPAPER)) {
    expect(friezeById(frieze)?.id).toBe(frieze);
    expect(wallpaperById(wallpaper)?.id).toBe(wallpaper);
  }
});

test('a frieze puts its half-turns on the mirrors, or a quarter period off them', () => {
  expect(rotations(tableOf('p2mm'))).toStrictEqual([
    '2 at (0, 0)',
    '2 at (1/2, 0)',
  ]);
  expect(lines(tableOf('p2mm'))).toStrictEqual([
    'm: y = 0',
    'm: x = 0',
    'm: x = 1/2',
  ]);
  // The one fact that separates p2mg from p2mm: the centres sit between the mirrors.
  expect(rotations(tableOf('p2mg'))).toStrictEqual([
    '2 at (1/4, 0)',
    '2 at (3/4, 0)',
  ]);
  expect(lines(tableOf('p2mg'))).toStrictEqual([
    'g: y = 0, glide (1/2, 0)',
    'm: x = 0',
    'm: x = 1/2',
  ]);
  expect(free(tableOf('p2mg'))).toHaveLength(2);
  expect(free(tableOf('p2mm'))).toStrictEqual([]);
  expect(lines(tableOf('p11g'))).toStrictEqual(['g: y = 0, glide (1/2, 0)']);
  expect(lines(tableOf('p11m'))).toStrictEqual(['m: y = 0']);
  expect(
    FRIEZE_GROUPS.map((group) => tableOf(group.id).lines.length),
  ).toStrictEqual([0, 1, 2, 1, 0, 3, 3]);
});
