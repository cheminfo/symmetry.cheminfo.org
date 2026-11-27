import type {
  CrystalOperation,
  Dimension,
  IntegerMatrix,
} from 'react-cheminfo/crystal';

import { identityMatrix, matricesEqual } from './integerMatrix.ts';
import { wrapTwelfths } from './twelfths.ts';

/** The rotation parts occurring in a list, one per distinct matrix. */
export function distinctRotations(
  operations: ReadonlyArray<CrystalOperation<Dimension>>,
): IntegerMatrix[] {
  const seen = new Map<string, IntegerMatrix>();
  for (const operation of operations) {
    const rotation = operation.rotation;
    let key = '';
    for (const row of rotation) {
      for (let j = 0; j < rotation.length; j++) {
        key += `${row[j] ?? 0},`;
      }
    }
    if (!seen.has(key)) seen.set(key, rotation);
  }
  return [...seen.values()];
}

/**
 * The lattice translations of a group: the translation parts of the operations
 * whose rotation part is the identity. `[[0,0,0]]` for a primitive lattice, four
 * vectors for a face-centred one.
 */
export function centringTranslations(
  operations: ReadonlyArray<CrystalOperation<Dimension>>,
): number[][] {
  const dimension = operations[0]?.rotation.length ?? 3;
  const identity = identityMatrix(dimension);
  const translations: number[][] = [];
  for (const operation of operations) {
    if (!matricesEqual(operation.rotation, identity)) continue;
    const translation = new Array<number>(dimension).fill(0);
    for (let axis = 0; axis < dimension; axis++) {
      translation[axis] = wrapTwelfths(operation.translation[axis] ?? 0);
    }
    translations.push(translation);
  }
  return translations.length === 0
    ? [new Array<number>(dimension).fill(0)]
    : translations;
}
