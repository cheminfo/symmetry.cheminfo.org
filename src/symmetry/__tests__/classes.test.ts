/**
 * The partition a name is read off.
 *
 * What is asserted is the shape of the classes rather than the arithmetic: a
 * class is what says the principal two-fold of D₆ₕ is not one of the six in the
 * ring plane, and that is the whole reason the naming asks for it.
 */

import { expect, test } from 'vitest';

import { operationClassIndices } from '../point/classes.ts';
import { operationsOf } from '../pointGroups.ts';

/** Smallest class first, so a shape can be asserted without fixing the order. */
function ascending(one: number, other: number): number {
  return one - other;
}

/** The size of each class of a group, in the order the classes first appear. */
function sizes(group: string): number[] {
  const indices = operationClassIndices(operationsOf(group));
  const counts: number[] = [];
  for (const index of indices) counts[index] = (counts[index] ?? 0) + 1;
  return counts;
}

test('an abelian group puts every operation in a class of its own', () => {
  expect(operationClassIndices(operationsOf('C2v'))).toStrictEqual([
    0, 1, 2, 3,
  ]);
  expect(sizes('C2h')).toStrictEqual([1, 1, 1, 1]);
});

test('D6h splits its seven two-folds into a class of one and two of three', () => {
  const operations = operationsOf('D6h');
  const indices = operationClassIndices(operations);
  const classes = new Set<number>();
  for (let index = 0; index < operations.length; index++) {
    if ((operations[index] as { label: string }).label === 'C2') {
      classes.add(indices[index] as number);
    }
  }
  expect(classes.size).toBe(3);
  expect(sizes('D6h').toSorted(ascending)).toStrictEqual([
    1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3,
  ]);
});

test('Td has the five classes its character table has columns', () => {
  expect(sizes('Td').toSorted(ascending)).toStrictEqual([1, 3, 6, 6, 8]);
  expect(sizes('Oh').toSorted(ascending)).toStrictEqual([
    1, 1, 3, 3, 6, 6, 6, 6, 8, 8,
  ]);
});

test('every operation of every finite group lands in exactly one class', () => {
  const groups = ['C1', 'Ci', 'Cs', 'S4', 'D2d', 'D3d', 'C6v', 'D5h', 'Ih'];
  for (const group of groups) {
    const operations = operationsOf(group);
    const indices = operationClassIndices(operations);
    expect(indices, group).toHaveLength(operations.length);
    for (const index of indices) expect(index, group).toBeGreaterThan(-1);
  }
  expect(sizes('Ih').toSorted(ascending)).toStrictEqual([
    1, 1, 12, 12, 12, 12, 15, 15, 20, 20,
  ]);
});
