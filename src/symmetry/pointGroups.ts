import type { PointGroup } from '../data/pointGroups.ts';
import { pointGroupById } from '../data/pointGroups.ts';

import type { PointOperation } from './operations.ts';
import {
  composeOperations,
  identityOperation,
  improperOperation,
  indexOfOperation,
  inversionOperation,
  invertOperation,
  reflectionOperation,
  rotationOperation,
} from './operations.ts';
import { labelOperations, principalAxisOf } from './point/labels.ts';
import type { Vec3 } from './point/vec3.ts';
import { normalizeVector } from './point/vec3.ts';

export { labelOperations, principalAxisOf } from './point/labels.ts';

const X_AXIS: Vec3 = [1, 0, 0];
const Y_AXIS: Vec3 = [0, 1, 0];
const Z_AXIS: Vec3 = [0, 0, 1];
const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

/**
 * Every operation of a point group, in its standard orientation: the principal
 * axis along **z**, and for a `D` group a `C₂` along **x**.
 *
 * The operations are generated, never tabulated — the generators below are the
 * whole of the data, and the closure is what proves the catalogue's class list
 * right.
 *
 * @throws For `C∞v` and `D∞h`, which have infinitely many operations.
 */
export function operationsOf(id: string): readonly PointOperation[] {
  const group = pointGroupById(id);
  if (!Number.isFinite(group.order)) {
    throw new RangeError(
      `${id} is a continuous group: it has no operation list`,
    );
  }
  const operations = closeGroup(generatorsOf(group));
  return labelOperations(operations, principalAxisOf(group));
}

/**
 * The minimal generating set of a group in its standard orientation — what the
 * 3D viewer animates, and what the closure is taken over.
 */
export function generatorsOf(group: PointGroup): readonly PointOperation[] {
  const n = group.principalOrder;
  switch (group.family) {
    case 'nonaxial': {
      if (group.id === 'Cs') return [reflectionOperation(Z_AXIS)];
      if (group.id === 'Ci') return [inversionOperation()];
      return [];
    }
    case 'Cn': {
      return [rotationOperation(Z_AXIS, n)];
    }
    case 'Cnv': {
      return [rotationOperation(Z_AXIS, n), reflectionOperation(Y_AXIS)];
    }
    case 'Cnh': {
      return [rotationOperation(Z_AXIS, n), reflectionOperation(Z_AXIS)];
    }
    case 'Dn': {
      return [rotationOperation(Z_AXIS, n), rotationOperation(X_AXIS, 2)];
    }
    case 'Dnh': {
      return [
        rotationOperation(Z_AXIS, n),
        rotationOperation(X_AXIS, 2),
        reflectionOperation(Z_AXIS),
      ];
    }
    case 'Dnd': {
      // S_2n, not C_n: it is the improper axis that makes a D_nd.
      return [improperOperation(Z_AXIS, 2 * n), rotationOperation(X_AXIS, 2)];
    }
    case 'Sn': {
      return [improperOperation(Z_AXIS, n)];
    }
    case 'cubic': {
      return cubicGenerators(group.id);
    }
    case 'icosahedral': {
      const fiveFold = rotationOperation([0, 1, GOLDEN_RATIO], 5);
      const half = rotationOperation(Z_AXIS, 2);
      return group.id === 'Ih'
        ? [fiveFold, half, inversionOperation()]
        : [fiveFold, half];
    }
    case 'linear': {
      throw new RangeError(
        `${group.id} is a continuous group: it has no generators`,
      );
    }
    // no default
  }
}

/**
 * Every product of the generators, breadth first.
 *
 * @throws When the closure passes `limit`, which means the generators are not
 *   those of a point group of that size.
 */
export function closeGroup(
  generators: readonly PointOperation[],
  options: {
    /** How many operations before the generators are declared not to close. @default 240 */
    readonly limit?: number;
    /** How far two operation matrices may be and still be the same one. @default 1e-6 */
    readonly tolerance?: number;
    /**
     * How far from `2πk/n` a product may turn and still be read as `Cₙᵏ`. A
     * detector working at 0.1 Å finds operations that are only nearly exact, and
     * their products are less exact still. @default 1e-6
     */
    readonly angleTolerance?: number;
  } = {},
): readonly PointOperation[] {
  const limit = options.limit ?? 240;
  const tolerance = options.tolerance ?? 1e-6;
  const angleTolerance = options.angleTolerance ?? 1e-6;
  const found: PointOperation[] = [identityOperation()];
  // A rounded matrix is the fast path; the exact comparison decides, so a
  // product that rounds across a boundary costs one scan and is then aliased.
  const seen = new Map<string, number>([
    [matrixKey(found[0] as PointOperation), 0],
  ]);
  // `found` grows while it is read, which is what makes this a closure.
  for (const current of found) {
    for (const generator of generators) {
      const next = composeOperations(generator, current, { angleTolerance });
      const key = matrixKey(next);
      if (seen.has(key)) continue;
      const index = indexOfOperation(found, next, tolerance);
      if (index !== -1) {
        seen.set(key, index);
        continue;
      }
      seen.set(key, found.length);
      found.push(next);
      if (found.length > limit) {
        throw new RangeError(
          `the generators do not close within ${limit} operations`,
        );
      }
    }
  }
  return found;
}

/** The matrix, rounded, as a string: two operations that differ are never equal. */
function matrixKey(operation: PointOperation): string {
  const matrix = operation.matrix;
  let key = '';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      key += `${(matrix[i] as Vec3)[j]?.toFixed(5)},`;
    }
  }
  return key;
}

/** The conjugacy classes of a group: `{ g R g⁻¹ }` for every operation R. */
export function conjugacyClasses(
  operations: readonly PointOperation[],
  tolerance = 1e-9,
): readonly PointOperation[][] {
  const classes: PointOperation[][] = [];
  const taken = new Array<boolean>(operations.length).fill(false);
  for (let i = 0; i < operations.length; i++) {
    if (taken[i]) continue;
    const members: PointOperation[] = [];
    for (const g of operations) {
      const conjugate = composeOperations(
        composeOperations(g, operations[i] as PointOperation),
        invertOperation(g),
      );
      const index = indexOfOperation(operations, conjugate, tolerance);
      if (index === -1 || taken[index]) continue;
      taken[index] = true;
      members.push(operations[index] as PointOperation);
    }
    classes.push(members);
  }
  return classes;
}

/** The tetrahedral and octahedral groups, generated from the cube. */
function cubicGenerators(id: string): readonly PointOperation[] {
  const threeFold = rotationOperation(normalizeVector([1, 1, 1]), 3);
  const rotations =
    id === 'O' || id === 'Oh'
      ? [rotationOperation(Z_AXIS, 4), threeFold]
      : [rotationOperation(Z_AXIS, 2), threeFold];
  if (id === 'Th' || id === 'Oh') return [...rotations, inversionOperation()];
  if (id === 'Td') {
    return [...rotations, reflectionOperation(normalizeVector([1, -1, 0]))];
  }
  return rotations;
}
