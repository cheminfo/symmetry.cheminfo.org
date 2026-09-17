import { expect, test } from 'vitest';

import { moleculeById } from '../../../data/molecules.ts';
import { detectPointGroup } from '../../../symmetry/detect.ts';
import type { PointOperation } from '../../../symmetry/operations.ts';
import { moleculeElements, structureRadius } from '../moleculeElements.ts';

/** The operations of a library molecule, in its own frame. */
function operationsOfMolecule(id: string): readonly PointOperation[] {
  const entry = moleculeById(id);
  if (entry === undefined) throw new Error(`no molecule ${id}`);
  return detectPointGroup(
    entry.atoms.map((atom) => atom.position),
    entry.atoms.map((atom) => atom.element),
  ).operations;
}

/** What was drawn, as `kind:label`, in the order the drawings come out. */
function drawn(
  operations: readonly PointOperation[],
  options: Parameters<typeof moleculeElements>[1],
): string[] {
  return moleculeElements(operations, options).map(
    (drawing) => `${drawing.kind}:${drawing.label}`,
  );
}

test("water's four operations fold onto three elements", () => {
  const operations = operationsOfMolecule('water');
  expect(operations).toHaveLength(4);

  expect(drawn(operations, { radius: 1 })).toStrictEqual([
    'rotation:C2',
    'mirror:σ',
    'mirror:σ',
  ]);
});

test('an axis carries one element whatever its powers, and both senses are one', () => {
  const operations = operationsOfMolecule('benzene');
  // D6h: 24 operations, and the C6 axis alone accounts for five of them.
  expect(operations).toHaveLength(24);
  const elements = moleculeElements(operations, { radius: 3, improper: true });

  const rotations = elements.filter((drawing) => drawing.kind === 'rotation');
  const mirrors = elements.filter((drawing) => drawing.kind === 'mirror');
  const centres = elements.filter((drawing) => drawing.kind === 'inversion');
  // The counts the `benzene-elements` exercise asks a student for.
  expect(rotations).toHaveLength(7);
  expect(mirrors).toHaveLength(7);
  expect(centres).toHaveLength(1);
  // One C6, six C2: the highest order on an axis is the one it is named by.
  expect(rotations.map((drawing) => drawing.label).toSorted()).toStrictEqual([
    'C2',
    'C2',
    'C2',
    'C2',
    'C2',
    'C2',
    'C6',
  ]);
});

test('a layer that is off draws nothing', () => {
  const operations = operationsOfMolecule('benzene');

  expect(
    drawn(operations, { radius: 3, axes: false, mirrors: false }),
  ).toStrictEqual(['inversion:i']);
  expect(
    moleculeElements(operations, { radius: 3, inversion: false }).filter(
      (drawing) => drawing.kind === 'inversion',
    ),
  ).toStrictEqual([]);
});

test('improper axes are drawn only when asked for', () => {
  const operations = operationsOfMolecule('methane');
  const without = moleculeElements(operations, { radius: 1.2 });
  const shown = moleculeElements(operations, { radius: 1.2, improper: true });

  expect(
    without.filter((drawing) => drawing.kind === 'rotoinversion'),
  ).toStrictEqual([]);
  // Td carries three S4 axes, and they are the three the layer adds.
  expect(
    shown
      .filter((drawing) => drawing.kind === 'rotoinversion')
      .map((drawing) => drawing.label),
  ).toStrictEqual(['S4', 'S4', 'S4']);
});

test('every element is drawn through the centroid, which is the origin', () => {
  const elements = moleculeElements(operationsOfMolecule('ammonia'), {
    radius: 1.5,
    improper: true,
  });
  expect(elements.length).toBeGreaterThan(0);
  for (const drawing of elements) {
    expect(drawing.point).toStrictEqual([0, 0, 0]);
  }
});

test('the drawing radius never drops below one ångström', () => {
  expect(structureRadius([[0, 0, 0]])).toBe(1);
  expect(
    structureRadius([
      [0.3, 0, 0],
      [0, 0.2, 0],
    ]),
  ).toBe(1);
  expect(
    structureRadius([
      [3, 4, 0],
      [1, 0, 0],
    ]),
  ).toBe(5);
});
