/**
 * The bridge from an exact crystallographic element to something drawable.
 *
 * `src/symmetry/core` decomposes an operation into a kind, a point, an axis or a
 * normal and an intrinsic translation, all exact and all in the crystal basis.
 * The viewer works in Cartesian ångström, and the two bases differ by more than
 * a scale whenever the cell is not orthogonal: a direct-space direction goes
 * through `M`, a `(hkl)` normal through `(M⁻¹)ᵀ`, and swapping them is the
 * classic way to draw a monoclinic mirror in the wrong place.
 */

import type { Lattice, SymmetryElement } from '../symmetry/core/index.ts';
import { TWELFTHS_PER_CELL, elementPoint } from '../symmetry/core/index.ts';
import type { Vec3 } from '../symmetry/point/vec3.ts';
import {
  addVectors,
  dotProduct,
  normalizeVector,
} from '../symmetry/point/vec3.ts';

import type { Point3, SymmetryDrawing } from './types.ts';

/** Drawn where it is, unless the caller asks for a whole-cell shift. */
const ORIGIN: readonly [number, number, number] = [0, 0, 0];

/** How big a crystallographic element is drawn, and what it is called. */
export interface CrystalDrawingOptions {
  /** Its id; the caller's, so it can be removed on its own. */
  id: string;
  /**
   * What the pointer reads. The element's Hermann-Mauguin symbol when absent.
   * @default the element's own symbol
   */
  label?: string;
  /**
   * Length of an axis rod, ångström.
   * @default 8
   */
  length?: number;
  /**
   * Side of a plane's square, ångström.
   * @default 8
   */
  size?: number;
  /**
   * A whole-cell shift to draw it at, in cells along a, b and c.
   * @default [0, 0, 0]
   */
  shift?: readonly [number, number, number];
}

/**
 * One crystallographic element, in Cartesian ångström.
 *
 * @param element - What `symmetryElements` returned.
 * @param lattice - The cell it lives in.
 * @param options - See {@link CrystalDrawingOptions}.
 * @returns The drawing, or `null` for the identity and a lattice translation,
 *   which are elements with nothing to draw.
 * @throws When the element is two-dimensional: the plane groups are drawn flat,
 *   in SVG, and never come through here.
 */
export function crystalElementDrawing(
  element: SymmetryElement,
  lattice: Lattice,
  options: CrystalDrawingOptions,
): SymmetryDrawing | null {
  if (element.location.length !== 3) {
    throw new RangeError(
      'crystalElementDrawing draws three-dimensional elements only.',
    );
  }
  const {
    id,
    length = 8,
    size = 8,
    label = element.symbol,
    shift = ORIGIN,
  } = options;
  const point = addVectors(
    toCartesian(lattice, elementPoint(element)),
    toCartesian(lattice, shift),
  );

  switch (element.kind) {
    case 'rotation': {
      const direction = axisDirection(lattice, element);
      return {
        kind: 'rotation',
        id,
        label,
        point,
        direction,
        length,
        order: element.order,
      };
    }
    case 'screw': {
      const direction = axisDirection(lattice, element);
      return {
        kind: 'screw',
        id,
        label,
        point,
        direction,
        length,
        order: element.order,
        pitch: dotProduct(
          intrinsicVector(lattice, element),
          normalizeVector(direction),
        ),
      };
    }
    case 'rotoinversion': {
      const direction = axisDirection(lattice, element);
      return {
        kind: 'rotoinversion',
        id,
        label,
        point,
        direction,
        length,
        order: element.order,
      };
    }
    case 'mirror': {
      return {
        kind: 'mirror',
        id,
        label,
        point,
        normal: planeNormal(lattice, element),
        size,
      };
    }
    case 'glide': {
      return {
        kind: 'glide',
        id,
        label,
        point,
        normal: planeNormal(lattice, element),
        size,
        glide: intrinsicVector(lattice, element),
      };
    }
    case 'inversion': {
      return { kind: 'inversion', id, label, point };
    }
    case 'identity':
    case 'translation': {
      return null;
    }
    // no default
  }
}

/** The axis `[uvw]`, as a Cartesian direction. */
function axisDirection(lattice: Lattice, element: SymmetryElement): Point3 {
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
 */
function planeNormal(lattice: Lattice, element: SymmetryElement): Point3 {
  const normal = element.normal;
  if (normal === null) {
    throw new RangeError(`the ${element.symbol} element carries no normal.`);
  }
  const image: number[] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    let sum = 0;
    for (let j = 0; j < 3; j++) {
      sum += (lattice.fractional[j]?.[i] ?? 0) * (normal[j] ?? 0);
    }
    image[i] = sum;
  }
  return [image[0] ?? 0, image[1] ?? 0, image[2] ?? 0];
}

/** The screw pitch or the glide vector, in ångström. */
function intrinsicVector(lattice: Lattice, element: SymmetryElement): Point3 {
  const fractional: number[] = [];
  for (let index = 0; index < 3; index++) {
    fractional.push((element.intrinsic[index] ?? 0) / TWELFTHS_PER_CELL);
  }
  return toCartesian(lattice, fractional);
}

function toCartesian(lattice: Lattice, point: readonly number[]): Vec3 {
  const image: number[] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    let sum = 0;
    for (let j = 0; j < 3; j++) {
      sum += (lattice.cartesian[i]?.[j] ?? 0) * (point[j] ?? 0);
    }
    image[i] = sum;
  }
  return [image[0] ?? 0, image[1] ?? 0, image[2] ?? 0];
}
