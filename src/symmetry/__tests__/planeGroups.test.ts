import { expect, test } from 'vitest';

import { FRIEZE_GROUPS } from '../../data/friezeGroups.ts';
import { ALHAMBRA_NOTE, WALLPAPER_GROUPS } from '../../data/planeGroups.ts';
import {
  distinctRotations,
  formatOperation,
  operationKey,
  pointGroupName,
} from '../core/index.ts';
import {
  cartesianLinear,
  expandPlaneGroup,
  isOrthogonal,
  latticeCell,
  parsePlaneOperations,
  planeLattice,
  wallpaperById,
  wallpaperOperations,
} from '../planeGroups.ts';

/** The operation keys of a list, sorted, so two transcriptions compare as sets. */
function keysOf(
  operations: ReadonlyArray<Parameters<typeof operationKey>[0]>,
): string[] {
  return operations.map((operation) => operationKey(operation)).toSorted();
}

test('the seventeen close to the orders the International Tables give', () => {
  const counts = WALLPAPER_GROUPS.map(
    (group) => wallpaperOperations(group).length,
  );
  expect(counts).toStrictEqual([
    1, 2, 2, 2, 4, 4, 4, 4, 8, 4, 8, 8, 3, 6, 6, 6, 12,
  ]);
  expect(
    WALLPAPER_GROUPS.map((group) => group.operationsPerCell),
  ).toStrictEqual(counts);
  expect(
    WALLPAPER_GROUPS.map(
      (group) => parsePlaneOperations(group.generalPositions).length,
    ),
  ).toStrictEqual(counts);
});

test('the generators and the general positions are the same group, seventeen times', () => {
  const differing: string[] = [];
  for (const group of WALLPAPER_GROUPS) {
    const expanded = keysOf(wallpaperOperations(group));
    const listed = keysOf(parsePlaneOperations(group.generalPositions));
    if (JSON.stringify(expanded) !== JSON.stringify(listed)) {
      differing.push(group.id);
    }
  }
  expect(differing).toStrictEqual([]);
});

test('every general position is written the way formatOperation writes it', () => {
  const wrong: string[] = [];
  for (const group of [...WALLPAPER_GROUPS, ...FRIEZE_GROUPS]) {
    for (const triplet of group.generalPositions.split('; ')) {
      const [parsed] = parsePlaneOperations(triplet);
      if (parsed === undefined || formatOperation(parsed) !== triplet) {
        wrong.push(`${group.id}: ${triplet}`);
      }
    }
  }
  expect(wrong).toStrictEqual([]);
});

test('the point group of each is the one its operations form', () => {
  expect(
    WALLPAPER_GROUPS.map((group) =>
      pointGroupName(distinctRotations(wallpaperOperations(group)), 2),
    ),
  ).toStrictEqual([
    '1',
    '2',
    'm',
    'm',
    'm',
    '2mm',
    '2mm',
    '2mm',
    '2mm',
    '4',
    '4mm',
    '4mm',
    '3',
    '3m',
    '3m',
    '6',
    '6mm',
  ]);
  expect(WALLPAPER_GROUPS.map((group) => group.pointGroup)).toStrictEqual(
    WALLPAPER_GROUPS.map((group) =>
      pointGroupName(distinctRotations(wallpaperOperations(group)), 2),
    ),
  );
});

test('the seventeen are numbered 1 to 17, and no two share an id or an orbifold', () => {
  expect(WALLPAPER_GROUPS).toHaveLength(17);
  expect(WALLPAPER_GROUPS.map((group) => group.number)).toStrictEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
  ]);
  expect(new Set(WALLPAPER_GROUPS.map((group) => group.id)).size).toBe(17);
  expect(new Set(WALLPAPER_GROUPS.map((group) => group.orbifold)).size).toBe(
    17,
  );
  expect(WALLPAPER_GROUPS.map((group) => group.id).join(' ')).toBe(
    'p1 p2 pm pg cm pmm pmg pgg cmm p4 p4m p4g p3 p3m1 p31m p6 p6m',
  );
  for (const group of WALLPAPER_GROUPS) {
    expect(group.id).toBe(group.id.toLowerCase());
    expect(group.fundamentalDomain.length).toBeGreaterThan(20);
    expect(group.example.length).toBeGreaterThan(20);
  }
});

