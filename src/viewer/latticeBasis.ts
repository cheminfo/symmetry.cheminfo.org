/**
 * How a vector crosses between the crystal basis and Cartesian ångström.
 *
 * There are four ways across and they are not interchangeable. A direction
 * `[uvw]` is a direct-space vector and goes through `M`; a normal `(hkl)` is a
 * reciprocal-space one and goes through `(M⁻¹)ᵀ`. The two agree in an
 * orthogonal cell, so swapping them is only ever caught on a monoclinic or
 * triclinic structure, with the mirror drawn at the wrong tilt.
 *
 * Naming them all together, once, is what stops the third caller writing a
 * fifth matrix loop and picking the wrong transpose in it.
 */

import type { Lattice } from '../symmetry/core/index.ts';
import type { Vec3 } from '../symmetry/point/vec3.ts';

/**
 * A fractional point or direction, in Cartesian ångström — `M v`.
 *
 * @param lattice - The cell it is read in.
 * @param point - Its fractional coordinates.
 * @returns The same point, Cartesian ångström.
 */
export function toCartesian(lattice: Lattice, point: readonly number[]): Vec3 {
  return applyMatrix(lattice.cartesian, point);
}

/**
 * A Cartesian point or direction, in cell fractions — `M⁻¹ v`.
 *
 * @param lattice - The cell it is read in.
 * @param point - Its Cartesian coordinates, ångström.
 * @returns The same point, in fractions of the cell edges.
 */
export function toFractional(lattice: Lattice, point: readonly number[]): Vec3 {
  return applyMatrix(lattice.fractional, point);
}

/**
 * A normal `(hkl)` written in the crystal basis, as a Cartesian direction —
 * `(M⁻¹)ᵀ v`.
 *
 * @param lattice - The cell it is read in.
 * @param normal - The reciprocal-space normal `(hkl)`.
 * @returns A Cartesian vector at right angles to the plane itself.
 */
export function normalToCartesian(
  lattice: Lattice,
  normal: readonly number[],
): Vec3 {
  return applyTransposed(lattice.fractional, normal);
}

/**
 * A Cartesian normal, as the covector that measures heights above the plane in
 * cell fractions — `Mᵀ v`.
 *
 * `n · (x − p)` in ångström is that covector against `x − p` in fractions, so a
 * height can be taken without leaving fractional coordinates. It is the inverse
 * transpose of {@link normalToCartesian}, not its inverse.
 *
 * @param lattice - The cell it is read in.
 * @param normal - A Cartesian plane normal.
 * @returns The covector to dot fractional offsets against.
 */
export function normalToFractional(
  lattice: Lattice,
  normal: readonly number[],
): Vec3 {
  return applyTransposed(lattice.cartesian, normal);
}

/** `A v`. */
function applyMatrix(
  matrix: ReadonlyArray<readonly number[]>,
  point: readonly number[],
): Vec3 {
  const image: number[] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    let sum = 0;
    for (let j = 0; j < 3; j++) {
      sum += (matrix[i]?.[j] ?? 0) * (point[j] ?? 0);
    }
    image[i] = sum;
  }
  return [image[0] ?? 0, image[1] ?? 0, image[2] ?? 0];
}

/** `Aᵀ v`, which is `A v` with the two indices swapped. */
function applyTransposed(
  matrix: ReadonlyArray<readonly number[]>,
  point: readonly number[],
): Vec3 {
  const image: number[] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    let sum = 0;
    for (let j = 0; j < 3; j++) {
      sum += (matrix[j]?.[i] ?? 0) * (point[j] ?? 0);
    }
    image[i] = sum;
  }
  return [image[0] ?? 0, image[1] ?? 0, image[2] ?? 0];
}
