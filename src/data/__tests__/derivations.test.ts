/**
 * The derivations the content is held to, tested on their own.
 *
 * The content tests prove the authored answers agree with these functions; this
 * file proves the functions agree with the chemistry, on cases no exercise
 * happens to ask about.
 */

import { expect, test } from 'vitest';

import {
  canonicalPlaneGroup,
  canonicalSchoenflies,
  deriveCount,
  groupOperationNames,
  moleculePointGroup,
  operationByName,
  properAxisCount,
  validateExercise,
} from '../../symmetry/validate.ts';
import { exerciseById } from '../exercises/index.ts';
import type { Exercise } from '../exercises/types.ts';
import { finitePointGroups } from '../pointGroups.ts';

// This sweeps all 51 finite groups; on a loaded machine it runs past the 5 s
// default.
const SWEEP_TIMEOUT = 30_000;

test('a molecule of the library is named by the detector, not by its record', () => {
  expect(moleculePointGroup('water')).toBe('C2v');
  expect(moleculePointGroup('ethane-staggered')).toBe('D3d');
  expect(moleculePointGroup('ethane-eclipsed')).toBe('D3h');
  expect(moleculePointGroup('carbon-dioxide')).toBe('Dinfh');
  expect(moleculePointGroup('carbonyl-sulfide')).toBe('Cinfv');
  expect(() => moleculePointGroup('unobtainium')).toThrow(
    'no molecule unobtainium in the library',
  );
});

test('every countable quantity comes back, or comes back null', () => {
  expect(deriveCount('molecule:benzene', 'order')).toBe(24);
  expect(deriveCount('molecule:benzene', 'classes')).toBe(12);
  expect(deriveCount('molecule:benzene', 'irreps')).toBe(12);
  expect(deriveCount('molecule:benzene', 'mirrorPlanes')).toBe(7);
  expect(deriveCount('molecule:benzene', 'properAxes')).toBe(7);
  expect(deriveCount('molecule:benzene', 'improperOperations')).toBe(12);
  expect(deriveCount('molecule:water', 'vibrations')).toBe(3);
  expect(deriveCount('molecule:carbon-dioxide', 'vibrations')).toBe(4);
  expect(deriveCount('molecule:ethyne', 'vibrations')).toBe(7);
  expect(deriveCount('pointGroup:c2v', 'infraredActiveIrreps')).toBe(3);
  expect(deriveCount('pointGroup:c2v', 'ramanActiveIrreps')).toBe(4);
  expect(deriveCount('pointGroup:td', 'infraredActiveIrreps')).toBe(1);
  expect(deriveCount('spaceGroup:225', 'generalPositions')).toBe(192);
  expect(deriveCount('spaceGroup:225', 'latticePoints')).toBe(4);
  expect(deriveCount('spaceGroup:167', 'latticePoints')).toBe(3);
  expect(deriveCount('spaceGroup:14', 'settings')).toBe(9);
  expect(deriveCount('wallpaper:p6m', 'operationsPerCell')).toBe(12);
});

test('a quantity that does not apply is null rather than a wrong number', () => {
  expect(deriveCount('molecule:carbon-dioxide', 'order')).toBeNull();
  expect(deriveCount('molecule:carbon-dioxide', 'irreps')).toBeNull();
  expect(deriveCount('pointGroup:c7', 'irreps')).toBeNull();
  expect(deriveCount('pointGroup:c2v', 'vibrations')).toBeNull();
  expect(deriveCount('pointGroup:nonsense', 'order')).toBeNull();
  expect(deriveCount('spaceGroup:231', 'generalPositions')).toBeNull();
  expect(deriveCount('spaceGroup:14', 'operationsPerCell')).toBeNull();
  expect(deriveCount('wallpaper:p6m', 'order')).toBeNull();
  expect(deriveCount('frieze:p2mg', 'operationsPerCell')).toBeNull();
});

test('an axis and its opposite are one axis', () => {
  expect(properAxisCount('C2v')).toBe(1);
  expect(properAxisCount('D6h')).toBe(7);
  expect(properAxisCount('Td')).toBe(7);
  expect(properAxisCount('Oh')).toBe(13);
  expect(properAxisCount('Ih')).toBe(31);
});

