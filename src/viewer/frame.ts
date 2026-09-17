/**
 * Two directions spanning a plane, chosen the same way every time.
 *
 * A mirror plane is drawn as a square, and a square needs two in-plane
 * directions that the normal alone does not give. Picking them deterministically
 * is what stops the same plane being drawn at two different rotations on two
 * successive renders.
 */

import type { Vec3 } from '../symmetry/point/vec3.ts';
import {
  crossProduct,
  dotProduct,
  normalizeVector,
  scaleVector,
  subtractVectors,
} from '../symmetry/point/vec3.ts';

/** An orthonormal pair spanning a plane, with the normal that produced it. */
export interface PlaneFrame {
  /** The unit normal. */
  readonly normal: Vec3;
  /** First in-plane direction. */
  readonly major: Vec3;
  /** Second in-plane direction, `normal × major`. */
  readonly minor: Vec3;
}

/**
 * The frame of the plane with this normal.
 *
 * @param normal - The plane normal; need not be normalised.
 * @returns The unit normal and two unit directions in the plane.
 * @throws When the normal is too short to have a direction.
 */
export function planeFrame(normal: Vec3): PlaneFrame {
  const unit = normalizeVector(normal);
  const major = perpendicularTo(unit);
  return { normal: unit, major, minor: crossProduct(unit, major) };
}

/**
 * A unit vector at right angles to `direction`.
 *
 * The seed is `x̂` unless the direction is already close to it, which is the
 * one case where projecting out the direction would leave nothing to normalise.
 *
 * @param direction - Any non-zero vector; need not be normalised.
 * @returns A unit vector orthogonal to it.
 * @throws When the direction is too short to have one.
 */
export function perpendicularTo(direction: Vec3): Vec3 {
  const unit = normalizeVector(direction);
  const seed: Vec3 = Math.abs(unit[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  return normalizeVector(
    subtractVectors(seed, scaleVector(unit, dotProduct(seed, unit))),
  );
}
