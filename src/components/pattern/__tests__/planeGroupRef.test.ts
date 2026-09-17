import { expect, test } from 'vitest';

import { formatOperation } from '../../../symmetry/core/index.ts';
import { generatorText, planeGroupFacts } from '../planeFacts.ts';
import {
  DEFAULT_FRIEZE_GROUP,
  FRIEZE_PREFIX,
  planeGroupCell,
  planeGroupId,
  planeGroupOperations,
  resolvePlaneGroup,
} from '../planeGroupRef.ts';

test('a bare symbol is a wallpaper group and a prefixed one is a frieze group', () => {
  const wallpaper = resolvePlaneGroup('p4g');
  expect(wallpaper.kind).toBe('wallpaper');
  expect(wallpaper.id).toBe('p4g');
  expect(wallpaper.group.number).toBe(12);

  const frieze = resolvePlaneGroup('f:p2mg');
  expect(frieze.kind).toBe('frieze');
  expect(frieze.id).toBe('f:p2mg');
  expect(frieze.group.number).toBe(6);
});

test('p1m1 names a different group in each namespace', () => {
  // The frieze group `p1m1`, and the full symbol of the wallpaper group `pm`.
  const wallpaper = resolvePlaneGroup('p1m1');
  expect(wallpaper.kind).toBe('wallpaper');
  expect(wallpaper.group.id).toBe('pm');

  const frieze = resolvePlaneGroup('f:p1m1');
  if (frieze.kind !== 'frieze') throw new Error('f:p1m1 is a frieze group');
  expect(frieze.group.id).toBe('p1m1');
  expect(frieze.group.conway).toBe('sidle');
});

test('an id naming no group opens the default rather than throwing', () => {
  expect(resolvePlaneGroup('p9q').id).toBe('p4m');
  expect(resolvePlaneGroup('f:p9q').id).toBe('p4m');
  expect(resolvePlaneGroup('').id).toBe('p4m');
  expect(resolvePlaneGroup('  P4G ').id).toBe('p4g');
});

test('the frieze prefix is what the link carries', () => {
  expect(FRIEZE_PREFIX).toBe('f:');
  expect(planeGroupId('frieze', DEFAULT_FRIEZE_GROUP)).toBe('f:p2mm');
  expect(planeGroupId('wallpaper', 'p4m')).toBe('p4m');
});

test('the coset list is the one the group declares', () => {
  expect(planeGroupOperations(resolvePlaneGroup('p1'))).toHaveLength(1);
  expect(planeGroupOperations(resolvePlaneGroup('p4m'))).toHaveLength(8);
  expect(planeGroupOperations(resolvePlaneGroup('p6m'))).toHaveLength(12);
  // A centred lattice doubles the list: the centring is an operation here.
  expect(planeGroupOperations(resolvePlaneGroup('cm'))).toHaveLength(4);
  expect(
    planeGroupOperations(resolvePlaneGroup('cm')).map((operation) =>
      formatOperation(operation),
    ),
  ).toStrictEqual(['x,y', '-x,y', 'x+1/2,y+1/2', '-x+1/2,y+1/2']);
  expect(planeGroupOperations(resolvePlaneGroup('f:p2mm'))).toHaveLength(4);
});

test('the cell is the one the lattice allows, and a frieze is drawn square', () => {
  expect(planeGroupCell(resolvePlaneGroup('p4m'), 100)).toStrictEqual({
    a: 100,
    b: 100,
    gamma: 90,
  });
  expect(planeGroupCell(resolvePlaneGroup('p6'), 100)).toStrictEqual({
    a: 100,
    b: 100,
    gamma: 120,
  });
  expect(planeGroupCell(resolvePlaneGroup('p1'), 100)).toStrictEqual({
    a: 100,
    b: 125,
    gamma: 105,
  });
  expect(planeGroupCell(resolvePlaneGroup('f:p2mm'), 100)).toStrictEqual({
    a: 100,
    b: 100,
    gamma: 90,
  });
});

test('the readout names the generators, and says p1 has none', () => {
  const p4m = new Map(planeGroupFacts(resolvePlaneGroup('p4m')));
  expect(p4m.get('Generators')).toBe('-y,x · -x,y');
  expect(p4m.get('Orbifold')).toBe('*442');
  expect(p4m.get('Lattice')).toBe('square');
  expect(p4m.get('Operations')).toBe('8 per cell');
  expect(p4m.get('Asymmetric unit')).toBe(
    'The triangle 0 ≤ y ≤ x ≤ 1/2: an eighth of the cell.',
  );

  expect(
    new Map(planeGroupFacts(resolvePlaneGroup('p1'))).get('Generators'),
  ).toBe('None: the lattice translations alone fill the plane.');
  expect(generatorText(' ; ')).toBe(
    'None: the lattice translations alone fill the plane.',
  );
});

test('a centred lattice says where its second copy sits', () => {
  expect(new Map(planeGroupFacts(resolvePlaneGroup('cm'))).get('Lattice')).toBe(
    'centred rectangular, so every operation repeats at (1/2, 1/2)',
  );
});

test('a frieze readout names Conway and the wallpaper group it is a strip of', () => {
  const facts = new Map(planeGroupFacts(resolvePlaneGroup('f:p11g')));
  expect(facts.get('Number')).toBe('2 of 7');
  expect(facts.get("Conway's name")).toBe('step');
  expect(facts.get('Generators')).toBe('x+1/2,-y');
  expect(facts.get('Operations')).toBe('2 per period');
  expect(facts.get('Strip of')).toBe(
    'pg, once the second translation is added',
  );
  expect(facts.has('Lattice')).toBe(false);
});
