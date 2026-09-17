/**
 * The shapes a symmetry element is made of, named once so the geometry that
 * builds them never has to know molstar exists.
 *
 * Everything in this module is plain arithmetic: it is what the unit tests
 * assert, and what `renderElements.ts` hands to a mesh builder.
 */

import type { Point3 } from './types.ts';

/** One drawable shape, Cartesian ångström. */
export type MeshPrimitive =
  /** A solid rod, as a rotation axis or a cell edge. */
  | { readonly shape: 'rod'; start: Point3; end: Point3; radius: number }
  /** A broken rod, as the axis of a rotoinversion. */
  | {
      readonly shape: 'dashes';
      start: Point3;
      end: Point3;
      radius: number;
      segments: number;
    }
  /** A cone, as the head of an arrow. */
  | { readonly shape: 'cone'; base: Point3; tip: Point3; radius: number }
  /** A ball, as an inversion centre. */
  | { readonly shape: 'sphere'; centre: Point3; radius: number }
  /** A flat square, as a mirror or a glide plane. */
  | {
      readonly shape: 'plate';
      centre: Point3;
      major: Point3;
      minor: Point3;
      size: number;
    };

/** A line of text floating in the scene. */
export interface TextItem {
  /** What it reads. */
  readonly text: string;
  /** Where it sits, Cartesian ångström. */
  readonly position: Point3;
  /** Its height, ångström. */
  readonly size: number;
}

/** How thick, how long and how big the drawn elements are. */
export interface ElementStyle {
  /**
   * Radius of an axis rod, ångström.
   * @default 0.06
   */
  axisRadius?: number;
  /**
   * Radius of an arrowhead's base, ångström.
   * @default 0.16
   */
  arrowRadius?: number;
  /**
   * Length of an arrowhead, ångström.
   * @default 0.4
   */
  arrowLength?: number;
  /**
   * Radius of an inversion centre, ångström.
   * @default 0.18
   */
  centreRadius?: number;
  /**
   * How far a pitch arrow sits beside its axis, in rod radii.
   * @default 4
   */
  arrowOffset?: number;
  /**
   * Dashes along a rotoinversion axis.
   * @default 9
   */
  dashSegments?: number;
  /**
   * Height of an element's label, ångström.
   * @default 0.6
   */
  labelSize?: number;
  /**
   * Gap between the end of an element and its label, ångström.
   * @default 0.35
   */
  labelGap?: number;
}

/** {@link ElementStyle} with every default filled in. */
export type ResolvedElementStyle = Required<ElementStyle>;

/** The defaults, read once so a caller can override one field. */
export const DEFAULT_ELEMENT_STYLE: ResolvedElementStyle = {
  axisRadius: 0.06,
  arrowRadius: 0.16,
  arrowLength: 0.4,
  centreRadius: 0.18,
  arrowOffset: 4,
  dashSegments: 9,
  labelSize: 0.6,
  labelGap: 0.35,
};

/**
 * Fill in whatever the caller left out.
 * @param style - The caller's overrides, if any.
 * @returns Every field, with the defaults where none was given.
 */
export function resolveElementStyle(
  style: ElementStyle = {},
): ResolvedElementStyle {
  return { ...DEFAULT_ELEMENT_STYLE, ...style };
}

/**
 * The corners a primitive reaches, so the camera can frame what is drawn.
 *
 * @param primitive - One shape.
 * @returns Points that between them hold it, Cartesian ångström.
 */
export function primitivePoints(primitive: MeshPrimitive): Point3[] {
  switch (primitive.shape) {
    case 'rod':
    case 'dashes': {
      return [primitive.start, primitive.end];
    }
    case 'cone': {
      return [primitive.base, primitive.tip];
    }
    case 'sphere': {
      const [x, y, z] = primitive.centre;
      const r = primitive.radius;
      return [
        [x - r, y, z],
        [x + r, y, z],
        [x, y - r, z],
        [x, y + r, z],
        [x, y, z - r],
        [x, y, z + r],
      ];
    }
    case 'plate': {
      const half = primitive.size / 2;
      const corners: Point3[] = [];
      for (const along of [-half, half]) {
        for (const across of [-half, half]) {
          corners.push([
            primitive.centre[0] +
              primitive.major[0] * along +
              primitive.minor[0] * across,
            primitive.centre[1] +
              primitive.major[1] * along +
              primitive.minor[1] * across,
            primitive.centre[2] +
              primitive.major[2] * along +
              primitive.minor[2] * across,
          ]);
        }
      }
      return corners;
    }
    // no default
  }
}
