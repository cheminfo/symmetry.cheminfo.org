import { expect, test } from 'vitest';

import { metricTensor } from '../../symmetry/core/index.ts';
import {
  SPACE_GROUP_SETTINGS,
  spaceGroup,
  spaceGroupOperations,
  spaceGroupsWhere,
} from '../../symmetry/spaceGroups.ts';
import {
  applyCellConstraint,
  cellConstraint,
  constrainedBy,
  isCellEdge,
} from '../cellConstraints.ts';

/** A cell no two of whose parameters agree, so every constraint shows. */
const TYPED = { a: 7, b: 9, c: 11, alpha: 80, beta: 100, gamma: 110 };

test('triclinic leaves all six free and changes nothing', () => {
  const constraint = cellConstraint(spaceGroup(1));
  expect(constraint.free).toStrictEqual([
    'a',
    'b',
    'c',
    'alpha',
    'beta',
    'gamma',
  ]);
  expect(applyCellConstraint(TYPED, constraint)).toStrictEqual(TYPED);
});

test('monoclinic follows the unique axis of the setting, not the system', () => {
  // The old site read the system alone and so forced unique axis b on all 105
  // monoclinic settings, 70 of which are on a or c.
  const onB = cellConstraint(spaceGroup(14, 0));
  expect(spaceGroup(14, 0).uniqueAxis).toBe('b');
  expect(onB.free).toStrictEqual(['a', 'b', 'c', 'beta']);
  expect(applyCellConstraint(TYPED, onB)).toStrictEqual({
    a: 7,
    b: 9,
    c: 11,
    alpha: 90,
    beta: 100,
    gamma: 90,
  });

  const onC = settingWhere(14, 'c');
  const constraint = cellConstraint(onC);
  expect(constraint.free).toStrictEqual(['a', 'b', 'c', 'gamma']);
  expect(applyCellConstraint(TYPED, constraint)).toStrictEqual({
    a: 7,
    b: 9,
    c: 11,
    alpha: 90,
    beta: 90,
    gamma: 110,
  });

  expect(cellConstraint(settingWhere(14, 'a')).free).toStrictEqual([
    'a',
    'b',
    'c',
    'alpha',
  ]);
});

test('an R group on rhombohedral axes is not put on hexagonal ones', () => {
  const hexagonal = settingOnAxes(167, 'hexagonal');
  const rhombohedral = settingOnAxes(167, 'rhombohedral');

  expect(applyCellConstraint(TYPED, cellConstraint(hexagonal))).toStrictEqual({
    a: 7,
    b: 7,
    c: 11,
    alpha: 90,
    beta: 90,
    gamma: 120,
  });
  expect(
    applyCellConstraint(TYPED, cellConstraint(rhombohedral)),
  ).toStrictEqual({
    a: 7,
    b: 7,
    c: 7,
    alpha: 80,
    beta: 80,
    gamma: 80,
  });
});

test('tetragonal, hexagonal and cubic force what their axes force', () => {
  expect(
    applyCellConstraint(TYPED, cellConstraint(spaceGroup(136))),
  ).toStrictEqual({ a: 7, b: 7, c: 11, alpha: 90, beta: 90, gamma: 90 });
  expect(
    applyCellConstraint(TYPED, cellConstraint(spaceGroup(194))),
  ).toStrictEqual({ a: 7, b: 7, c: 11, alpha: 90, beta: 90, gamma: 120 });
  expect(
    applyCellConstraint(TYPED, cellConstraint(spaceGroup(225))),
  ).toStrictEqual({ a: 7, b: 7, c: 7, alpha: 90, beta: 90, gamma: 90 });
  expect(
    applyCellConstraint(TYPED, cellConstraint(spaceGroup(62))),
  ).toStrictEqual({ a: 7, b: 9, c: 11, alpha: 90, beta: 90, gamma: 90 });
});

test('constrainedBy names the parameter copied or the degrees pinned', () => {
  const cubic = cellConstraint(spaceGroup(225));
  expect(constrainedBy(cubic, 'a')).toBeNull();
  expect(constrainedBy(cubic, 'b')).toBe('a');
  expect(constrainedBy(cubic, 'c')).toBe('a');
  expect(constrainedBy(cubic, 'gamma')).toBe(90);
  expect(constrainedBy(cellConstraint(spaceGroup(194)), 'gamma')).toBe(120);
  expect(isCellEdge('c')).toBe(true);
  expect(isCellEdge('gamma')).toBe(false);
});

test('every setting leaves free what its own axes leave free', () => {
  const counts = new Map<string, number>();
  for (const setting of SPACE_GROUP_SETTINGS) {
    const key =
      setting.axes === 'rhombohedral' ? 'rhombohedral' : setting.crystalSystem;
    counts.set(key, cellConstraint(setting).free.length);
  }
  expect(SPACE_GROUP_SETTINGS).toHaveLength(521);
  expect([...counts.entries()].toSorted(byName)).toStrictEqual([
    ['cubic', 1],
    ['hexagonal', 2],
    ['monoclinic', 4],
    ['orthorhombic', 3],
    ['rhombohedral', 2],
    ['tetragonal', 2],
    ['triclinic', 6],
    ['trigonal', 2],
  ]);
});

test('a constrained cell has a metric every operation of its group preserves', () => {
  // Wᵀ G W = G is what "the cell is compatible with the group" means, and it is
  // exactly what the old site's per-system rewrite broke. 7244 operations.
  const generic = { a: 5.1, b: 6.3, c: 7.7, alpha: 71, beta: 83, gamma: 97 };
  let checked = 0;
  let violations = 0;
  for (const setting of SPACE_GROUP_SETTINGS) {
    const cell = applyCellConstraint(generic, cellConstraint(setting));
    const g = metricTensor(cell);
    for (const operation of spaceGroupOperations(setting)) {
      checked++;
      const w = operation.rotation;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          let sum = 0;
          for (let k = 0; k < 3; k++) {
            for (let l = 0; l < 3; l++) {
              sum += (w[k]?.[i] ?? 0) * (g[k]?.[l] ?? 0) * (w[l]?.[j] ?? 0);
            }
          }
          if (Math.abs(sum - (g[i]?.[j] ?? 0)) > 1e-9) violations++;
        }
      }
    }
  }
  expect(checked).toBe(7244);
  expect(violations).toBe(0);
});

/** The one setting of a number built on a given unique axis. */
function settingWhere(number: number, axis: 'a' | 'b' | 'c') {
  const found = spaceGroupsWhere(
    (setting) => setting.number === number && setting.uniqueAxis === axis,
  )[0];
  if (found === undefined) {
    throw new Error(`space group ${number} has no setting on axis ${axis}`);
  }
  return found;
}

/** The one setting of a number written on given axes. */
function settingOnAxes(number: number, axes: 'hexagonal' | 'rhombohedral') {
  const found = spaceGroupsWhere(
    (setting) => setting.number === number && setting.axes === axes,
  )[0];
  if (found === undefined) {
    throw new Error(`space group ${number} has no ${axes} setting`);
  }
  return found;
}

function byName(a: readonly [string, number], b: readonly [string, number]) {
  return a[0] < b[0] ? -1 : 1;
}