test('a Schoenflies symbol is read however it was typed', () => {
  expect(canonicalSchoenflies('c2v')).toBe('C2v');
  expect(canonicalSchoenflies('C₂ᵥ')).toBe('C2v');
  expect(canonicalSchoenflies('D∞h')).toBe('Dinfh');
  expect(canonicalSchoenflies('D*h')).toBe('Dinfh');
  expect(canonicalSchoenflies('d oo h')).toBe('Dinfh');
  expect(canonicalSchoenflies('D-inf-h')).toBe('Dinfh');
  expect(canonicalSchoenflies('Tₔ')).toBe('Td');
  expect(canonicalSchoenflies('p4m')).toBeNull();
  expect(canonicalSchoenflies('')).toBeNull();
});

test('a plane group is read in its own namespace and no other', () => {
  expect(canonicalPlaneGroup('p4mm', 'wallpaper')).toBe('p4m');
  expect(canonicalPlaneGroup('c2mm', 'wallpaper')).toBe('cmm');
  expect(canonicalPlaneGroup('*442', 'wallpaper')).toBe('p4m');
  expect(canonicalPlaneGroup('P2GG', 'wallpaper')).toBe('pgg');
  expect(canonicalPlaneGroup('p112', 'frieze')).toBe('p2');
  expect(canonicalPlaneGroup('∞×', 'frieze')).toBe('p11g');
  expect(canonicalPlaneGroup('p2mg', 'wallpaper')).toBe('pmg');
  expect(canonicalPlaneGroup('p2mg', 'frieze')).toBe('p2mg');
  expect(canonicalPlaneGroup('p4m', 'frieze')).toBeNull();
  expect(canonicalPlaneGroup('p11g', 'wallpaper')).toBeNull();
  expect(canonicalPlaneGroup('  ', 'wallpaper')).toBeNull();
});

test(
  'every finite group names each of its operations exactly once',
  () => {
    const groups = finitePointGroups();
    expect(groups).toHaveLength(51);
    for (const group of groups) {
      const names = groupOperationNames(group.id);
      expect(names, group.id).toHaveLength(group.order);
      expect(new Set(names).size, group.id).toBe(group.order);
      for (const name of names) {
        expect(
          operationByName(group.id, name),
          `${group.id}: ${name}`,
        ).toBeDefined();
      }
    }
  },
  SWEEP_TIMEOUT,
);

test('a name no group carries resolves to nothing', () => {
  expect(operationByName('C2v', 'S17')).toBeUndefined();
  expect(groupOperationNames('C2v')).toStrictEqual([
    'E',
    'C2',
    'σv(xz)',
    'σv(yz)',
  ]);
});

test('an answer that cannot be marked says so instead of failing a case', () => {
  const assign = exerciseById('point-group-water') as Exercise;
  const nonsense = validateExercise(assign, { shape: 'text', value: 'wibble' });
  expect(nonsense.error).toBe(
    '"wibble" is not a Schoenflies symbol. Write it like C2v, D3h, Td or D∞h.',
  );
  expect(nonsense.cases).toStrictEqual([]);

  const count = exerciseById('order-of-ammonia') as Exercise;
  const words = validateExercise(count, {
    shape: 'fields',
    value: { order: 'six', classes: '3', mirrorPlanes: '3' },
  });
  expect(words.error).toBe('Type a whole number — 4, not "four".');

  const wrongShape = validateExercise(count, { shape: 'text', value: '6' });
  expect(wrongShape.error).toBe(
    'order-of-ammonia is answered as fields, not as text.',
  );
});

test('a placed atom of the wrong element or count is refused, not marked', () => {
  const place = exerciseById('place-rock-salt') as Exercise;
  const tooMany = validateExercise(place, {
    shape: 'atoms',
    value: [
      { element: 'Cl', x: 0.5, y: 0, z: 0 },
      { element: 'Cl', x: 0, y: 0.5, z: 0 },
    ],
  });
  expect(tooMany.error).toBe('Place 1 Cl atom: you placed 2.');

  const wrongElement = validateExercise(place, {
    shape: 'atoms',
    value: [{ element: 'Br', x: 0.5, y: 0, z: 0 }],
  });
  expect(wrongElement.error).toBe(
    'This question asks for Cl, and you placed Br.',
  );
});

test('a plane-group answer that names no group says which namespace', () => {
  const pattern = exerciseById('wallpaper-p4m') as Exercise;
  const result = validateExercise(pattern, { shape: 'text', value: 'p11g' });
  expect(result.error).toBe(
    '"p11g" names no wallpaper group. Write the IUC symbol, such as p4m, or the orbifold, such as *442.',
  );
});
