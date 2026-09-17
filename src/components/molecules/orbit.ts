/**
 * Where the group sends one point.
 *
 * The orbit is the cheapest demonstration that a group is a set of operations
 * rather than a picture: drop a probe point anywhere off the elements, apply
 * every operation, and the images land on |G| places. Count them and you have
 * read the order of the group off the screen.
 */

import type { PointOperation } from '../../symmetry/operations.ts';
import { applyMatrix } from '../../symmetry/point/mat3.ts';
import type { Vec3 } from '../../symmetry/point/vec3.ts';
import {
  normalizeVector,
  scaleVector,
  vectorDistance,
} from '../../symmetry/point/vec3.ts';
import type { SymmetryDrawing } from '../../viewer/core.ts';

/*
 * The probe and its images are subject matter, not chrome: they are a quantity
 * the picture is read on, and a green that belongs to none of the six element
 * kinds is what keeps them from reading as a seventh kind of element.
 */
const PROBE_COLOUR = '#15803d';

/**
 * Directions tried for the probe, in order.
 *
 * The first one whose images are all distinct wins. A probe that happens to lie
 * on a mirror or an axis has a shorter orbit than the group has operations, and
 * a student counting the dots would then read the wrong order.
 */
const PROBE_DIRECTIONS: readonly Vec3[] = [
  [0.37, 0.53, 0.76],
  [0.81, 0.29, 0.51],
  [0.24, 0.87, 0.43],
];

/** How far apart two images must be to be two, ångström. */
const DISTINCT = 1e-4;

/**
 * The probe point and every image of it.
 *
 * @param operations - The molecule's operations, in its own frame.
 * @param extent - How far the furthest atom sits from the centroid, ångström;
 *   the probe is placed outside the structure so nothing hides it.
 * @returns One ball per image, the probe first. Empty when there is no
 *   operation list, which is the case for a linear molecule.
 */
export function orbitDrawings(
  operations: readonly PointOperation[],
  extent: number,
): readonly SymmetryDrawing[] {
  if (operations.length === 0) return [];
  const radius = Math.max(extent, 1) + 1.1;
  const points = bestOrbit(operations, radius);
  const drawings: SymmetryDrawing[] = [];
  for (let index = 0; index < points.length; index++) {
    drawings.push({
      kind: 'inversion',
      id: `orbit:${index}`,
      // Only the probe is named: |G| floating labels would bury the structure,
      // and an empty label draws none and reports none under the pointer.
      label: index === 0 ? 'probe point' : '',
      colour: PROBE_COLOUR,
      point: points[index] as Vec3,
    });
  }
  return drawings;
}

/**
 * Every image of a point under the operations, with the repeats dropped.
 *
 * @param operations - The operations to apply.
 * @param point - Where the probe sits.
 * @returns The images, the probe itself first.
 */
export function orbitOf(
  operations: readonly PointOperation[],
  point: Vec3,
): readonly Vec3[] {
  const images: Vec3[] = [point];
  for (const operation of operations) {
    const image = applyMatrix(operation.matrix, point);
    let seen = false;
    for (const known of images) {
      if (vectorDistance(known, image) <= DISTINCT) {
        seen = true;
        break;
      }
    }
    if (!seen) images.push(image);
  }
  return images;
}

/** The first probe direction whose orbit is as long as the group is large. */
function bestOrbit(
  operations: readonly PointOperation[],
  radius: number,
): readonly Vec3[] {
  let longest: readonly Vec3[] = [];
  for (const direction of PROBE_DIRECTIONS) {
    const orbit = orbitOf(
      operations,
      scaleVector(normalizeVector(direction), radius),
    );
    if (orbit.length === operations.length) return orbit;
    if (orbit.length > longest.length) longest = orbit;
  }
  return longest;
}
