import { expect, test } from 'vitest';

import { MOLECULES } from '../../../data/molecules.ts';
import { detectPointGroup } from '../../../symmetry/detect.ts';
import { axisLetter } from '../../../symmetry/point/labels.ts';
import { operationsOf } from '../../../symmetry/pointGroups.ts';
import {
  indexOfName,
  operationLabelParts,
  operationNames,
} from '../operationNames.ts';

test('a label the group carries once is the whole name', () => {
  // Three planes at 60° to each other have no direction indices, so a textbook
  // primes them — and the workbench spells them exactly as the catalogue does.
  expect(operationNames(operationsOf('C3v'))).toStrictEqual([
    'E',
    'C3',
    'σv',
    'C3^2',
    'σv^′',
    'σv^″',
  ]);
});

test('an axis on a rational direction is named by its indices, never a vector', () => {
  const names = operationNames(operationsOf('Td'));
  expect(names).toContain('C3(111)');
  expect(names).toContain('σ(11̄0)');
  expect(names).toContain('S4(x)');
  for (const name of names) expect(name).not.toContain('[');
});

test('a repeated label carries the plane or the axis it acts in', () => {
  expect(operationNames(operationsOf('C2v'))).toStrictEqual([
    'E',
    'C2',
    'σv(xz)',
    'σv(yz)',
  ]);
});

test('every molecule of the library names its operations uniquely', () => {
  let checked = 0;
  for (const entry of MOLECULES) {
    const positions = entry.atoms.map((atom) => atom.position);
    const elements = entry.atoms.map((atom) => atom.element);
    const names = operationNames(
      detectPointGroup(positions, elements).operations,
    );
    expect(new Set(names).size).toBe(names.length);
    checked++;
  }
  expect(checked).toBe(56);
});

test('a name the molecule has not got is -1, so a stale link still opens', () => {
  const operations = operationsOf('C2v');
  expect(indexOfName(operations, 'σv(yz)')).toBe(3);
  expect(indexOfName(operations, 'C3')).toBe(-1);
});

test('a name splits into what is set where', () => {
  expect(operationLabelParts('C3^2')).toStrictEqual({
    multiplicity: '',
    symbol: 'C',
    subscript: '3',
    superscript: '2',
    situation: '',
  });
  expect(operationLabelParts('σv(xz)')).toStrictEqual({
    multiplicity: '',
    symbol: 'σ',
    subscript: 'v',
    superscript: '',
    situation: 'xz',
  });
  expect(operationLabelParts('S4^3(x)')).toStrictEqual({
    multiplicity: '',
    symbol: 'S',
    subscript: '4',
    superscript: '3',
    situation: 'x',
  });
  expect(operationLabelParts('i')).toStrictEqual({
    multiplicity: '',
    symbol: 'i',
    subscript: '',
    superscript: '',
    situation: '',
  });
});

test('a class header keeps its count on the line, not under the symbol', () => {
  expect(operationLabelParts('2C6')).toStrictEqual({
    multiplicity: '2',
    symbol: 'C',
    subscript: '6',
    superscript: '',
    situation: '',
  });
  expect(operationLabelParts('12C5^2')).toStrictEqual({
    multiplicity: '12',
    symbol: 'C',
    subscript: '5',
    superscript: '2',
    situation: '',
  });
  expect(operationLabelParts('4σd')).toStrictEqual({
    multiplicity: '4',
    symbol: 'σ',
    subscript: 'd',
    superscript: '',
    situation: '',
  });
});

test('an axis on a Cartesian direction is a letter, either way along it', () => {
  expect(axisLetter([0, 0, 1])).toBe('z');
  expect(axisLetter([0, 0, -1])).toBe('z');
  expect(axisLetter([1, 0, 0])).toBe('x');
  expect(axisLetter([0, 1, 0])).toBe('y');
});

test('any other axis is written out, and never as -0', () => {
  const third = Math.sqrt(1 / 3);
  expect(axisLetter([third, third, third])).toBe('[0.577 0.577 0.577]');
  expect(axisLetter([Math.sqrt(3) / 2, -0.5, -0])).toBe('[0.866 -0.5 0]');
});
