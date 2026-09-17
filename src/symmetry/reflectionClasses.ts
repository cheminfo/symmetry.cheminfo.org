import type { IntegerMatrix } from './core/index.ts';
import { classifyRotation } from './core/index.ts';

/**
 * A class of reflections closed under one symmetry operation: the `h0l` zone,
 * the `00l` row, the whole of `hkl`.
 *
 * `basis` spans the class over the integers, so every reflection in it is
 * `Σ mᵢ · basisᵢ`, and `letters` names those coefficients the way the
 * International Tables write the condition — `h0l: l = 2n` counts along
 * `(0,0,1)` and calls that count `l`.
 */
export interface ReflectionClass {
  /** `hkl`, `h0l`, `hhl`, `00l`, `h-h0` — three indices, not four. */
  readonly label: string;
  readonly basis: ReadonlyArray<readonly number[]>;
  readonly letters: readonly string[];
}

/**
 * The class of reflections an operation leaves where they are, or `null` when
 * it leaves none — which is every inversion and every rotoinversion, and is why
 * those impose no condition.
 *
 * The dimension is read off the operation's type rather than from a rank: the
 * identity fixes all of reciprocal space, a rotation or screw fixes the row
 * along its axis, a mirror or glide fixes the zone of its plane, and the rest
 * fix only the origin.
 *
 * @throws When the fixed set is none of the 25 classes below, which no
 *   operation of the 230 space groups produces.
 */
export function reflectionClassOf(
  rotation: IntegerMatrix,
): ReflectionClass | null {
  const { order, proper } = classifyRotation(rotation, 3);
  const dimension = proper ? (order === 1 ? 3 : 1) : order === 2 ? 2 : 0;
  if (dimension === 0) return null;
  for (const candidate of REFLECTION_CLASSES) {
    if (candidate.basis.length !== dimension) continue;
    let all = true;
    for (const vector of candidate.basis) {
      if (!leavesInvariant(vector, rotation)) all = false;
    }
    if (all) return candidate;
  }
  throw new RangeError(
    `no reflection class is fixed by ${JSON.stringify(rotation)}`,
  );
}

/**
 * Whether the reflection `h` is where it was after the operation: `h · W = h`,
 * the row-vector action reflections transform under.
 */
export function leavesInvariant(
  hkl: readonly number[],
  rotation: IntegerMatrix,
): boolean {
  for (let column = 0; column < 3; column++) {
    let sum = 0;
    for (let row = 0; row < 3; row++) {
      sum += (hkl[row] ?? 0) * (rotation[row]?.[column] ?? 0);
    }
    if (sum !== (hkl[column] ?? 0)) return false;
  }
  return true;
}

/**
 * The coefficients of `hkl` in a class's basis, or `null` when the reflection
 * is not in the class. `(0, 2, 3)` is `(2, 3)` in `0kl` and is in no other
 * two-dimensional class.
 */
export function coefficientsIn(
  reflectionClass: ReflectionClass,
  hkl: readonly number[],
): number[] | null {
  const coefficients: number[] = [];
  const remainder = [hkl[0] ?? 0, hkl[1] ?? 0, hkl[2] ?? 0];
  for (const vector of reflectionClass.basis) {
    let axis = -1;
    for (let index = 0; index < 3 && axis === -1; index++) {
      if ((vector[index] ?? 0) !== 0) axis = index;
    }
    const lead = vector[axis] ?? 1;
    const count = (remainder[axis] ?? 0) / lead;
    if (!Number.isInteger(count)) return null;
    for (let index = 0; index < 3; index++) {
      remainder[index] = (remainder[index] ?? 0) - count * (vector[index] ?? 0);
    }
    coefficients.push(count);
  }
  for (const value of remainder) {
    if (value !== 0) return null;
  }
  return coefficients;
}

/**
 * Every class fixed by an operation of the 230 space groups — measured over all
 * 7244 of them, and complete.
 *
 * Each row is `label | basis | letters`, a basis vector being three signed
 * digits. The order is the order conditions are listed in: the whole of
 * reciprocal space, then the zones, then the rows.
 */
const CLASS_ROWS: readonly string[] = [
  'hkl|100,010,001|h,k,l',
  '0kl|010,001|k,l',
  'h0l|100,001|h,l',
  'hk0|100,010|h,k',
  'hhl|110,001|h,l',
  'h-hl|1-10,001|h,l',
  'hkk|100,011|h,k',
  'hk-k|100,01-1|h,k',
  'hkh|101,010|h,k',
  'hk-h|10-1,010|h,k',
  '2h-hl|2-10,001|h,l',
  'h-2hl|1-20,001|h,l',
  '00l|001|l',
  '0k0|010|k',
  'h00|100|h',
  'hh0|110|h',
  'h-h0|1-10|h',
  '2h-h0|2-10|h',
  'h-2h0|1-20|h',
  'h0h|101|h',
  'h0-h|10-1|h',
  '0kk|011|k',
  '0k-k|01-1|k',
  'hhh|111|h',
  'hh-h|11-1|h',
  'h-hh|1-11|h',
  'h-h-h|1-1-1|h',
];

export const REFLECTION_CLASSES: readonly ReflectionClass[] =
  CLASS_ROWS.map(decodeClass);

function decodeClass(row: string): ReflectionClass {
  const [label = '', vectors = '', letters = ''] = row.split('|');
  return {
    label,
    basis: vectors.split(',').map((vector) => {
      const components = vector.match(/-?\d/g) ?? [];
      return components.map(Number);
    }),
    letters: letters.split(','),
  };
}
