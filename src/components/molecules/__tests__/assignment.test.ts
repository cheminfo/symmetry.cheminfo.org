import { expect, test } from 'vitest';

import { MOLECULES, moleculeById } from '../../../data/molecules.ts';
import type { MoleculeAnalysis } from '../assignment.ts';
import {
  DEFAULT_TOLERANCE,
  analyseMolecule,
  flowSteps,
} from '../assignment.ts';

function read(id: string): MoleculeAnalysis {
  const entry = moleculeById(id);
  if (entry === undefined) throw new Error(`no molecule ${id}`);
  return analyseMolecule(entry);
}

test('the group is detected from the coordinates, not read off the record', () => {
  let checked = 0;
  for (const entry of MOLECULES) {
    const analysis = analyseMolecule(entry);
    expect(analysis.detection.group).toBe(entry.pointGroup);
    expect(analysis.walkGroup).toBe(entry.pointGroup);
    expect(analysis.detection.closed).toBe(true);
    checked++;
  }
  expect(checked).toBe(56);
});

test('the catalogue row is found for every group the library uses', () => {
  const groups = new Set<string>();
  for (const entry of MOLECULES) {
    const analysis = analyseMolecule(entry);
    expect(analysis.group?.id).toBe(entry.pointGroup);
    groups.add(entry.pointGroup);
  }
  expect(groups.size).toBe(28);
});

test('water is read at a tenth of an ångström, four operations, six questions', () => {
  const analysis = read('water');
  expect(analysis.detection.group).toBe('C2v');
  expect(analysis.detection.order).toBe(4);
  expect(analysis.detection.tolerance).toBe(DEFAULT_TOLERANCE);
  expect(DEFAULT_TOLERANCE).toBe(0.1);
  expect(analysis.names).toStrictEqual(['E', 'σv(yz)', 'C2', 'σv(xz)']);
  expect(analysis.steps.map((one) => one.id)).toStrictEqual([
    'linear',
    'multi-high-axis',
    'any-axis',
    'perp-c2',
    'c-sigma-h',
    'c-sigma-v',
  ]);
  expect(analysis.entry.formula).toBe('H2O');
});

test('the atoms handed to the scene sit about the centroid', () => {
  const analysis = read('water');
  expect(analysis.atoms).toHaveLength(3);
  expect(analysis.atoms.map((atom) => atom.element)).toStrictEqual([
    'O',
    'H',
    'H',
  ]);
  let x = 0;
  let y = 0;
  let z = 0;
  for (const atom of analysis.atoms) {
    x += atom.position[0];
    y += atom.position[1];
    z += atom.position[2];
  }
  expect(x).toBeCloseTo(0, 12);
  expect(y).toBeCloseTo(0, 12);
  expect(z).toBeCloseTo(0, 12);
  expect(analysis.extent).toBeCloseTo(0.781_737_539_328, 10);
});

test('a linear molecule has no finite operation list to group', () => {
  const analysis = read('carbon-dioxide');
  expect(analysis.detection.group).toBe('Dinfh');
  expect(analysis.detection.operations).toStrictEqual([]);
  expect(analysis.names).toStrictEqual([]);
  expect(analysis.classes).toStrictEqual([]);
  expect(analysis.orbit).toStrictEqual([]);
  expect(analysis.inventory.linear).toBe(true);
  expect(analysis.layers.axes).toHaveLength(1);
});

test('reading the same molecule twice reads the same thing', () => {
  const first = read('ammonia');
  const second = read('ammonia');
  expect(second.names).toStrictEqual(first.names);
  expect(second.steps).toStrictEqual(first.steps);
  expect(second.classes.map((one) => one.header)).toStrictEqual(
    first.classes.map((one) => one.header),
  );
});

test('a tighter tolerance reads skewed ethane as the smaller group', () => {
  const entry = moleculeById('ethane-staggered');
  if (entry === undefined) throw new Error('no ethane');
  expect(analyseMolecule(entry, 1e-6).detection.group).toBe('D3d');
  const skew = moleculeById('ethane-skew');
  if (skew === undefined) throw new Error('no skew ethane');
  expect(analyseMolecule(skew, 1e-6).detection.group).toBe('D3');
  expect(analyseMolecule(skew, 0.1).detection.group).toBe('D3');
});

test('a step carries its question, its hint and what was answered', () => {
  const [first] = read('water').steps;
  expect(first).toStrictEqual({
    id: 'linear',
    question: 'Are all the atoms on one straight line?',
    hint: 'Two atoms are always linear. Three or more: check that every bond angle is 180°.',
    answer: false,
    evidence: 'The atoms do not lie on one line.',
  });
});

test('a walk with no principal axis still answers every question it asks', () => {
  const analysis = read('water');
  const steps = flowSteps(['perp-c2:no'], analysis.inventory, null);
  expect(steps).toHaveLength(1);
  expect(steps[0]?.evidence).toBe(
    'There is no principal axis to measure against.',
  );
});
