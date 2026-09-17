/**
 * Naming the operations of a group the way a chemist writes them.
 *
 * What is asserted here is the spelling a student reads, because that is the
 * whole point of the function: the arithmetic was already exact when the page
 * printed `σd(⊥[0.259 0.966 0])`.
 */

import { expect, test } from 'vitest';

import { POINT_GROUPS } from '../../data/pointGroups.ts';
import { operationDisplayNames, operationPlace } from '../point/naming.ts';
import { operationsOf } from '../pointGroups.ts';

/** The names of one group, by its `PointGroup.id`. */
function names(group: string): readonly string[] {
  return operationDisplayNames(operationsOf(group));
}

test('a label a group uses once is the name, and a repeat carries its plane', () => {
  expect(names('C2v')).toStrictEqual(['E', 'C2', 'σv(xz)', 'σv(yz)']);
  expect(names('C2h')).toStrictEqual(['E', 'C2', 'σh', 'i']);
});

test('a cubic axis is named by its direction indices, with a bar for a minus', () => {
  const td = names('Td');
  expect(td.filter((name) => name.startsWith('σ'))).toStrictEqual([
    'σ(11̄0)',
    'σ(110)',
    'σ(011̄)',
    'σ(101̄)',
    'σ(011)',
    'σ(101)',
  ]);
  expect(td).toContain('C3(111)');
  expect(td).toContain('C3^2(11̄1̄)');
  // The three S4 lie along the coordinate axes, so they keep their letters.
  expect(td.filter((name) => name.startsWith('S4('))).toStrictEqual([
    'S4(y)',
    'S4(x)',
    'S4(z)',
  ]);
});

test('three mirrors with no rational direction take primes, as a textbook does', () => {
  // C3v's three σv sit at 0°, 60° and 120°: only the first has indices.
  expect(names('C3v')).toStrictEqual(['E', 'C3', 'σv', 'C3^2', 'σv^′', 'σv^″']);
  expect(names('D3h').filter((name) => name.startsWith('C2'))).toStrictEqual([
    'C2',
    'C2^′',
    'C2^″',
  ]);
});

test('a class of six with no rational direction is numbered, never vectorised', () => {
  const d6d = names('D6d');
  expect(d6d.filter((name) => name.startsWith('σd'))).toStrictEqual([
    'σd(1)',
    'σd(2)',
    'σd(3)',
    'σd(4)',
    'σd(5)',
    'σd(6)',
  ]);
  expect(d6d).toContain('S12^11');
  expect(d6d).toContain('C3^2');
});

test('the principal two-fold of D6h is named for its axis, not for a position', () => {
  // Seven operations of D6h are labelled C2, and numbering them 1 to 7 across
  // the group loses the one fact a chemist reads off them: one is the axis the
  // ring turns about and the other six lie in the ring plane.
  const d6h = names('D6h');
  expect(d6h.filter((name) => name.startsWith('C2')).toSorted()).toStrictEqual([
    'C2(z)',
    'C2^′(1)',
    'C2^′(2)',
    'C2^′(3)',
    'C2^″(1)',
    'C2^″(2)',
    'C2^″(3)',
  ]);
  // Six planes, in two classes of three, and the numbers restart in each.
  expect(d6h.filter((name) => name.startsWith('σv')).toSorted()).toStrictEqual([
    'σv(1)',
    'σv(2)',
    'σv(3)',
    'σv^′(1)',
    'σv^′(2)',
    'σv^′(3)',
  ]);
});

test('a class takes the prime where two of them carry one label', () => {
  // D6 has the same seven two-folds as D6h and names them the same way; C6v has
  // no two-fold off its axis, so its six planes are the pair of classes there.
  expect(
    names('D6')
      .filter((name) => name.startsWith('C2'))
      .toSorted(),
  ).toStrictEqual([
    'C2(z)',
    'C2^′(1)',
    'C2^′(2)',
    'C2^′(3)',
    'C2^″(1)',
    'C2^″(2)',
    'C2^″(3)',
  ]);
  expect(
    names('C6v')
      .filter((name) => name.startsWith('σ'))
      .toSorted(),
  ).toStrictEqual(['σv(1)', 'σv(2)', 'σv(3)', 'σv^′(1)', 'σv^′(2)', 'σv^′(3)']);
});

test('no name of any group carries a Cartesian component, and none repeats', () => {
  let checked = 0;
  for (const group of POINT_GROUPS) {
    if (!Number.isFinite(group.order)) continue;
    checked++;
    const written = names(group.id);
    expect(written, group.id).toHaveLength(group.order);
    expect(new Set(written).size, group.id).toBe(group.order);
    for (const name of written) {
      expect(name.includes('['), `${group.id}: ${name}`).toBe(false);
      expect(name.includes('.'), `${group.id}: ${name}`).toBe(false);
    }
  }
  // 53 groups, less the two linear ones, which have no operation list at all.
  expect(checked).toBe(51);
});

test('a place is the plane, the direction indices, or nothing at all', () => {
  const identity = operationsOf('C1')[0];
  if (identity === undefined) throw new Error('C1 has no identity');
  expect(operationPlace(identity)).toBeNull();
  const oh = operationsOf('Oh');
  const places = oh.map((operation) => operationPlace(operation));
  expect(places.filter((place) => place === '110')).toHaveLength(2);
  expect(places.filter((place) => place === '111')).toHaveLength(4);
  // The inversion centre has no axis, so it has no place.
  expect(places.filter((place) => place === null)).toHaveLength(2);
});
