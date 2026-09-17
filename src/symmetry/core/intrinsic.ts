import { TWELFTHS_PER_CELL } from './types.ts';

/** The intrinsic translation reduced into the element's own locus. */
export interface ReducedIntrinsic {
  /** The screw pitch or the glide vector, in twelfths, lying in the locus. */
  readonly intrinsic: number[];
  /** Its coordinates on the locus basis, in twelfths. */
  readonly coefficients: number[];
  /** How far along each locus basis vector the nearest lattice translation lies, in twelfths. */
  readonly periods: number[];
}

/**
 * Reduce the intrinsic translation modulo the lattice translations **that lie in
 * the element's own locus**.
 *
 * This is what decides whether an element glides at all: a reflection followed by
 * a whole lattice translation along its own plane is a mirror, not a glide, and
 * in a centred cell the translation that does it is a centring vector — so the
 * `C`-centred mirror whose operation carries `(a+b)/2` is a mirror, and the
 * 3-fold of a body-centred cubic group screws by a third of `(a−b−c)/2`, not of
 * `(a−b−c)`. Reducing each component modulo the cell instead answers both
 * wrongly and leaves the glide vector pointing out of its own plane.
 *
 * @param exact - `P · w` in twelfths, as computed; it lies in the locus.
 * @param basis - The primitive integer vectors spanning the locus, 1 or 2 of them.
 * @param centring - The lattice translations of the group, in twelfths; the zero
 *   vector alone for a primitive lattice.
 */
export function reduceIntrinsic(
  exact: readonly number[],
  basis: ReadonlyArray<readonly number[]>,
  centring: ReadonlyArray<readonly number[]>,
): ReducedIntrinsic {
  if (basis.length === 0) {
    return {
      intrinsic: new Array<number>(exact.length).fill(0),
      coefficients: [],
      periods: [],
    };
  }
  const coefficients = solveOnBasis(exact, basis);
  const periods: number[] = [];
  for (const direction of basis) {
    periods.push(latticePeriod(direction, centring));
  }
  let best: number[] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  const second = basis.length > 1 ? TWELFTHS_PER_CELL : 1;
  for (let a = 0; a < TWELFTHS_PER_CELL; a++) {
    for (let b = 0; b < second; b++) {
      if (!inLattice(combine(basis, [a, b]), centring)) continue;
      const candidate = [
        symmetricRemainder((coefficients[0] ?? 0) - a),
        symmetricRemainder((coefficients[1] ?? 0) - b),
      ].slice(0, basis.length);
      const score = norm(combine(basis, candidate));
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
  }
  const reduced = best ?? coefficients;
  return { intrinsic: combine(basis, reduced), coefficients: reduced, periods };
}

/** The coordinates of `vector` on the basis, through the Gram system. */
function solveOnBasis(
  vector: readonly number[],
  basis: ReadonlyArray<readonly number[]>,
): number[] {
  const u = basis[0] ?? [];
  if (basis.length === 1) return [dot(vector, u) / dot(u, u)];
  const v = basis[1] ?? [];
  const uu = dot(u, u);
  const vv = dot(v, v);
  const uv = dot(u, v);
  const determinant = uu * vv - uv * uv;
  return [
    (vv * dot(vector, u) - uv * dot(vector, v)) / determinant,
    (uu * dot(vector, v) - uv * dot(vector, u)) / determinant,
  ];
}

/** The smallest positive multiple of `direction`, in twelfths, that is a lattice translation. */
function latticePeriod(
  direction: readonly number[],
  centring: ReadonlyArray<readonly number[]>,
): number {
  for (let multiple = 1; multiple <= TWELFTHS_PER_CELL; multiple++) {
    if (inLattice(combine([direction], [multiple]), centring)) return multiple;
  }
  return TWELFTHS_PER_CELL;
}

function inLattice(
  vector: readonly number[],
  centring: ReadonlyArray<readonly number[]>,
): boolean {
  for (const translation of centring) {
    let matches = true;
    for (let axis = 0; axis < vector.length && matches; axis++) {
      const difference = (vector[axis] ?? 0) - (translation[axis] ?? 0);
      matches =
        Math.abs(
          difference -
            TWELFTHS_PER_CELL * Math.round(difference / TWELFTHS_PER_CELL),
        ) < 1e-9;
    }
    if (matches) return true;
  }
  return false;
}

function combine(
  basis: ReadonlyArray<readonly number[]>,
  coefficients: readonly number[],
): number[] {
  const size = basis[0]?.length ?? 0;
  const vector = new Array<number>(size).fill(0);
  for (let index = 0; index < basis.length; index++) {
    const coefficient = coefficients[index] ?? 0;
    for (let axis = 0; axis < size; axis++) {
      vector[axis] =
        (vector[axis] ?? 0) + coefficient * (basis[index]?.[axis] ?? 0);
    }
  }
  return vector;
}

function symmetricRemainder(value: number): number {
  const half = TWELFTHS_PER_CELL / 2;
  const wrapped =
    ((value % TWELFTHS_PER_CELL) + TWELFTHS_PER_CELL) % TWELFTHS_PER_CELL;
  return wrapped > half ? wrapped - TWELFTHS_PER_CELL : wrapped;
}

function dot(a: readonly number[], b: readonly number[]): number {
  let sum = 0;
  for (let index = 0; index < a.length; index++) {
    sum += (a[index] ?? 0) * (b[index] ?? 0);
  }
  return sum;
}

function norm(vector: readonly number[]): number {
  let sum = 0;
  for (const value of vector) {
    sum += Math.abs(value);
  }
  return sum;
}
