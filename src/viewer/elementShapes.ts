/**
 * The shape vocabulary a symmetry element is drawn in: rods, arrows and faces.
 *
 * A crystallographic diagram draws six kinds of element out of three shapes, so
 * the kinds are the switch and these are the words it is written in. Each one
 * takes plain geometry and hands back primitives, which is what makes the whole
 * of the drawing testable without a canvas.
 */

import {
  addVectors,
  normalizeVector,
  scaleVector,
} from '../symmetry/point/vec3.ts';

import { planeFrame } from './frame.ts';
import type { MeshPrimitive, ResolvedElementStyle } from './primitives.ts';
import type { GlideDrawing, MirrorDrawing, Point3 } from './types.ts';

/**
 * The two ends of a rod of `length` centred on `point`.
 *
 * @param point - Its middle.
 * @param direction - Which way it runs; need not be normalised.
 * @param length - Its total length, ångström.
 * @returns The two ends, the one against `direction` first.
 */
export function rodEnds(
  point: Point3,
  direction: Point3,
  length: number,
): [Point3, Point3] {
  const half = scaleVector(normalizeVector(direction), length / 2);
  return [addVectors(point, scaleVector(half, -1)), addVectors(point, half)];
}

/**
 * A shaft and a head, pointing along `direction` for `length` ångström.
 *
 * @param base - Where the arrow starts.
 * @param direction - Which way it points; need not be normalised.
 * @param length - How far it reaches. A negative length points the other way,
 *   which is how a left-handed screw is told from a right-handed one.
 * @param sizes - Resolved sizes.
 * @returns The shaft, when there is room for one, and the head.
 */
export function arrow(
  base: Point3,
  direction: Point3,
  length: number,
  sizes: ResolvedElementStyle,
): MeshPrimitive[] {
  const reach = Math.abs(length);
  if (reach < MINIMUM_ARROW) return [];
  const unit = scaleVector(normalizeVector(direction), Math.sign(length));
  const head = Math.min(sizes.arrowLength, reach);
  const shaftEnd = addVectors(base, scaleVector(unit, reach - head));
  const tip = addVectors(base, scaleVector(unit, reach));
  const primitives: MeshPrimitive[] = [];
  if (reach > head) {
    primitives.push({
      shape: 'rod',
      start: base,
      end: shaftEnd,
      radius: sizes.axisRadius,
    });
  }
  primitives.push({
    shape: 'cone',
    base: shaftEnd,
    tip,
    radius: sizes.arrowRadius,
  });
  return primitives;
}

/**
 * A plane as a face and the rim round it, so a stack of them stays readable.
 *
 * @param drawing - The mirror or glide plane.
 * @param sizes - Resolved sizes.
 * @returns The face and one rod per edge, or the square when the plane was
 *   given no outline to be cut to.
 */
export function planeFace(
  drawing: GlideDrawing | MirrorDrawing,
  sizes: ResolvedElementStyle,
): MeshPrimitive[] {
  const outline = drawing.outline;
  if (outline === undefined || outline.length < 3) {
    return [plate(drawing.point, drawing.normal, drawing.size)];
  }
  const primitives: MeshPrimitive[] = [{ shape: 'face', points: outline }];
  for (let index = 0; index < outline.length; index++) {
    const start = outline[index];
    const end = outline[(index + 1) % outline.length];
    if (start === undefined || end === undefined) continue;
    primitives.push({ shape: 'rod', start, end, radius: sizes.rimRadius });
  }
  return primitives;
}

/**
 * The face a plane is drawn as: the outline it was given, or a square.
 *
 * @param drawing - The mirror or glide plane.
 * @returns Its corners, in order around the plane.
 */
export function faceCorners(drawing: GlideDrawing | MirrorDrawing): Point3[] {
  const outline = drawing.outline;
  if (outline !== undefined && outline.length >= 3) return [...outline];
  const { major, minor } = planeFrame(drawing.normal);
  const half = drawing.size / 2;
  const corners: Point3[] = [];
  for (const [along, across] of SQUARE) {
    corners.push(
      addVectors(
        drawing.point,
        addVectors(
          scaleVector(major, along * half),
          scaleVector(minor, across * half),
        ),
      ),
    );
  }
  return corners;
}

/** The square a mirror or a glide plane is drawn as. */
function plate(point: Point3, normal: Point3, size: number): MeshPrimitive {
  const { major, minor } = planeFrame(normal);
  return { shape: 'plate', centre: point, major, minor, size };
}

/** The four corners of a square, as multiples of its half-side. */
const SQUARE: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

/** Below this, ångström, an arrow is a blob and is left out. */
const MINIMUM_ARROW = 1e-6;
