/**
 * The stereographic projection, and the trace a mirror plane leaves on it.
 *
 * A direction in the upper hemisphere is projected from the south pole and a
 * direction in the lower one from the north pole, so every direction lands
 * inside the primitive circle — which is the whole reason the projection pole
 * switches at the equator.
 */

import type { Vec3 } from '../../symmetry/operations.ts';

import { circlePath } from './glyphs.ts';
import { round } from './precision.ts';

/** The trace of one mirror plane on the diagram. */
export type StereogramMirror =
  /** Perpendicular to the projection axis: the primitive circle itself, heavy. */
  | { readonly key: string; readonly kind: 'horizontal' }
  /** Containing the projection axis: a diameter. */
  | {
      readonly key: string;
      readonly kind: 'diameter';
      readonly x1: number;
      readonly y1: number;
      readonly x2: number;
      readonly y2: number;
    }
  /** Inclined: a circle meeting the primitive one at right angles, clipped to it. */
  | {
      readonly key: string;
      readonly kind: 'arc';
      readonly cx: number;
      readonly cy: number;
      readonly r: number;
    };

/**
 * A direction on no axis and in no mirror of any of the 32 crystal classes:
 * azimuth 22°, polar 40°. Every image of it is then distinct, so the number of
 * marks on the diagram is the order of the group.
 */
export const PROBE_DIRECTION: Vec3 = directionOf(22, 40);

/** How far a component may sit from 0 or 1 and still count as it. */
const TOLERANCE = 1e-9;

/**
 * Where a unit direction lands on the diagram.
 *
 * @param direction - A unit vector.
 * @param radius - Radius of the primitive circle.
 * @returns The projected point, and which hemisphere it came from.
 */
export function stereographic(
  direction: Vec3,
  radius: number,
): { x: number; y: number; upper: boolean } {
  const upper = direction[2] >= 0;
  const scale = radius / (upper ? 1 + direction[2] : 1 - direction[2]);
  return {
    x: round(direction[0] * scale),
    y: round(direction[1] * scale),
    upper,
  };
}

/**
 * The trace of the plane with this normal.
 *
 * With `u = X/R` and `v = Y/R`, the inverse projection is
 * `(2u, 2v, 1 − u² − v²)/(1 + u² + v²)`, and `p · n = 0` reduces to
 * `(u − nx/nz)² + (v − ny/nz)² = 1/nz²` — a circle of centre `R(nx/nz, ny/nz)`
 * and radius `R/|nz|`, which meets the primitive circle at right angles, so
 * clipping it to the disc needs no arc arithmetic.
 *
 * @param normal - Unit normal of the plane; a normal and its opposite are one plane.
 * @param radius - Radius of the primitive circle.
 */
export function mirrorTrace(normal: Vec3, radius: number): StereogramMirror {
  const [nx, ny, nz] = canonicalNormal(normal);
  const key = `${round(nx)},${round(ny)},${round(nz)}`;
  if (Math.abs(nz) >= 1 - TOLERANCE) return { key, kind: 'horizontal' };
  if (Math.abs(nz) <= TOLERANCE) {
    const length = Math.hypot(nx, ny);
    // Both ends of a diameter are the same line: fix the order rather than let
    // the sign of the normal decide it.
    const dx = Math.abs((ny / length) * radius);
    const dy = ((nx * (ny < 0 ? -1 : 1)) / length) * radius;
    return {
      key,
      kind: 'diameter',
      x1: round(-dx),
      y1: round(-dy),
      x2: round(dx),
      y2: round(dy),
    };
  }
  return {
    key,
    kind: 'arc',
    cx: round((radius * nx) / nz),
    cy: round((radius * ny) / nz),
    r: round(radius / Math.abs(nz)),
  };
}

/** The primitive circle as path data, so the frame is one more `<path>`. */
export function primitiveCirclePath(radius: number): string {
  return circlePath(0, 0, radius);
}

/** A normal and its opposite are one plane: the first non-zero component is positive. */
export function canonicalNormal(normal: Vec3): Vec3 {
  for (let index = 0; index < 3; index++) {
    const value = normal[index] ?? 0;
    if (Math.abs(value) <= TOLERANCE) continue;
    return value > 0
      ? normal
      : [flip(normal[0]), flip(normal[1]), flip(normal[2])];
  }
  return normal;
}

/** `−value`, with `−0` folded onto `0` so a flipped normal still prints cleanly. */
function flip(value: number): number {
  return value === 0 ? 0 : -value;
}

/** The unit vector at this azimuth and polar angle, both in degrees. */
function directionOf(azimuth: number, polar: number): Vec3 {
  const theta = (azimuth * Math.PI) / 180;
  const phi = (polar * Math.PI) / 180;
  return [
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi),
  ];
}
