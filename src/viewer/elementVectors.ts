/**
 * The three vectors an element carries, in Cartesian ångström.
 *
 * `src/symmetry/core` reports them in the crystal basis and exactly: an axis as
 * a primitive `[uvw]`, a plane as a primitive `(hkl)`, a screw pitch or a glide
 * vector as twelfths of a cell edge. Each takes a different road across to
 * Cartesian — see `latticeBasis.ts` — and this module is where that choice is
 * made once per kind of vector rather than once per caller.
 */

import type { Lattice, SymmetryElement } from '../symmetry/core/index.ts';
import { TWELFTHS_PER_CELL } from '../symmetry/core/index.ts';

import { normalToCartesian, toCartesian } from './latticeBasis.ts';
import type { Point3 } from './types.ts';

/**
 * The axis `[uvw]`, as a Cartesian direction.
 *
 * @param lattice - The cell the element lives in.
 * @param element - An element that is a line.
 * @returns Its direction, ångström; its length is the repeat along the axis.
 * @throws When the element has no axis, which every point and plane has not.
 */
export function axisDirection(
  lattice: Lattice,
  element: SymmetryElement,
): Point3 {
  const axis = element.axis;
  if (axis === null) {
    throw new RangeError(`the ${element.symbol} element carries no axis.`);
  }
  return toCartesian(lattice, axis);
}

/**
 * The normal `(hkl)`, as a Cartesian direction.
 *
 * `(hkl)` is a reciprocal-space vector, so it transforms with `(M⁻¹)ᵀ` rather
 * than with `M`.
 *
 * @param lattice - The cell the element lives in.
 * @param element - An element that is a plane.
 * @returns A Cartesian vector at right angles to the plane itself.
 * @throws When the element has no normal.
 */
export function planeNormal(
  lattice: Lattice,
  element: SymmetryElement,
): Point3 {
  const normal = element.normal;
  if (normal === null) {
    throw new RangeError(`the ${element.symbol} element carries no normal.`);
  }
  return normalToCartesian(lattice, normal);
}

/**
 * The screw pitch or the glide vector, in ångström.
 *
 * @param lattice - The cell the element lives in.
 * @param element - Any element; everything but a screw and a glide returns the
 *   zero vector.
 * @returns The intrinsic translation of one application, Cartesian ångström.
 */
export function intrinsicVector(
  lattice: Lattice,
  element: SymmetryElement,
): Point3 {
  const fractional: number[] = [];
  for (let index = 0; index < 3; index++) {
    fractional.push((element.intrinsic[index] ?? 0) / TWELFTHS_PER_CELL);
  }
  return toCartesian(lattice, fractional);
}
