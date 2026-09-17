import type { Centring, CrystalSystem } from '../data/spaceGroups.ts';

import type { CrystalOperation, IntegerMatrix } from './core/index.ts';
import {
  centringTranslations,
  classifyRotation,
  elementAxis,
  elementNormal,
  formatTranslation,
  matrixDeterminant,
  multiplyMatrixVector,
  pointGroupName,
  wrapTwelfths,
} from './core/index.ts';

/**
 * Which of the seven crystal systems a crystal class belongs to.
 *
 * The class is what the operations *are*, so the system follows from it and is
 * never transcribed — including the trigonal/hexagonal split, which is a
 * property of the point group and not of the lattice: `-3m` is trigonal on both
 * a hexagonal and a rhombohedral cell.
 *
 * @throws When the name is not one of the 32 crystallographic point groups.
 */
export function crystalSystemOf(crystalClass: string): CrystalSystem {
  for (const [system, classes] of SYSTEM_CLASSES) {
    if (classes.has(crystalClass)) return system;
  }
  throw new RangeError(`${crystalClass} is not a crystal class`);
}

/**
 * The Laue class: the point group of the rotation parts together with their
 * negatives, which is the symmetry a diffraction pattern shows whatever the
 * structure does. Eleven of them.
 */
export function laueClassOf(rotations: readonly IntegerMatrix[]): string {
  const extended: IntegerMatrix[] = [];
  for (const rotation of rotations) {
    extended.push(rotation);
    const negated: number[][] = [];
    for (const row of rotation) {
      const values = new Array<number>(rotation.length).fill(0);
      for (let index = 0; index < rotation.length; index++) {
        values[index] = -(row[index] ?? 0);
      }
      negated.push(values);
    }
    extended.push(negated);
  }
  return pointGroupName(extended, 3);
}

/** Whether `-x,-y,-z` is among the rotation parts. Ninety-two of the 230 are. */
export function isCentrosymmetric(
  rotations: readonly IntegerMatrix[],
): boolean {
  for (const rotation of rotations) {
    let minus = true;
    for (let i = 0; i < rotation.length && minus; i++) {
      for (let j = 0; j < rotation.length; j++) {
        if ((rotation[i]?.[j] ?? 0) !== (i === j ? -1 : 0)) minus = false;
      }
    }
    if (minus) return true;
  }
  return false;
}

/**
 * Whether every operation is proper, so the group can hold a single enantiomer.
 * Sixty-five of the 230 are — the ones a protein or a sugar can crystallise in.
 */
export function isSohncke(rotations: readonly IntegerMatrix[]): boolean {
  for (const rotation of rotations) {
    if (matrixDeterminant(rotation) !== 1) return false;
  }
  return true;
}

/**
 * Whether some origin makes every coset representative's translation a lattice
 * translation — that is, whether the group is the semidirect product of its
 * point group and its lattice. Seventy-three of the 230 are.
 *
 * The search is over the 12³ origins of the twelfth grid, which is exhaustive
 * because every translation occurring in the 230 groups is a twelfth. The
 * shifted translation is tested against the **centring** vectors, not against
 * zero: a C-centred group carries `x+1/2,y+1/2,z` whatever the origin, and
 * testing against zero instead returns 37 rather than 73.
 */
export function isSymmorphic(
  operations: ReadonlyArray<CrystalOperation<3>>,
): boolean {
  const lattice = new Set(
    centringTranslations(operations).map((shift) => shift.join(',')),
  );
  const representatives = new Map<string, CrystalOperation<3>>();
  for (const operation of operations) {
    const key = operationRotationKey(operation.rotation);
    if (!representatives.has(key)) representatives.set(key, operation);
  }
  const cosets = [...representatives.values()];
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      for (let k = 0; k < 12; k++) {
        if (originWorks(cosets, lattice, [i, j, k])) return true;
      }
    }
  }
  return false;
}

/**
 * The axis a monoclinic setting is built on: the direction of its 2-fold, or
 * the normal of its mirror. Seventy of the 105 monoclinic settings are not on
 * `b`, which is why a cell editor that assumes `b` rewrites a correct cell into
 * a wrong one.
 *
 * @throws When the rotations name no single axis, so the group is not monoclinic.
 */
