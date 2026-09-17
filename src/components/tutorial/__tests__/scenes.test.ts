import { expect, test } from 'vitest';

import { spaceGroup } from '../../../symmetry/spaceGroups.ts';
import { PROBE_POINT, crystalScene, defaultCell } from '../crystalScene.ts';
import { moleculeScene, viewerOperation } from '../moleculeScene.ts';

test('a molecule scene carries the detected group, not a recorded one', () => {
  const built = moleculeScene('water');

  expect(built.group).toBe('C2v');
  expect(built.operations).toHaveLength(4);
  expect(built.scene.atoms).toHaveLength(3);
  expect(built.scene.elements).toHaveLength(3);
  expect(built.scene.play).toBe(null);
});

test('the structure is centred, so an element through the origin runs through it', () => {
  const { atoms } = moleculeScene('benzene').scene;
  let x = 0;
  let y = 0;
  let z = 0;
  for (const atom of atoms) {
    x += atom.position[0];
    y += atom.position[1];
    z += atom.position[2];
  }
  expect(Math.abs(x) + Math.abs(y) + Math.abs(z)).toBeLessThan(1e-9);
});

test('a step plays the operation it names, by the name the group spells', () => {
  const built = moleculeScene('water', { play: { nonce: 3, name: 'σv(xz)' } });

  expect(built.scene.play).toStrictEqual({
    nonce: 3,
    operation: { kind: 'mirror', normal: [0, 1, 0], point: [0, 0, 0] },
  });
});

test('a name the group does not carry plays nothing rather than throwing', () => {
  expect(
    moleculeScene('water', { play: { nonce: 1, name: 'C17' } }).scene.play,
  ).toBe(null);
});

test('a molecule the library has not got is named in the error', () => {
  expect(() => moleculeScene('phlogiston')).toThrow(
    'no molecule phlogiston in the library',
  );
});

test('the identity moves nothing, so it plays as nothing', () => {
  const identity = moleculeScene('water').operations.find(
    (operation) => operation.kind === 'E',
  );
  if (identity === undefined) throw new Error('no identity in the group');
  expect(viewerOperation(identity)).toBe(null);
});

test('one general point in Fm-3m becomes its 192 images', () => {
  const built = crystalScene(spaceGroup(225), { axes: true, mirrors: true });

  expect(built.multiplicity).toBe(192);
  expect(built.scene.atoms).toHaveLength(192);
  expect(built.scene.cell).toStrictEqual({
    a: 8,
    b: 8,
    c: 8,
    alpha: 90,
    beta: 90,
    gamma: 90,
  });
  expect(built.elementCount).toBe(49);
});

test('the orbit layer is what puts the point in the cell', () => {
  const built = crystalScene(spaceGroup(225), { orbit: false });

  expect(built.scene.atoms).toStrictEqual([]);
  // The multiplicity is a fact about the group, not about what is drawn.
  expect(built.multiplicity).toBe(192);
});

test('P1 moves nothing and has no element to draw', () => {
  const built = crystalScene(spaceGroup(1), {
    axes: true,
    mirrors: true,
    glides: true,
    screws: true,
    inversion: true,
  });

  expect(built.multiplicity).toBe(1);
  expect(built.elementCount).toBe(0);
});

test('the probe sits in no special position', () => {
  expect(PROBE_POINT).toStrictEqual([0.13, 0.21, 0.07]);
  // A general position in P-1 has two images; a probe on the centre would have one.
  expect(crystalScene(spaceGroup(2)).multiplicity).toBe(2);
});

test('the drawing cell has the metric shape its crystal system allows', () => {
  expect(defaultCell('cubic')).toStrictEqual({
    a: 8,
    b: 8,
    c: 8,
    alpha: 90,
    beta: 90,
    gamma: 90,
  });
  expect(defaultCell('trigonal')).toStrictEqual({
    a: 8,
    b: 8,
    c: 11,
    alpha: 90,
    beta: 90,
    gamma: 120,
  });
  expect(defaultCell('monoclinic').beta).toBe(105);
  expect(defaultCell('triclinic')).toStrictEqual({
    a: 8,
    b: 9.5,
    c: 11,
    alpha: 98,
    beta: 105,
    gamma: 112,
  });
});
