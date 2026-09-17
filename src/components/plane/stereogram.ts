/**
 * The whole stereogram of a point group: where the general position goes, and
 * which axis and mirror symbols sit over it.
 *
 * Four marks carry the diagram, and a student who reads them reads any
 * International Tables point-group page: **filled** for the upper hemisphere,
 * **open** for the lower, the two **concentric** where a horizontal mirror or an
 * inversion centre superimposes them, and a **comma** inside a circle for a
 * point of the opposite hand.
 */

import type { PointOperation, Vec3 } from '../../symmetry/operations.ts';
import { matrixDeterminant } from '../../symmetry/point/mat3.ts';

import { rotationGlyphPath } from './glyphs.ts';
import type { StereogramMirror } from './stereographic.ts';
import {
  PROBE_DIRECTION,
  mirrorTrace,
  stereographic,
} from './stereographic.ts';

/** One image of the general position. */
export interface StereogramPoint {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  /** `z ≥ 0`: the Tables fill the circle, and leave it open below. */
  readonly upper: boolean;
  /** `det = −1`: the image is of the opposite hand, and carries a comma. */
  readonly mirrored: boolean;
  /** The operation that produced it, as a chemist writes it. */
  readonly label: string;
}

/**
 * One rotation axis, at its own projected position.
 *
 * A proper axis takes the filled glyph of its order and an improper one the same
 * glyph left open, so a coincident `C₂` and `S₄` read as a lens inside a square
 * — the Tables' own `4̄`. The rule also covers the 5-, 7- and 8-fold axes of the
 * molecular groups, which the Tables have no glyph for.
 */
export interface StereogramAxis {
  readonly key: string;
  readonly order: number;
  readonly improper: boolean;
  readonly x: number;
  readonly y: number;
  readonly path: string;
}

/** Everything a stereogram draws. */
export interface Stereogram {
  readonly radius: number;
  readonly points: readonly StereogramPoint[];
  readonly axes: readonly StereogramAxis[];
  readonly mirrors: readonly StereogramMirror[];
  /** The group contains the inversion, drawn as an open circle at the centre. */
  readonly inversion: boolean;
}

/**
 * How much larger an improper axis's glyph is than a proper one's.
 *
 * The two coincide — an `S₄` runs along the `C₂` it squares to — so the open
 * glyph is drawn first and wider, and the filled one sits inside it. That is
 * how the Tables draw `4̄`: an open square with a filled lens in it.
 */
const IMPROPER_SCALE = 1.5;

/** What a caller may change about the diagram. */
export interface StereogramOptions {
  /** Radius of the primitive circle. @default 100 */
  readonly radius?: number;
  /** The general position projected. @default {@link PROBE_DIRECTION} */
  readonly probe?: Vec3;
  /** The length the glyph sizes are fractions of. @default the radius */
  readonly glyphScale?: number;
}

/**
 * The drawable stereogram of one point group.
 *
 * @param operations - From `operationsOf(id)`. `C∞v` and `D∞h` have no operation
 *   list at all, so a catalogue page must not ask for one.
 * @param options - Radius, probe direction and glyph scale.
 */
export function stereogramOf(
  operations: readonly PointOperation[],
  options: StereogramOptions = {},
): Stereogram {
  const radius = options.radius ?? 100;
  const probe = options.probe ?? PROBE_DIRECTION;
  const glyphScale = options.glyphScale ?? radius;
  const points: StereogramPoint[] = [];
  const axes = new Map<string, StereogramAxis>();
  const mirrors = new Map<string, StereogramMirror>();
  let inversion = false;
  for (let index = 0; index < operations.length; index++) {
    const operation = operations[index];
    if (operation === undefined) continue;
    points.push(probePoint(operation, probe, radius, index));
    if (operation.kind === 'i') inversion = true;
    if (operation.kind === 'sigma' && operation.axis !== null) {
      const mirror = mirrorTrace(operation.axis, radius);
      mirrors.set(mirror.key, mirror);
    }
    if (operation.kind === 'Cn' || operation.kind === 'Sn') {
      addAxis(axes, operation, radius, glyphScale);
    }
  }
  return {
    radius,
    points,
    // The open glyphs first, so a proper axis is legible inside its improper one.
    axes: [...axes.values()].toSorted(
      (first, second) => Number(second.improper) - Number(first.improper),
    ),
    mirrors: [...mirrors.values()],
    inversion,
  };
}

/** Where one operation sends the probe. */
function probePoint(
  operation: PointOperation,
  probe: Vec3,
  radius: number,
  index: number,
): StereogramPoint {
  const matrix = operation.matrix;
  const image: Vec3 = [
    dot(matrix[0], probe),
    dot(matrix[1], probe),
    dot(matrix[2], probe),
  ];
  const { x, y, upper } = stereographic(image, radius);
  return {
    key: `${index}:${operation.label}`,
    x,
    y,
    upper,
    mirrored: matrixDeterminant(matrix) < 0,
    label: operation.label,
  };
}

/** Both senses of one axis, keeping the highest order at each projected place. */
function addAxis(
  axes: Map<string, StereogramAxis>,
  operation: PointOperation,
  radius: number,
  glyphScale: number,
): void {
  if (operation.axis === null || operation.order < 2) return;
  const improper = operation.kind === 'Sn';
  const senses: Vec3[] = [
    operation.axis,
    [-operation.axis[0], -operation.axis[1], -operation.axis[2]],
  ];
  for (const sense of senses) {
    const { x, y } = stereographic(sense, radius);
    const key = `${improper ? 'S' : 'C'}|${x},${y}`;
    const current = axes.get(key);
    if (current !== undefined && current.order >= operation.order) continue;
    axes.set(key, {
      key,
      order: operation.order,
      improper,
      x,
      y,
      path: rotationGlyphPath(
        operation.order,
        x,
        y,
        improper ? glyphScale * IMPROPER_SCALE : glyphScale,
      ),
    });
  }
}

/** The scalar product of a matrix row with the probe. */
function dot(row: Vec3, vector: Vec3): number {
  return row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2];
}
