import { matrixDistance } from './mat3.ts';
import type { PointOperation } from './operation.ts';

/** Whether two operations are the same to `tolerance`, compared on their matrices. */
export function sameOperation(
  a: PointOperation,
  b: PointOperation,
  tolerance = 1e-6,
): boolean {
  return matrixDistance(a.matrix, b.matrix) <= tolerance;
}

/** The index of the first operation equal to `operation`, or −1. */
export function indexOfOperation(
  operations: readonly PointOperation[],
  operation: PointOperation,
  tolerance = 1e-6,
): number {
  for (let i = 0; i < operations.length; i++) {
    if (sameOperation(operations[i] as PointOperation, operation, tolerance)) {
      return i;
    }
  }
  return -1;
}
