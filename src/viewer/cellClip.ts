/**
 * Where an element meets the cell it belongs to.
 *
 * A symmetry element is unbounded — an axis is a whole line, a plane a whole
 * plane — so drawing one means choosing how much of it to show. A rod of some
 * arbitrary length centred on whatever point the decomposition happened to
 * report reads as a floating stick; the same axis cut off where it enters and
 * leaves the box reads as a diagonal of the cell, which is what it is.
 *
 * Everything here works in fractional coordinates, where the cell is the unit
 * cube however oblique it is in ångström, and hands the answer back in
 * Cartesian ångström.
 */

import type { Lattice } from '../symmetry/core/index.ts';
import type { Vec3 } from '../symmetry/point/vec3.ts';
import {
  addVectors,
  dotProduct,
  scaleVector,
  subtractVectors,
} from '../symmetry/point/vec3.ts';

import { planeFrame } from './frame.ts';
import {
  normalToFractional,
  toCartesian,
  toFractional,
} from './latticeBasis.ts';
import type { Point3 } from './types.ts';

/** The piece of a line that lies inside the cell. */
export interface CellSegment {
  readonly start: Point3;
  readonly end: Point3;
}

/**
 * Where a line enters and leaves the cell.
 *
 * @param lattice - The cell it is cut against.
 * @param point - A point of the line, Cartesian ångström.
 * @param direction - Its direction, Cartesian; need not be normalised.
 * @param cells - How many cells the box spans along each axis.
 *   @default 1
 * @returns The two ends, or `null` when the line misses the box, and when the
 *   direction is too short to say which way the line runs.
 */
export function clipLineToCell(
  lattice: Lattice,
  point: Point3,
  direction: Point3,
  cells = 1,
): CellSegment | null {
  const origin = toFractional(lattice, point);
  const along = toFractional(lattice, direction);
  let enter = Number.NEGATIVE_INFINITY;
  let leave = Number.POSITIVE_INFINITY;
  for (let axis = 0; axis < 3; axis++) {
    const speed = along[axis] ?? 0;
    const start = origin[axis] ?? 0;
    if (Math.abs(speed) < PARALLEL) {
      if (start < -SLACK || start > cells + SLACK) return null;
      continue;
    }
    const first = (0 - start) / speed;
    const second = (cells - start) / speed;
    enter = Math.max(enter, Math.min(first, second));
    leave = Math.min(leave, Math.max(first, second));
  }
  // Every axis was parallel, so there is no line to cut: the ends would come
  // back as `0 · ∞`, which is `NaN` in every coordinate and poisons the scene.
  if (!Number.isFinite(enter) || !Number.isFinite(leave)) return null;
  if (!(leave > enter)) return null;
  return {
    start: toCartesian(lattice, stepAlong(origin, along, enter)),
    end: toCartesian(lattice, stepAlong(origin, along, leave)),
  };
}

/**
 * The polygon a plane cuts out of the cell.
 *
 * The corners come back in order around the plane, so a triangle fan over them
 * is the face itself and a rod between each neighbouring pair is its rim.
 *
 * @param lattice - The cell it is cut against.
 * @param point - A point of the plane, Cartesian ångström.
 * @param normal - Its normal, Cartesian; need not be normalised.
 * @param cells - How many cells the box spans along each axis.
 *   @default 1
 * @returns The corners, Cartesian ångström, or an empty list when the plane
 *   misses the box or only touches an edge or a corner of it.
 */
export function cellSection(
  lattice: Lattice,
  point: Point3,
  normal: Point3,
  cells = 1,
): Point3[] {
  const origin = toFractional(lattice, point);
  // A Cartesian normal n reads in fractional coordinates as Mᵀn, which is what
  // keeps the plane in place in a cell that is not orthogonal.
  const along = normalToFractional(lattice, normal);
  const corners = cubeCorners(cells);
  const heights: number[] = [];
  for (const corner of corners) {
    heights.push(dotProduct(along, subtractVectors(corner, origin)));
  }
  const hits: Vec3[] = [];
  for (let index = 0; index < corners.length; index++) {
    const corner = corners[index];
    if (corner !== undefined && Math.abs(heights[index] ?? 0) < FLAT) {
      hits.push(corner);
    }
  }
  for (const [from, to] of CUBE_EDGES) {
    const low = heights[from] ?? 0;
    const high = heights[to] ?? 0;
    if (Math.abs(low) < FLAT || Math.abs(high) < FLAT) continue;
    if (low > 0 === high > 0) continue;
    const start = corners[from];
    const end = corners[to];
    if (start === undefined || end === undefined) continue;
    const fraction = low / (low - high);
    hits.push(stepAlong(start, subtractVectors(end, start), fraction));
  }
  const points: Point3[] = [];
  for (const hit of hits) points.push(toCartesian(lattice, hit));
  const section = dedupe(points);
  if (section.length < 3) return [];
  return orderAroundPlane(section, normal);
}

function stepAlong(origin: Vec3, direction: Vec3, distance: number): Vec3 {
  return addVectors(origin, scaleVector(direction, distance));
}

/** The eight corners of the box, in the order {@link CUBE_EDGES} indexes. */
function cubeCorners(cells: number): Vec3[] {
  const corners: Vec3[] = [];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      for (let k = 0; k < 2; k++) {
        corners.push([i * cells, j * cells, k * cells]);
      }
    }
  }
  return corners;
}

/** Corners that differ in exactly one coordinate are joined by an edge. */
const CUBE_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0, 2],
  [0, 4],
  [1, 3],
  [1, 5],
  [2, 3],
  [2, 6],
  [3, 7],
  [4, 5],
  [4, 6],
  [5, 7],
  [6, 7],
];

/** The same corners, walked round the plane rather than found in cube order. */
function orderAroundPlane(points: readonly Point3[], normal: Point3): Point3[] {
  const { major, minor } = planeFrame(normal);
  let centre: Point3 = [0, 0, 0];
  for (const point of points) centre = addVectors(centre, point);
  centre = scaleVector(centre, 1 / points.length);
  const turned: Array<{ point: Point3; angle: number }> = [];
  for (const point of points) {
    const offset = subtractVectors(point, centre);
    turned.push({
      point,
      angle: Math.atan2(dotProduct(offset, minor), dotProduct(offset, major)),
    });
  }
  turned.sort((left, right) => left.angle - right.angle);
  const ordered: Point3[] = [];
  for (const entry of turned) ordered.push(entry.point);
  return ordered;
}

/** A corner the plane passes through is found once per edge that meets it. */
function dedupe(points: readonly Point3[]): Point3[] {
  const kept: Point3[] = [];
  for (const point of points) {
    let seen = false;
    for (const other of kept) {
      if (
        Math.abs((point[0] ?? 0) - (other[0] ?? 0)) < SAME &&
        Math.abs((point[1] ?? 0) - (other[1] ?? 0)) < SAME &&
        Math.abs((point[2] ?? 0) - (other[2] ?? 0)) < SAME
      ) {
        seen = true;
        break;
      }
    }
    if (!seen) kept.push(point);
  }
  return kept;
}

/** Below this, a line runs along a face rather than through it. */
const PARALLEL = 1e-9;

/** How far outside the box a parallel line may still count as inside it. */
const SLACK = 1e-9;

/** Below this, in cell fractions, a corner lies on the plane. */
const FLAT = 1e-9;

/** Below this, in ångström, two corners are the same corner. */
const SAME = 1e-6;
