import { expect, test } from 'vitest';

import { MOLECULES } from '../../../data/molecules.ts';
import { detectPointGroup } from '../../../symmetry/detect.ts';
import { operationsOf } from '../../../symmetry/pointGroups.ts';
import { operationDescription, viewerOperationOf } from '../viewerOperation.ts';

/** The operation of a catalogue group with this name, in the standard frame. */
function operation(group: string, label: string) {
  const found = operationsOf(group).find((one) => one.label === label);
  if (found === undefined) throw new Error(`no ${label} in ${group}`);
  return found;
}

test('the identity is nothing to play', () => {
  expect(viewerOperationOf(operation('C2v', 'E'))).toBe(null);
});

test('a rotation is played about its own axis, through the centroid', () => {
  expect(viewerOperationOf(operation('C3v', 'C3'))).toStrictEqual({
    kind: 'rotation',
    axis: [0, 0, 1],
    origin: [0, 0, 0],
    order: 3,
    power: 1,
  });
});

test('an improper rotation is played as one, not as a rotation', () => {
  expect(viewerOperationOf(operation('S4', 'S4'))).toStrictEqual({
    kind: 'improperRotation',
    axis: [-0, -0, 1],
    origin: [0, 0, 0],
    order: 4,
    power: 1,
  });
});

test('the inversion is played through the centroid', () => {
  expect(viewerOperationOf(operation('Ci', 'i'))).toStrictEqual({
    kind: 'inversion',
    centre: [0, 0, 0],
  });
});

test('a mirror is played about the plane, which is given by its normal', () => {
  expect(viewerOperationOf(operation('Cs', 'σh'))).toStrictEqual({
    kind: 'mirror',
    normal: [0, 0, 1],
    point: [0, 0, 0],
  });
});

test('each kind says in one sentence what it does', () => {
  expect(operationDescription(operation('C2v', 'E'))).toBe(
    'Leaves every atom where it is.',
  );
  expect(operationDescription(operation('Ci', 'i'))).toBe(
    'Sends every atom straight through the centre to the far side.',
  );
  expect(operationDescription(operation('Cs', 'σh'))).toBe(
    'Reflects in the plane perpendicular to z.',
  );
  expect(operationDescription(operation('C3v', 'C3'))).toBe(
    'Turns by 120° about z.',
  );
  expect(operationDescription(operation('S4', 'S4'))).toBe(
    'Turns by 90° about z, then reflects in the plane perpendicular to it.',
  );
});

test('an angle that is not whole keeps one decimal', () => {
  expect(operationDescription(operation('C7', 'C7'))).toBe(
    'Turns by 51.4° about z.',
  );
});

test('every operation the library detects can be played and described', () => {
  let checked = 0;
  for (const entry of MOLECULES) {
    const detection = detectPointGroup(
      entry.atoms.map((atom) => atom.position),
      entry.atoms.map((atom) => atom.element),
    );
    for (const one of detection.operations) {
      const played = viewerOperationOf(one);
      expect(played === null).toBe(one.kind === 'E');
      expect(operationDescription(one).endsWith('.')).toBe(true);
      checked++;
    }
  }
  expect(checked).toBe(933);
});
