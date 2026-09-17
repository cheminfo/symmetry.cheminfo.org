import { expect, test } from 'vitest';

import { MOLECULES, moleculeById } from '../../../data/molecules.ts';
import { operationsOf } from '../../../symmetry/pointGroups.ts';
import { analyseMolecule } from '../assignment.ts';
import { orbitDrawings, orbitOf } from '../orbit.ts';

test('a general point lands on as many places as the group is large', () => {
  const images = orbitOf(operationsOf('C2v'), [0.37, 0.53, 0.76]);
  expect(images).toHaveLength(4);
  expect(images[0]).toStrictEqual([0.37, 0.53, 0.76]);
});

test('a point on an element has a shorter orbit than the group has operations', () => {
  // On the C2 axis of C2v every operation fixes it, so there is one image.
  expect(orbitOf(operationsOf('C2v'), [0, 0, 1])).toHaveLength(1);
  // In the xz plane, the two operations that hold it leave it alone.
  expect(orbitOf(operationsOf('C2v'), [0.4, 0, 0.9])).toHaveLength(2);
});

test('the probe is moved until its orbit counts the whole group', () => {
  let checked = 0;
  for (const entry of MOLECULES) {
    const analysis = analyseMolecule(entry);
    expect(analysis.orbit).toHaveLength(analysis.detection.operations.length);
    checked++;
  }
  expect(checked).toBe(56);
});

test('only the probe is named, so the images do not bury the structure', () => {
  const entry = moleculeById('water');
  if (entry === undefined) throw new Error('no water');
  const points = analyseMolecule(entry).orbit;
  expect(points.map((one) => one.label)).toStrictEqual([
    'probe point',
    '',
    '',
    '',
  ]);
  expect(points.map((one) => one.id)).toStrictEqual([
    'orbit:0',
    'orbit:1',
    'orbit:2',
    'orbit:3',
  ]);
  expect(points[0]?.kind).toBe('inversion');
});

test('the probe sits outside the structure so nothing hides it', () => {
  const entry = moleculeById('benzene');
  if (entry === undefined) throw new Error('no benzene');
  const analysis = analyseMolecule(entry);
  const first = analysis.orbit[0];
  if (first?.kind !== 'inversion') throw new Error('no probe');
  const radius = Math.hypot(...first.point);
  expect(radius).toBeCloseTo(analysis.extent + 1.1, 10);
});

test('a linear molecule has no operation list, so it has no orbit', () => {
  expect(orbitDrawings([], 2)).toStrictEqual([]);
});
