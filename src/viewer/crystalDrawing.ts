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
import { elementPoint } from '../symmetry/core/index.ts';
import {
  addVectors,
  dotProduct,
  normalizeVector,
} from '../symmetry/point/vec3.ts';

import { axisRod, faceOf } from './elementExtent.ts';
import {
  axisDirection,
  intrinsicVector,
  planeNormal,
} from './elementVectors.ts';
import { toCartesian } from './latticeBasis.ts';
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
   * The short form written on the element in the scene.
   * @default the element's own symbol
   */
  badge?: string;
  /**
   * Cut the element off at the cell: an axis runs from where it enters the box
   * to where it leaves it, and a plane is drawn as the polygon it slices out
   * of it. A rod of an arbitrary length reads as a floating stick, and a square
   * hanging in the middle of the box says nothing about where its plane is.
   * @default false
   */
  clip?: boolean;
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

/** Where an element sits and which way it runs, in Cartesian ångström. */
export interface ElementLocus {
  /** A point of the element. */
  readonly point: Point3;
  /** The axis direction, for an element that is a line. */
  readonly direction?: Point3;
  /** The plane normal, for an element that is a plane. */
  readonly normal?: Point3;
}

/**
 * Where one element is, without deciding how much of it to draw.
 *
 * The caller that has to ask *whether* an element meets the cell — before it
 * knows how to draw it — needs exactly this and nothing else.
 *
 * @param element - What `symmetryElements` returned.
 * @param lattice - The cell it lives in.
 * @param shift - A whole-cell shift to read it at, in cells along a, b and c.
 *   @default [0, 0, 0]
 * @returns Its locus, or `null` for the identity and a lattice translation.
 */
export function elementLocus(
  element: SymmetryElement,
  lattice: Lattice,
  shift: readonly [number, number, number] = ORIGIN,
): ElementLocus | null {
  const point = addVectors(
    toCartesian(lattice, elementPoint(element)),
    toCartesian(lattice, shift),
  );
  switch (element.kind) {
    case 'rotation':
    case 'screw':
    case 'rotoinversion': {
      return { point, direction: axisDirection(lattice, element) };
    }
    case 'mirror':
    case 'glide': {
      return { point, normal: planeNormal(lattice, element) };
    }
    case 'inversion': {
      return { point };
    }
    case 'identity':
    case 'translation': {
      return null;
    }
    // no default
  }
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
    badge = element.symbol,
    clip = false,
    shift = ORIGIN,
  } = options;
  const point = addVectors(
    toCartesian(lattice, elementPoint(element)),
    toCartesian(lattice, shift),
  );

  switch (element.kind) {
    case 'rotation': {
      const direction = axisDirection(lattice, element);
      const rod = axisRod(lattice, point, direction, length, clip);
      return {
        kind: 'rotation',
        id,
        label,
        badge,
        ...rod,
        order: element.order,
      };
    }
    case 'screw': {
      const direction = axisDirection(lattice, element);
      const rod = axisRod(lattice, point, direction, length, clip);
      return {
        kind: 'screw',
        id,
        label,
        badge,
        ...rod,
        order: element.order,
        pitch: dotProduct(
          intrinsicVector(lattice, element),
          normalizeVector(direction),
        ),
      };
    }
    case 'rotoinversion': {
      const direction = axisDirection(lattice, element);
      const rod = axisRod(lattice, point, direction, length, clip);
      return {
        kind: 'rotoinversion',
        id,
        label,
        badge,
        // The ball marks the point it inverts through, so that one stays put
        // however much of the axis is drawn.
        point,
        direction: rod.direction,
        length: rod.length,
        order: element.order,
      };
    }
    case 'mirror': {
      const normal = planeNormal(lattice, element);
      return {
        kind: 'mirror',
        id,
        label,
        badge,
        point,
        normal,
        size,
        ...faceOf(lattice, point, normal, clip),
      };
    }
    case 'glide': {
      const normal = planeNormal(lattice, element);
      return {
        kind: 'glide',
        id,
        label,
        badge,
        point,
        normal,
        size,
        glide: intrinsicVector(lattice, element),
        ...faceOf(lattice, point, normal, clip),
      };
    }
    case 'inversion': {
      return { kind: 'inversion', id, label, badge, point };
    }
    case 'identity':
    case 'translation': {
      return null;
    }
    // no default
  }
}
