import { expect, test } from 'vitest';

import { spaceGroup } from '../../symmetry/spaceGroups.ts';
import type { CrystalStructure } from '../cif/index.ts';
import {
  operationsBelong,
  resolveStructureSetting,
  settingOfOperations,
} from '../resolve.ts';

const CELL = { a: 5, b: 5, c: 5, alpha: 90, beta: 90, gamma: 90 };

function structure(
  spaceGroupFields: CrystalStructure['spaceGroup'],
  symopsXyz: readonly string[] = [],
): CrystalStructure {
  return {
    name: 'test',
    formula: '',
    cell: CELL,
    spaceGroup: spaceGroupFields,
    symopsXyz,
    sites: [],
    source: {},
  };
}

test('a Hall symbol decides on its own', () => {
  const resolved = resolveStructureSetting(
    structure({ number: null, hm: null, hall: '-P 2ybc' }),
  );
  expect(resolved.from).toBe('hall');
  expect(resolved.setting?.number).toBe(14);
  expect(resolved.setting?.variant).toBe(0);
});

test('a symbol plus a number never drifts onto another number', () => {
  const resolved = resolveStructureSetting(
    structure({ number: 227, hm: 'F d -3 m :2', hall: null }),
  );
  expect(resolved.from).toBe('symbol');
  expect(resolved.setting?.number).toBe(227);
  expect(resolved.setting?.variant).toBe(0);
  expect(resolved.setting?.originChoice).toBe(2);
});

test('a bare Fd-3m is ambiguous, and both origins come back', () => {
  const resolved = resolveStructureSetting(
    structure({ number: 227, hm: 'Fd-3m', hall: null }),
  );
  expect(resolved.candidates).toHaveLength(2);
  expect(resolved.candidates.map((entry) => entry.originChoice)).toStrictEqual([
    2, 1,
  ]);
});

test('a file with no symbol is named by its own operation list', () => {
  const operations = spaceGroup(14).operations;
  expect(operations).toHaveLength(4);
  const resolved = resolveStructureSetting(
    structure({ number: null, hm: null, hall: null }, operations),
  );
  expect(resolved.from).toBe('operations');
  expect(resolved.setting?.number).toBe(14);
  expect(resolved.agrees).toBe(true);
});

test('a file that contradicts its own symbol says so, and names what it is', () => {
  const resolved = resolveStructureSetting(
    structure({ number: 1, hm: 'P 1', hall: null }, spaceGroup(14).operations),
  );
  expect(resolved.setting?.number).toBe(1);
  expect(resolved.agrees).toBe(false);
  expect(resolved.fromOperations?.number).toBe(14);
});

test('a file naming nothing the catalogue knows resolves to nothing', () => {
  const resolved = resolveStructureSetting(
    structure({ number: null, hm: 'P 99 nonsense', hall: null }),
  );
  expect(resolved.setting).toBeNull();
  expect(resolved.from).toBeNull();
  expect(resolved.candidates).toStrictEqual([]);
});

test('a shorter list is not a disagreement, an outside operation is', () => {
  const fm3m = spaceGroup(225);
  expect(operationsBelong([], fm3m)).toBeNull();
  expect(operationsBelong(['x,y,z', '-x,-y,z'], fm3m)).toBe(true);
  expect(operationsBelong(['x,y,z', 'x+1/3,y,z'], fm3m)).toBe(false);
  expect(operationsBelong(['not an operation'], fm3m)).toBe(false);
});

test('the operation search wants the whole coset list, not part of it', () => {
  expect(settingOfOperations([])).toBeNull();
  expect(settingOfOperations(['x,y,z', '-x,-y,z'])?.number).toBe(3);
  expect(settingOfOperations(['x,y,z'])?.number).toBe(1);
  expect(settingOfOperations(['nonsense'])).toBeNull();
});
