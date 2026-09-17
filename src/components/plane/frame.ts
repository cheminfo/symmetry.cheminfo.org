/**
 * The window a tiling or a diagram is drawn in, and the cells that fill it.
 *
 * Every number here is in the y-up frame the geometry is computed in; the
 * `viewBox` is written for a `<g transform="scale(1 -1)">` wrapper, and that one
 * flip is the whole of the reconciliation with SVG's downward y.
 */

import type { Lattice } from '../../symmetry/core/index.ts';

import { round } from './precision.ts';
import { cellBasis } from './transforms.ts';

/** The drawing window, in the y-up frame. */
export interface PatternFrame {
  /** `x y width height`, ready for the `viewBox` attribute. */
  readonly viewBox: string;
  /** Left edge, in the screen coordinates the `viewBox` is written in. */
  readonly x: number;
  /** Top edge, in the same coordinates: `−maxY`, because of the flip. */
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Corners of the cell at the origin, ready for a `<polygon points>`. */
  readonly cellCorners: ReadonlyArray<readonly [number, number]>;
}

/**
 * The window that holds a block of cells.
 *
 * @param lattice - From `patternLattice`.
 * @param columns - Cells along **a**.
 * @param rows - Cells along **b**.
 * @param padding - Space left around the block, in the same units. @default 0
 */
export function patternFrame(
  lattice: Lattice,
  columns: number,
  rows: number,
  padding = 0,
): PatternFrame {
  const basis = cellBasis(lattice);
  const box = boundingBox(blockCorners(basis, columns, rows));
  const width = round(box.maxX - box.minX + 2 * padding);
  const height = round(box.maxY - box.minY + 2 * padding);
  // The flip sends y to −y, so the window's top edge is at −maxY on screen.
  const x = round(box.minX - padding);
  const y = round(-box.maxY - padding);
  return {
    viewBox: [x, y, width, height].join(' '),
    x,
    y,
    width,
    height,
    cellCorners: blockCorners(basis, 1, 1),
  };
}

/**
 * Enough lattice translations to fill the window a block of cells spans.
 *
 * A sheared cell — oblique or hexagonal — leaves the corners of its own
 * bounding box empty, so a tiling drawn from `tileShifts` alone has bare
 * triangles at its edges. This walks the box back through M⁻¹ and returns every
 * cell that meets it; the extra copies are clipped away by the frame.
 *
 * @param lattice - From `patternLattice`.
 * @param columns - Cells along **a**.
 * @param rows - Cells along **b**.
 */
export function coveringShifts(
  lattice: Lattice,
  columns: number,
  rows: number,
): Array<readonly [number, number]> {
  const basis = cellBasis(lattice);
  const inverse = lattice.fractional;
  const box = boundingBox(blockCorners(basis, columns, rows));
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  const corners: Array<readonly [number, number]> = [
    [box.minX, box.minY],
    [box.maxX, box.minY],
    [box.minX, box.maxY],
    [box.maxX, box.maxY],
  ];
  for (const [x, y] of corners) {
    const u = (inverse[0]?.[0] ?? 0) * x + (inverse[0]?.[1] ?? 0) * y;
    const v = (inverse[1]?.[0] ?? 0) * x + (inverse[1]?.[1] ?? 0) * y;
    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
    minV = Math.min(minV, v);
    maxV = Math.max(maxV, v);
  }
  const shifts: Array<readonly [number, number]> = [];
  for (let v = Math.floor(round(minV)); v < Math.ceil(round(maxV)); v++) {
    for (let u = Math.floor(round(minU)); u < Math.ceil(round(maxU)); u++) {
      shifts.push([u, v]);
    }
  }
  return shifts;
}

/** The four corners of a `columns × rows` block, anticlockwise from the origin. */
export function blockCorners(
  basis: readonly [number, number, number, number],
  columns: number,
  rows: number,
): Array<readonly [number, number]> {
  const fractional: Array<readonly [number, number]> = [
    [0, 0],
    [columns, 0],
    [columns, rows],
    [0, rows],
  ];
  const points: Array<readonly [number, number]> = [];
  for (const [u, v] of fractional) {
    points.push([
      round(basis[0] * u + basis[1] * v),
      round(basis[2] * u + basis[3] * v),
    ]);
  }
  return points;
}

/** The axis-aligned box a set of points spans. */
function boundingBox(points: ReadonlyArray<readonly [number, number]>): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return { minX, maxX, minY, maxY };
}
