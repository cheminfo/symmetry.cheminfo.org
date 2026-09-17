import { expect, test } from 'vitest';

import { readShareParams } from '../params.ts';

test('a link that says nothing leaves every setting at its default', () => {
  expect(readShareParams({})).toStrictEqual({
    molecule: '',
    operation: '',
    spaceGroup: 225,
    setting: 0,
    structure: '',
    supercell: 1,
    planeGroup: 'p4m',
    motif: '',
    tiles: 4,
  });
});

test('a number past what the tool can serve is brought back inside it', () => {
  const params = readShareParams({
    spaceGroup: '999',
    supercell: '40',
    tiles: '400',
    setting: '-3',
  });

  expect(params.spaceGroup).toBe(230);
  expect(params.supercell).toBe(4);
  expect(params.tiles).toBe(10);
  expect(params.setting).toBe(0);
});

test('a number that is not one falls back rather than throwing', () => {
  const params = readShareParams({ spaceGroup: 'Fm-3m', supercell: '' });

  expect(params.spaceGroup).toBe(225);
  expect(params.supercell).toBe(1);
});

test('a text setting is cut rather than handed on whole', () => {
  const params = readShareParams({
    molecule: 'x'.repeat(200),
    operation: 'y'.repeat(200),
    planeGroup: 'p4g',
  });

  expect(params.molecule).toHaveLength(64);
  expect(params.operation).toHaveLength(32);
  expect(params.planeGroup).toBe('p4g');
});
