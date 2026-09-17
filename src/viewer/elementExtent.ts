/**
 * How much of an element is drawn.
 *
 * `cellClip.ts` answers where an unbounded line or plane meets the cell; this
 * is the decision taken on that answer. It has one job beyond passing the call
 * along: when the element misses the box, or only grazes a corner of it, the
 * clipped form would be nothing at all, so the caller falls back to the rod or
 * the square it asked for rather than drawing an element that is not there.
 */

import type { Lattice } from '../symmetry/core/index.ts';
import {
  addVectors,
  scaleVector,
  subtractVectors,
  vectorNorm,
} from '../symmetry/point/vec3.ts';

import { cellSection, clipLineToCell } from './cellClip.ts';
import type { Point3 } from './types.ts';

/** Where an axis rod starts, which way it runs and how long it is. */
export interface AxisRod {
  readonly point: Point3;
  readonly direction: Point3;
  readonly length: number;
}

/**
 * The rod an axis is drawn as: the piece inside the cell when the caller asked
 * for that, and a rod of `length` centred on the element's own point when it
 * did not, or when the axis misses the box.
 *
 * @param lattice - The cell it is cut against.
 * @param point - A point of the axis, Cartesian ångström.
 * @param direction - Its direction, Cartesian.
 * @param length - The rod to draw when it is not clipped, ångström.
 * @param clip - Whether to cut it off at the cell.
 * @returns The rod, centred on its own middle.
 */
export function axisRod(
  lattice: Lattice,
  point: Point3,
  direction: Point3,
  length: number,
  clip: boolean,
): AxisRod {
  if (!clip) return { point, direction, length };
  const segment = clipLineToCell(lattice, point, direction);
  if (segment === null) return { point, direction, length };
  const span = subtractVectors(segment.end, segment.start);
  const reach = vectorNorm(span);
  if (reach < MINIMUM_ROD) return { point, direction, length };
  return {
    point: addVectors(segment.start, scaleVector(span, 0.5)),
    direction,
    length: reach,
  };
}

/**
 * The polygon a plane cuts out of the cell, when the caller asked for it.
 *
 * @param lattice - The cell it is cut against.
 * @param point - A point of the plane, Cartesian ångström.
 * @param normal - Its normal, Cartesian.
 * @param clip - Whether to cut it to the cell.
 * @returns An `outline` to draw the plane between, or nothing, which leaves the
 *   plane its square.
 */
export function faceOf(
  lattice: Lattice,
  point: Point3,
  normal: Point3,
  clip: boolean,
): { outline?: readonly Point3[] } {
  if (!clip) return {};
  const outline = cellSection(lattice, point, normal);
  return outline.length < 3 ? {} : { outline };
}

/** Below this, ångström, a line only grazes a corner of the cell. */
const MINIMUM_ROD = 1e-6;