test('every operation is an isometry on the cell its lattice allows', () => {
  const sheared: string[] = [];
  for (const group of WALLPAPER_GROUPS) {
    const lattice = planeLattice(latticeCell(group.lattice));
    for (const operation of wallpaperOperations(group)) {
      if (!isOrthogonal(cartesianLinear(operation, lattice))) {
        sheared.push(`${group.id}: ${formatOperation(operation)}`);
      }
    }
  }
  expect(sheared).toStrictEqual([]);
});

test('a hexagonal cell is γ = 120°: at 60° the 3-fold comes out sheared', () => {
  const [threeFold] = parsePlaneOperations('-y,x-y');
  const [sixFold] = parsePlaneOperations('x-y,x');
  expect(threeFold).toBeDefined();
  expect(sixFold).toBeDefined();
  if (threeFold === undefined || sixFold === undefined) return;

  const hexagonal = planeLattice(latticeCell('hexagonal'));
  const turn120 = cartesianLinear(threeFold, hexagonal);
  const turn60 = cartesianLinear(sixFold, hexagonal);
  expect(turn120[0]).toBeCloseTo(-0.5, 12);
  expect(turn120[1]).toBeCloseTo(-0.866_025_403_784_438_6, 12);
  expect(turn120[2]).toBeCloseTo(0.866_025_403_784_438_6, 12);
  expect(turn120[3]).toBeCloseTo(-0.5, 12);
  expect(turn60[0]).toBeCloseTo(0.5, 12);
  expect(turn60[1]).toBeCloseTo(-0.866_025_403_784_438_6, 12);
  expect(isOrthogonal(turn120)).toBe(true);
  expect(isOrthogonal(turn60)).toBe(true);

  // The trap: det is still 1 and the picture merely looks wrong.
  const wrong = cartesianLinear(
    threeFold,
    planeLattice({ a: 1, b: 1, gamma: 60 }),
  );
  expect(wrong[1]).toBeCloseTo(-2.020_725_942_163_690_7, 9);
  expect(wrong[3]).toBeCloseTo(-1.5, 9);
  expect(isOrthogonal(wrong)).toBe(false);
});

test('a group is found by its short symbol and by its full one', () => {
  expect(wallpaperById('p4g')?.number).toBe(12);
  expect(wallpaperById('p4gm')?.number).toBe(12);
  expect(wallpaperById('P4MM')?.id).toBe('p4m');
  expect(wallpaperById('p6mm')?.id).toBe('p6m');
  expect(wallpaperById('p3m1')?.number).toBe(14);
  expect(wallpaperById('pmmm')).toBeUndefined();
});

test('an empty generator list gives p1, in two dimensions', () => {
  expect(expandPlaneGroup([])).toStrictEqual([
    {
      dimension: 2,
      rotation: [
        [1, 0],
        [0, 1],
      ],
      translation: [0, 0],
    },
  ]);
});

test('the Alhambra note counts thirteen and cites both sides', () => {
  expect(ALHAMBRA_NOTE).toContain('Thirteen of the seventeen');
  expect(ALHAMBRA_NOTE).toContain('p2, pg, pgg and p3m1');
  expect(ALHAMBRA_NOTE).toContain('Grünbaum, Grünbaum and Shephard');
  expect(ALHAMBRA_NOTE).toContain('Pérez-Gómez');
  expect(ALHAMBRA_NOTE).toContain('Notices of the AMS, June/July 2006');
});

test('each lattice gets a cell it actually allows', () => {
  expect(latticeCell('square')).toStrictEqual({ a: 1, b: 1, gamma: 90 });
  expect(latticeCell('hexagonal')).toStrictEqual({ a: 1, b: 1, gamma: 120 });
  expect(latticeCell('rectangular', 10)).toStrictEqual({
    a: 10,
    b: 7.5,
    gamma: 90,
  });
  expect(latticeCell('oblique').gamma).toBe(105);
});
