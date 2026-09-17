import { classifyRotation } from './elementGeometry.ts';
import type { Dimension, IntegerMatrix } from './types.ts';

/** The ten operation types of the three-dimensional crystallographic groups, in signature order. */
const TYPES_3D = [
  '1',
  '2',
  '3',
  '4',
  '6',
  '-1',
  'm',
  '-3',
  '-4',
  '-6',
] as const;
/** The six of the two-dimensional ones. */
const TYPES_2D = ['1', '2', '3', '4', '6', 'm'] as const;

/**
 * The 32 crystallographic point groups, keyed by how many operations of each
 * type they hold. The counts alone separate all 32 — checked against the
 * International Tables partition of the 230 space-group numbers.
 */
const NAMES_3D = new Map<string, string>([
  ['1,0,0,0,0,0,0,0,0,0', '1'],
  ['1,0,0,0,0,1,0,0,0,0', '-1'],
  ['1,1,0,0,0,0,0,0,0,0', '2'],
  ['1,0,0,0,0,0,1,0,0,0', 'm'],
  ['1,1,0,0,0,1,1,0,0,0', '2/m'],
  ['1,3,0,0,0,0,0,0,0,0', '222'],
  ['1,1,0,0,0,0,2,0,0,0', 'mm2'],
  ['1,3,0,0,0,1,3,0,0,0', 'mmm'],
  ['1,1,0,2,0,0,0,0,0,0', '4'],
  ['1,1,0,0,0,0,0,0,2,0', '-4'],
  ['1,1,0,2,0,1,1,0,2,0', '4/m'],
  ['1,5,0,2,0,0,0,0,0,0', '422'],
  ['1,1,0,2,0,0,4,0,0,0', '4mm'],
  ['1,3,0,0,0,0,2,0,2,0', '-42m'],
  ['1,5,0,2,0,1,5,0,2,0', '4/mmm'],
  ['1,0,2,0,0,0,0,0,0,0', '3'],
  ['1,0,2,0,0,1,0,2,0,0', '-3'],
  ['1,3,2,0,0,0,0,0,0,0', '32'],
  ['1,0,2,0,0,0,3,0,0,0', '3m'],
  ['1,3,2,0,0,1,3,2,0,0', '-3m'],
  ['1,1,2,0,2,0,0,0,0,0', '6'],
  ['1,0,2,0,0,0,1,0,0,2', '-6'],
  ['1,1,2,0,2,1,1,2,0,2', '6/m'],
  ['1,7,2,0,2,0,0,0,0,0', '622'],
  ['1,1,2,0,2,0,6,0,0,0', '6mm'],
  ['1,3,2,0,0,0,4,0,0,2', '-6m2'],
  ['1,7,2,0,2,1,7,2,0,2', '6/mmm'],
  ['1,3,8,0,0,0,0,0,0,0', '23'],
  ['1,3,8,0,0,1,3,8,0,0', 'm-3'],
  ['1,9,8,6,0,0,0,0,0,0', '432'],
  ['1,3,8,0,0,0,6,0,6,0', '-43m'],
  ['1,9,8,6,0,1,9,8,6,0', 'm-3m'],
]);

/** The ten two-dimensional crystallographic point groups, keyed the same way. */
const NAMES_2D = new Map<string, string>([
  ['1,0,0,0,0,0', '1'],
  ['1,1,0,0,0,0', '2'],
  ['1,0,2,0,0,0', '3'],
  ['1,1,0,2,0,0', '4'],
  ['1,1,2,0,2,0', '6'],
  ['1,0,0,0,0,1', 'm'],
  ['1,1,0,0,0,2', '2mm'],
  ['1,0,2,0,0,3', '3m'],
  ['1,1,0,2,0,4', '4mm'],
  ['1,1,2,0,2,6', '6mm'],
]);

/**
 * The Hermann–Mauguin name of the point group a set of rotation parts forms:
 * `1`, `-1`, `2/m`, `mm2`, `-42m`, `m-3m` in three dimensions, `2mm`, `3m`,
 * `6mm` in two.
 *
 * The name is derived from what the operations *are*, never looked up from a
 * symbol, so it says the same thing about a site symmetry, a crystal class and a
 * Laue class. The orientation a full International Tables site symbol carries —
 * the dots of `m..` against `.m.` — is not part of it.
 *
 * @param rotations - The distinct rotation parts; duplicates are ignored.
 * @param dimension - 2 or 3.
 * @throws When the rotations do not form one of the 32 (or, in two dimensions,
 *   one of the 10) crystallographic point groups.
 */
export function pointGroupName(
  rotations: readonly IntegerMatrix[],
  dimension: Dimension,
): string {
  const signature = pointGroupSignature(rotations, dimension);
  const name = (dimension === 3 ? NAMES_3D : NAMES_2D).get(signature);
  if (name === undefined) {
    throw new RangeError(
      `no crystallographic point group has the signature ${signature}`,
    );
  }
  return name;
}

/**
 * How many operations of each type the rotations hold, in the order `1, 2, 3, 4,
 * 6, -1, m, -3, -4, -6` — the last five dropped in two dimensions, where only
 * `m` survives.
 */
export function pointGroupSignature(
  rotations: readonly IntegerMatrix[],
  dimension: Dimension,
): string {
  const types = dimension === 3 ? TYPES_3D : TYPES_2D;
  const counts = new Map<string, number>();
  const seen = new Set<string>();
  for (const rotation of rotations) {
    const key = JSON.stringify(rotation);
    if (seen.has(key)) continue;
    seen.add(key);
    const type = operationType(rotation, dimension);
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  const signature: number[] = [];
  for (const type of types) {
    signature.push(counts.get(type) ?? 0);
  }
  return signature.join(',');
}

/** `1`, `2`, `3`, `4`, `6`, `-1`, `m`, `-3`, `-4` or `-6` — what one rotation part is. */
export function operationType(
  rotation: IntegerMatrix,
  dimension: Dimension,
): string {
  const { order, proper } = classifyRotation(rotation, dimension);
  if (proper) return String(order);
  if (dimension === 2) return 'm';
  if (order === 1) return '-1';
  if (order === 2) return 'm';
  return `-${order}`;
}
