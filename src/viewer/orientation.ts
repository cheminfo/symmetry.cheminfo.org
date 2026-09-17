/**
 * Where the camera opens on a scene.
 *
 * molstar starts every canvas looking down −z, and a molecule is built in its
 * standard frame with the principal axis along z — so the site opened on the
 * one view that shows no symmetry at all: water end-on, three balls in a
 * column, both σv planes exactly edge-on and the C₂ a dot behind the oxygen. A
 * page that says *hover an axis or a plane* had nothing to hover.
 *
 * The cure is not another world direction, which would merely move the blind
 * spot onto the molecules whose axis is x. The view is measured **from the
 * scene's own axis**: the highest-order axis it draws, or a crystal's c edge.
 */

import {
  addVectors,
  crossProduct,
  dotProduct,
  normalizeVector,
  scaleVector,
  subtractVectors,
  vectorNorm,
} from '../symmetry/point/vec3.ts';

import { cellAxes } from './cellGeometry.ts';
import { perpendicularTo } from './frame.ts';
import type { Point3, SymmetryDrawing, UnitCell } from './types.ts';

/** Where the camera sits and which way is up, as unit vectors. */
export interface ViewOrientation {
  /** From the centre of the scene towards the camera. */
  readonly eye: Point3;
  /** Up on screen; at right angles to `eye`. */
  readonly up: Point3;
}

/** The part of a scene the opening view is read off. */
export interface OrientedScene {
  /**
   * The cell, when the scene has one. A crystal is framed on its cell rather
   * than on its elements: a box that reads as a box is what places the fifty
   * axes inside it.
   * @default null
   */
  readonly cell?: UnitCell | null;
  /**
   * The symmetry elements drawn over the structure.
   * @default []
   */
  readonly elements?: readonly SymmetryDrawing[];
}

/**
 * The view a scene opens on.
 *
 * @param scene - What is drawn; see {@link OrientedScene}.
 * @returns A three-quarter view of it.
 */
export function sceneOrientation(scene: OrientedScene): ViewOrientation {
  const { cell = null, elements = [] } = scene;
  if (cell !== null) {
    const [a, , c] = cellAxes(cell);
    return threeQuarterView(c, a);
  }
  return threeQuarterView(principalAxisOf(elements) ?? WORLD_AXIS);
}

/**
 * The scene's own axis: the highest-order one it draws, or a plane normal when
 * it draws no axis at all.
 *
 * @param drawings - The symmetry elements on screen.
 * @returns Its direction, or `null` when nothing drawn has one — an inversion
 *   centre alone, or an empty scene.
 */
export function principalAxisOf(
  drawings: readonly SymmetryDrawing[],
): Point3 | null {
  let axis: Point3 | null = null;
  let order = 0;
  let normal: Point3 | null = null;
  for (const drawing of drawings) {
    if (drawing.kind === 'mirror' || drawing.kind === 'glide') {
      if (normal === null && hasDirection(drawing.normal)) {
        normal = drawing.normal;
      }
      continue;
    }
    if (drawing.kind === 'inversion') continue;
    if (drawing.order <= order || !hasDirection(drawing.direction)) continue;
    axis = drawing.direction;
    order = drawing.order;
  }
  return axis ?? normal;
}

/**
 * A view three-quarters of the way round an axis and well off the end of it.
 *
 * @param axis - The direction the view is measured from; need not be
 *   normalised, and its sign does not matter.
 * @param reference - Where the azimuth is measured from — a crystal passes its
 *   a edge, so the same cell always opens the same way round. Left out, one is
 *   chosen from the axis alone.
 * @returns Where the camera sits, and which way is up.
 * @throws When the axis is too short to have a direction.
 */
export function threeQuarterView(
  axis: Point3,
  reference?: Point3,
): ViewOrientation {
  const up = upwards(normalizeVector(axis));
  const major = azimuthFrom(up, reference);
  const minor = crossProduct(up, major);
  const polar = toRadians(POLAR_DEGREES);
  const azimuth = toRadians(AZIMUTH_DEGREES);
  const eye = normalizeVector(
    addVectors(
      addVectors(
        scaleVector(major, Math.sin(polar) * Math.cos(azimuth)),
        scaleVector(minor, Math.sin(polar) * Math.sin(azimuth)),
      ),
      scaleVector(up, Math.cos(polar)),
    ),
  );
  return {
    eye,
    up: rollAbout(rejectFrom(up, eye), eye, toRadians(ROLL_DEGREES)),
  };
}

/** Whichever way up leaves the axis pointing towards the top of the screen. */
function upwards(unit: Point3): Point3 {
  const [x, y, z] = unit;
  let leading = x;
  if (Math.abs(z) > DIRECTION_FLOOR) leading = z;
  else if (Math.abs(y) > DIRECTION_FLOOR) leading = y;
  return leading < 0 ? scaleVector(unit, -1) : unit;
}

/** The direction the azimuth is measured from, at right angles to the axis. */
function azimuthFrom(up: Point3, reference: Point3 | undefined): Point3 {
  if (reference === undefined) return perpendicularTo(up);
  const flat = subtractVectors(
    reference,
    scaleVector(up, dotProduct(reference, up)),
  );
  return hasDirection(flat) ? normalizeVector(flat) : perpendicularTo(up);
}

/** The part of a vector at right angles to a unit direction. */
function rejectFrom(vector: Point3, unit: Point3): Point3 {
  return normalizeVector(
    subtractVectors(vector, scaleVector(unit, dotProduct(vector, unit))),
  );
}

/** Turn a vector about a unit axis it is already at right angles to. */
function rollAbout(vector: Point3, unit: Point3, angle: number): Point3 {
  return addVectors(
    scaleVector(vector, Math.cos(angle)),
    scaleVector(crossProduct(unit, vector), Math.sin(angle)),
  );
}

/** Whether a vector is long enough to say which way it points. */
function hasDirection(vector: Point3): boolean {
  return vectorNorm(vector) > DIRECTION_FLOOR;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * How far off the axis the camera sits, degrees.
 *
 * Not 0 — that is the end-on view this module exists to stop — and not 90,
 * which lays the eye inside every plane that contains the axis. At 65° an axis
 * still draws 91% of its length while a plane across it is seen at 42% of its
 * face, so a rod reads as a rod and a σh reads as a disc.
 */
const POLAR_DEGREES = 65;

/**
 * How far round the axis, degrees from the reference direction.
 *
 * Every round value is a special position of some group: 0 and 90 lay the eye
 * in a plane of any two at right angles, 45 in the diagonal plane of a
 * four-fold, 30 and 60 in a three- or six-fold's. At 40° two planes at right
 * angles are seen at 77% and 64% of their face, and neither is edge-on.
 */
const AZIMUTH_DEGREES = 40;

/**
 * How far the horizon is tilted, degrees.
 *
 * Without it the axis stands exactly upright and the scene reads as a flat
 * diagram of itself; ten degrees is enough to say it is a solid seen in space,
 * and little enough that the names floating beside each element stay level
 * enough to read.
 */
const ROLL_DEGREES = 10;

/** Which way is up when nothing drawn says otherwise. */
const WORLD_AXIS: Point3 = [0, 0, 1];

/** Below this length a vector is taken to have no direction at all. */
const DIRECTION_FLOOR = 1e-9;
