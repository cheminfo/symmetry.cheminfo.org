/**
 * How much room the scene takes, so the camera can frame it.
 *
 * molstar measures a representation's bounding sphere with the largest ball it
 * could ever draw added on, which on a molecule of a dozen atoms is about two
 * ångström of empty frame — the difference between a model that fills the view
 * and one that fills a quarter of it. The atoms are here, so they are measured
 * here.
 */

import type { MeshPrimitive } from './primitives.ts';
import { primitivePoints } from './primitives.ts';
import type { Point3 } from './types.ts';

/** A ball holding everything on screen. */
export interface SceneSphere {
  /** Its centre, Cartesian ångström. */
  readonly centre: Point3;
  /** Its radius, ångström; zero for a single point. */
  readonly radius: number;
}

/**
 * The smallest ball about the centroid that holds every point.
 *
 * @param points - What has to fit; an empty list gives a point at the origin.
 * @param padding - Extra radius, ångström, for whatever is drawn around them.
 * @returns The ball.
 */
export function boundingSphereOf(
  points: readonly Point3[],
  padding = 0,
): SceneSphere {
  if (points.length === 0) return { centre: [0, 0, 0], radius: padding };
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  for (const point of points) {
    sumX += point[0];
    sumY += point[1];
    sumZ += point[2];
  }
  const centre: Point3 = [
    sumX / points.length,
    sumY / points.length,
    sumZ / points.length,
  ];
  let radius = 0;
  for (const point of points) {
    const distance = Math.hypot(
      point[0] - centre[0],
      point[1] - centre[1],
      point[2] - centre[2],
    );
    if (distance > radius) radius = distance;
  }
  return { centre, radius: radius + padding };
}

/**
 * The radius to frame.
 *
 * The scene is measured as the ball through its furthest corners, and a camera
 * fitting that ball to the window leaves a cell filling barely half of it: a
 * cube touches its own circumscribed sphere only at eight corners, and uses
 * about 82% of its diameter even seen square-on. So the ball handed to the
 * camera is **smaller** than the one measured, by about the slack that costs.
 * Nothing is cut at the orientations a cell is read at, and the reader can
 * always pull back.
 *
 * @param radius - What the scene measures.
 * @param margin - Fraction of it to add; negative frames tighter than the ball.
 * @param minimum - Never frame tighter than this, ångström, so a lone atom does
 *   not fill the window.
 * @returns The radius to hand the camera.
 */
export function framedRadius(
  radius: number,
  margin = -0.12,
  minimum = 0.5,
): number {
  return Math.max(radius * (1 + margin), minimum);
}

/**
 * One ball holding several — the atoms, the cell and the drawn elements at once.
 *
 * @param spheres - What has to fit; an empty list gives a point at the origin.
 * @returns A ball containing every one of them. It is not the smallest such
 *   ball, which is a harder problem than framing a scene deserves, but it never
 *   leaves anything outside.
 */
export function unionSpheres(spheres: readonly SceneSphere[]): SceneSphere {
  if (spheres.length === 0) return { centre: [0, 0, 0], radius: 0 };
  const first = spheres[0];
  if (spheres.length === 1 && first !== undefined) return first;
  const centres: Point3[] = [];
  for (const sphere of spheres) centres.push(sphere.centre);
  const { centre } = boundingSphereOf(centres);
  let radius = 0;
  for (const sphere of spheres) {
    const reach =
      Math.hypot(
        sphere.centre[0] - centre[0],
        sphere.centre[1] - centre[1],
        sphere.centre[2] - centre[2],
      ) + sphere.radius;
    if (reach > radius) radius = reach;
  }
  return { centre, radius };
}

/**
 * How far a set of drawn shapes reaches.
 *
 * @param primitives - The shapes.
 * @param padding - Extra radius, ångström.
 * @returns A ball holding them all.
 */
export function primitivesExtent(
  primitives: readonly MeshPrimitive[],
  padding = 0,
): SceneSphere {
  const points: Point3[] = [];
  for (const primitive of primitives) {
    points.push(...primitivePoints(primitive));
  }
  return boundingSphereOf(points, padding);
}
