/**
 * The unit cell as lines in space: its three edge vectors, the twelve edges of
 * one box, and the boxes of a supercell.
 *
 * The cell is drawn here rather than by molstar's own unit-cell shape, because
 * the site hands molstar no space group at all — it has already applied its own
 * operations — and because an n×n×n stack of boxes is not something that shape
 * can draw.
 */

import { cartesianMatrix } from '../symmetry/core/index.ts';
import type { Vec3 } from '../symmetry/point/vec3.ts';
import { addVectors, scaleVector } from '../symmetry/point/vec3.ts';

import type { CellRepeat, Point3, UnitCell } from './types.ts';

/** A segment of the drawn cell, Cartesian ångström. */
export interface CellEdge {
  readonly start: Point3;
  readonly end: Point3;
}

/**
 * The Cartesian components of a, b and c.
 *
 * The convention is the PDB one — a along x, b in the xy plane — which is the
 * one `src/symmetry/core` uses and the one every CIF consumer assumes.
 *
 * @param cell - The six cell parameters.
 * @returns The three edge vectors, in ångström.
 * @throws When the three angles describe no cell.
 */
export function cellAxes(cell: UnitCell): [Vec3, Vec3, Vec3] {
  const matrix = cartesianMatrix(cell);
  return [columnOf(matrix, 0), columnOf(matrix, 1), columnOf(matrix, 2)];
}

/**
 * Where one fractional point of one cell of the stack sits.
 *
 * @param axes - The cell's edge vectors.
 * @param fractional - The point, in cell fractions.
 * @returns Its Cartesian position, ångström.
 */
export function cellPoint(
  axes: readonly [Vec3, Vec3, Vec3],
  fractional: readonly [number, number, number],
): Point3 {
  return addVectors(
    addVectors(
      scaleVector(axes[0], fractional[0]),
      scaleVector(axes[1], fractional[1]),
    ),
    scaleVector(axes[2], fractional[2]),
  );
}

/**
 * The lattice translations of an n×n×n stack, one per cell, in reading order.
 *
 * @param axes - The cell's edge vectors.
 * @param repeat - Cells along a, b and c; anything below 1 counts as 1.
 * @returns One translation per cell, the first of them zero.
 */
export function latticeShifts(
  axes: readonly [Vec3, Vec3, Vec3],
  repeat: CellRepeat,
): Point3[] {
  const counts = clampRepeat(repeat);
  const shifts: Point3[] = [];
  for (let i = 0; i < counts[0]; i++) {
    for (let j = 0; j < counts[1]; j++) {
      for (let k = 0; k < counts[2]; k++) {
        shifts.push(cellPoint(axes, [i, j, k]));
      }
    }
  }
  return shifts;
}

/**
 * Every edge of every cell of the stack.
 *
 * @param cell - The six cell parameters.
 * @param repeat - Cells along a, b and c.
 * @returns Twelve edges per cell.
 * @throws When the three angles describe no cell.
 */
export function cellEdges(
  cell: UnitCell,
  repeat: CellRepeat = [1, 1, 1],
): CellEdge[] {
  const axes = cellAxes(cell);
  const edges: CellEdge[] = [];
  for (const shift of latticeShifts(axes, repeat)) {
    for (const [from, to] of BOX_EDGES) {
      edges.push({
        start: addVectors(shift, cellPoint(axes, from)),
        end: addVectors(shift, cellPoint(axes, to)),
      });
    }
  }
  return edges;
}

/**
 * Where the a, b and c letters sit on the box at the origin.
 *
 * @param cell - The six cell parameters.
 * @param reach - How far along each edge, as a fraction of it.
 * @returns Three points, for a, b and c in that order.
 * @throws When the three angles describe no cell.
 */
export function cellAxisLabelPoints(
  cell: UnitCell,
  reach = 0.55,
): [Point3, Point3, Point3] {
  const [a, b, c] = cellAxes(cell);
  return [scaleVector(a, reach), scaleVector(b, reach), scaleVector(c, reach)];
}

/** Each count, rounded down and never below one. */
export function clampRepeat(repeat: CellRepeat): CellRepeat {
  return [
    Math.max(1, Math.floor(repeat[0])),
    Math.max(1, Math.floor(repeat[1])),
    Math.max(1, Math.floor(repeat[2])),
  ];
}

function columnOf(matrix: readonly number[][], column: number): Vec3 {
  return [
    matrix[0]?.[column] ?? 0,
    matrix[1]?.[column] ?? 0,
    matrix[2]?.[column] ?? 0,
  ];
}

/** The twelve edges of a box, as pairs of its eight fractional corners. */
const BOX_EDGES: ReadonlyArray<
  readonly [
    readonly [number, number, number],
    readonly [number, number, number],
  ]
> = [
  [
    [0, 0, 0],
    [1, 0, 0],
  ],
  [
    [0, 1, 0],
    [1, 1, 0],
  ],
  [
    [0, 0, 1],
    [1, 0, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 1],
  ],
  [
    [0, 0, 0],
    [0, 1, 0],
  ],
  [
    [1, 0, 0],
    [1, 1, 0],
  ],
  [
    [0, 0, 1],
    [0, 1, 1],
  ],
  [
    [1, 0, 1],
    [1, 1, 1],
  ],
  [
    [0, 0, 0],
    [0, 0, 1],
  ],
  [
    [1, 0, 0],
    [1, 0, 1],
  ],
  [
    [0, 1, 0],
    [0, 1, 1],
  ],
  [
    [1, 1, 0],
    [1, 1, 1],
  ],
];
