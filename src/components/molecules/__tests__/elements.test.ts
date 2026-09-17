import { expect, test } from 'vitest';

import { MOLECULES, moleculeById } from '../../../data/molecules.ts';
import type { MoleculeAnalysis } from '../assignment.ts';
import { analyseMolecule } from '../assignment.ts';
import type { ElementLayers } from '../elements.ts';
import { atomicExtent, linearElements } from '../elements.ts';

function read(id: string): MoleculeAnalysis {
  const entry = moleculeById(id);
  if (entry === undefined) throw new Error(`no molecule ${id}`);
  return analyseMolecule(entry);
}

/** Every drawing of every layer, in the order the scene receives them. */
function drawings(layers: ElementLayers) {
  return [
    ...layers.axes,
    ...layers.mirrors,
    ...layers.inversion,
    ...layers.improper,
  ];
}

test('the furthest atom sets the reach', () => {
  expect(atomicExtent([[3, 4, 0]])).toBe(5);
  expect(
    atomicExtent([
      [1, 0, 0],
      [0, 0, -2],
    ]),
  ).toBe(2);
  expect(atomicExtent([])).toBe(0);
});

test('the two planes of water are told apart by name, not by symbol', () => {
  const layers = read('water').layers;
  expect(layers.axes.map((one) => one.label)).toStrictEqual(['C2']);
  expect(layers.mirrors.map((one) => one.label)).toStrictEqual([
    'σv(yz)',
    'σv(xz)',
  ]);
  expect(layers.inversion).toStrictEqual([]);
  expect(layers.improper).toStrictEqual([]);
});

test('one axis carries one rod, at the highest order found on it', () => {
  const layers = read('benzene').layers;
  expect(layers.axes).toHaveLength(7);
  expect(layers.axes.map((one) => one.label)).toContain('C6');
  expect(layers.mirrors).toHaveLength(7);
  expect(layers.inversion.map((one) => one.label)).toStrictEqual(['i']);
  // One improper axis: the rod, and the plane it reflects in.
  expect(layers.improper.map((one) => one.label)).toStrictEqual(['S6', '']);
});

test('an improper axis is named where it sits', () => {
  const layers = read('methane').layers;
  expect(
    layers.improper.filter((one) => one.label !== '').map((one) => one.label),
  ).toStrictEqual(['S4(x)', 'S4(y)', 'S4(z)']);
});

test('a linear molecule with a centre carries the axis, the plane and it', () => {
  const layers = linearElements([0, 0, 1], true, 1.16);
  expect(layers.axes.map((one) => one.label)).toStrictEqual(['C∞']);
  expect(layers.mirrors.map((one) => one.label)).toStrictEqual(['σh']);
  expect(layers.inversion.map((one) => one.label)).toStrictEqual(['i']);
  expect(layers.improper).toStrictEqual([]);
  expect(layers.axes[0]?.id).toBe('axis:linear');
});

test('a linear molecule without one carries the axis alone', () => {
  const layers = linearElements([0, 0, 1], false, 1.16);
  expect(layers.axes).toHaveLength(1);
  expect(layers.mirrors).toStrictEqual([]);
  expect(layers.inversion).toStrictEqual([]);
});

test('carbon dioxide is drawn from the linear elements, not from a list', () => {
  const analysis = read('carbon-dioxide');
  expect(analysis.detection.operations).toStrictEqual([]);
  expect(drawings(analysis.layers).map((one) => one.id)).toStrictEqual([
    'axis:linear',
    'plane:linear-h',
    'inversion',
  ]);
});

test('every drawing of every molecule has an id of its own', () => {
  let checked = 0;
  for (const entry of MOLECULES) {
    const all = drawings(analyseMolecule(entry).layers);
    const ids = new Set(all.map((one) => one.id));
    expect(ids.size).toBe(all.length);
    checked++;
  }
  expect(checked).toBe(56);
});

test('a rod reaches past the atoms it is drawn through', () => {
  const analysis = read('benzene');
  const rod = analysis.layers.axes.find((one) => one.label === 'C6');
  expect(rod?.kind).toBe('rotation');
  if (rod?.kind !== 'rotation') throw new Error('no C6 rod');
  expect(rod.length).toBeGreaterThan(2 * analysis.extent);
  expect(rod.order).toBe(6);
  expect(rod.point).toStrictEqual([0, 0, 0]);
});
