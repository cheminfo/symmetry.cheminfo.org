import { expect, test } from 'vitest';

import { MOLECULES, moleculeById } from '../../../data/molecules.ts';
import { POINT_GROUPS } from '../../../data/pointGroups.ts';
import { detectPointGroup } from '../../../symmetry/detect.ts';
import { axisLetter } from '../../../symmetry/point/labels.ts';
import { operationDisplayNames } from '../../../symmetry/point/naming.ts';
import { operationsOf } from '../../../symmetry/pointGroups.ts';
import { groupOperationNames } from '../../../symmetry/validate.ts';
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

test('and never by a Cartesian vector, which is what the 3D labels print', () => {
  // The buttons of the operations panel and the labels drawn in the scene are
  // this list. Benzene once carried `σv(⊥[0.866 0.5 0])` on both.
  const wrong: string[] = [];
  for (const entry of MOLECULES) {
    const positions = entry.atoms.map((atom) => atom.position);
    const elements = entry.atoms.map((atom) => atom.element);
    for (const name of operationNames(
      detectPointGroup(positions, elements).operations,
    )) {
      if (name.includes('[') || /\d\.\d/.test(name)) {
        wrong.push(`${entry.id} ${name}`);
      }
    }
  }
  expect(wrong).toStrictEqual([]);
});

test('benzene names its principal two-fold C2(z), and the other six otherwise', () => {
  const entry = moleculeById('benzene');
  if (entry === undefined) throw new Error('the library has no benzene');
  const detected = detectPointGroup(
    entry.atoms.map((atom) => atom.position),
    entry.atoms.map((atom) => atom.element),
  );
  const twoFolds = operationNames(detected.operations).filter((name) =>
    name.startsWith('C2'),
  );

  expect(twoFolds).toHaveLength(7);
  expect(twoFolds.filter((name) => name === 'C2(z)')).toHaveLength(1);
  // The other six are the ring plane's, in two classes of three, and no
  // operation of D6h turns one kind into the other.
  expect(twoFolds.toSorted()).toStrictEqual([
    'C2(z)',
    'C2^′(1)',
    'C2^′(2)',
    'C2^′(3)',
    'C2^″(1)',
    'C2^″(2)',
    'C2^″(3)',
  ]);
});

test('the workbench, the catalogue and the exercise validator name alike', () => {
  // An exercise answer, a `?operation=` link and a catalogue listing are three
  // spellings of one name, so they are one function.
  let checked = 0;
  for (const group of POINT_GROUPS) {
    if (!Number.isFinite(group.order)) continue;
    const expected = groupOperationNames(group.id);
    expect(operationNames(operationsOf(group.id)), group.id).toStrictEqual(
      expected,
    );
    expect(
      operationDisplayNames(operationsOf(group.id)),
      group.id,
    ).toStrictEqual(expected);
    checked++;
  }
  expect(checked).toBe(51);
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