export function uniqueAxisOf(
  rotations: readonly IntegerMatrix[],
): 'a' | 'b' | 'c' {
  const found = new Set<'a' | 'b' | 'c'>();
  for (const rotation of rotations) {
    const { order, proper } = classifyRotation(rotation, 3);
    if (order === 1) continue;
    const direction = proper
      ? elementAxis(rotation, 'rotation', order)
      : elementNormal(rotation);
    if (direction === null) continue;
    let axis = -1;
    let single = true;
    for (let index = 0; index < direction.length; index++) {
      if (direction[index] === 0) continue;
      if (axis === -1) axis = index;
      else single = false;
    }
    if (single && axis !== -1) found.add(AXIS_LETTERS[axis] ?? 'a');
  }
  if (found.size !== 1) {
    throw new RangeError(`these rotations name ${found.size} unique axes`);
  }
  return [...found][0] ?? 'a';
}

/**
 * Whether a bare `-x,-y,-z` is present, which says the inversion centre sits at
 * the origin. It is what distinguishes origin choice 2 from origin choice 1, in
 * the operations themselves rather than in a display string.
 */
export function hasInversionAtOrigin(
  operations: ReadonlyArray<CrystalOperation<3>>,
): boolean {
  for (const operation of operations) {
    if (matrixDeterminant(operation.rotation) !== -1) continue;
    if (classifyRotation(operation.rotation, 3).order !== 1) continue;
    let zero = true;
    for (const twelfths of operation.translation) {
      if (wrapTwelfths(twelfths) !== 0) zero = false;
    }
    if (zero) return true;
  }
  return false;
}

/**
 * The Bravais letter the lattice translations describe. A rhombohedral-axes
 * setting of an `R` group comes back as `P`, because on those axes the lattice
 * *is* primitive — the one defect of the source table that silently builds the
 * wrong cell.
 *
 * @throws When the translations are no centring of the 14 Bravais lattices.
 */
export function centringLetterOf(
  operations: ReadonlyArray<CrystalOperation<3>>,
): Centring {
  const key = centringTranslations(operations)
    .map((shift) => formatTranslation(shift))
    .toSorted()
    .join(' ');
  const letter = CENTRING_LETTERS.get(key);
  if (letter === undefined) {
    throw new RangeError(`no Bravais lattice is centred at ${key}`);
  }
  return letter;
}

const AXIS_LETTERS = ['a', 'b', 'c'] as const;

const SYSTEM_CLASSES: ReadonlyArray<readonly [CrystalSystem, Set<string>]> = [
  ['triclinic', new Set(['1', '-1'])],
  ['monoclinic', new Set(['2', 'm', '2/m'])],
  ['orthorhombic', new Set(['222', 'mm2', 'mmm'])],
  ['tetragonal', new Set(['4', '-4', '4/m', '422', '4mm', '-42m', '4/mmm'])],
  ['trigonal', new Set(['3', '-3', '32', '3m', '-3m'])],
  ['hexagonal', new Set(['6', '-6', '6/m', '622', '6mm', '-6m2', '6/mmm'])],
  ['cubic', new Set(['23', 'm-3', '432', '-43m', 'm-3m'])],
];

const CENTRING_LETTERS = new Map<string, Centring>([
  ['0,0,0', 'P'],
  ['0,0,0 0,1/2,1/2', 'A'],
  ['0,0,0 1/2,0,1/2', 'B'],
  ['0,0,0 1/2,1/2,0', 'C'],
  ['0,0,0 1/2,1/2,1/2', 'I'],
  ['0,0,0 0,1/2,1/2 1/2,0,1/2 1/2,1/2,0', 'F'],
  ['0,0,0 1/3,2/3,2/3 2/3,1/3,1/3', 'R'],
]);

function operationRotationKey(rotation: IntegerMatrix): string {
  let key = '';
  for (const row of rotation) {
    for (let index = 0; index < rotation.length; index++) {
      key += `${row[index] ?? 0},`;
    }
  }
  return key;
}

function originWorks(
  cosets: ReadonlyArray<CrystalOperation<3>>,
  lattice: ReadonlySet<string>,
  origin: readonly number[],
): boolean {
  for (const operation of cosets) {
    const moved = multiplyMatrixVector(operation.rotation, origin);
    const shifted = new Array<number>(3).fill(0);
    for (let axis = 0; axis < 3; axis++) {
      shifted[axis] = wrapTwelfths(
        (operation.translation[axis] ?? 0) +
          (moved[axis] ?? 0) -
          (origin[axis] ?? 0),
      );
    }
    if (!lattice.has(shifted.join(','))) return false;
  }
  return true;
}
