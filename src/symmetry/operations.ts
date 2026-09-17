/**
 * The operations of a molecular point group.
 *
 * Cartesian and floating point, because the axes of a molecule are not lattice
 * directions. The crystallographic counterpart, which is exact integer
 * arithmetic in the crystal basis, is `CrystalOperation` in `src/symmetry/core`.
 */
export type { Mat3 } from './point/mat3.ts';
export type { Vec3 } from './point/vec3.ts';
export { canonicalSense } from './point/classify.ts';
export type { PointOperation, PointOperationKind } from './point/operation.ts';
export { indexOfOperation, sameOperation } from './point/compare.ts';
export {
  composeOperations,
  identityOperation,
  improperOperation,
  inversionOperation,
  invertOperation,
  operationCycleLength,
  operationFromMatrix,
  reflectionOperation,
  relabelOperation,
  rotationOperation,
} from './point/operation.ts';
