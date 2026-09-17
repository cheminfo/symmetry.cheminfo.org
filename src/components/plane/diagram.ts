/**
 * The symmetry-element diagram of a plane group, placed in the plane.
 *
 * Everything here is derived from the element table the plane-group layer
 * computes — nothing is transcribed. A line is clipped to the block of cells
 * being drawn rather than to one cell, because a diagram whose mirrors stop at
 * the cell edge teaches that they stop there, which is the misconception the
 * picture exists to remove.
 */

import type { CrystalOperation, Lattice } from '../../symmetry/core/index.ts';
import type { PlaneElementTable } from '../../symmetry/planeElements.ts';
import { planeElementTable } from '../../symmetry/planeElements.ts';
import { cellShifts } from '../../symmetry/planeGroups.ts';

import { clipToBlock } from './clip.ts';
import type { PatternFrame } from './frame.ts';
import { patternFrame } from './frame.ts';
import { rotationGlyphPath } from './glyphs.ts';
import { round } from './precision.ts';
import { cellBasis } from './transforms.ts';

/** One rotation point, ready to draw. */
export interface DiagramGlyph {
  readonly key: string;
  /** n of the n-fold. */
  readonly order: number;
  /** Centre, y-up Cartesian. */
  readonly x: number;
  readonly y: number;
  /** Path data for a single filled `<path>`. */
  readonly path: string;
}

/** One mirror or glide line, clipped to the block of cells. */
export interface DiagramLine {
  readonly key: string;
  readonly kind: 'mirror' | 'glide';
  /** `m` or `g`, as the element table names it. */
  readonly symbol: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** One cell outline; the cell at the origin is the one drawn heavy. */
export interface DiagramCell {
  readonly key: string;
  /** Four corners, ready for a `<polygon points>`. */
  readonly points: string;
  readonly primary: boolean;
}

/** Everything a plane-group diagram draws. */
export interface PlaneDiagram {
  readonly glyphs: readonly DiagramGlyph[];
  readonly lines: readonly DiagramLine[];
  readonly cells: readonly DiagramCell[];
  readonly frame: PatternFrame;
}

/** How far a fractional coordinate may sit outside the block and still be in it. */
const TOLERANCE = 1e-9;

/**
 * The drawable diagram of one plane group, straight from its coset list.
 *
 * The element table is built over `2 × cells` lattice translations, not `cells`:
 * an element's location is the translation divided by the order of the
 * operation, so a half-turn centre a whole cell away comes from a shift of two.
 * Ask for fewer and the diagram silently loses the centres along two of its
 * edges.
 *
 * @param operations - From `wallpaperOperations` or `friezeOperations`.
 * @param lattice - From `patternLattice(latticeCell(group.lattice, size))`.
 * @param cells - How many cells along each direction. @default 2
 * @param padding - Space left around the block, in the lattice's units. @default 0
 */
export function planeDiagramOf(
  operations: ReadonlyArray<CrystalOperation<2>>,
  lattice: Lattice,
  cells = 2,
  padding = 0,
): PlaneDiagram {
  const table = planeElementTable(operations, cellShifts(2 * cells));
  return planeDiagram(table, lattice, cells, padding);
}

/**
 * The drawable diagram of a plane group whose element table is already built.
 *
 * @param table - From `planeElementTable(operations, cellShifts(2 * cells))`.
 * @param lattice - From `patternLattice(latticeCell(group.lattice, size))`.
 * @param cells - How many cells along each direction. @default 2
 * @param padding - Space left around the block, in the lattice's units. @default 0
 */
export function planeDiagram(
  table: PlaneElementTable,
  lattice: Lattice,
  cells = 2,
  padding = 0,
): PlaneDiagram {
  const basis = cellBasis(lattice);
  const scale = Math.hypot(basis[0], basis[2]);
  return {
    glyphs: diagramGlyphs(table, basis, cells, scale),
    lines: diagramLines(table, basis, cells),
    cells: diagramCells(basis, cells),
    frame: patternFrame(lattice, cells, cells, padding),
  };
}

/** The rotation points inside the block, as glyph paths. */
function diagramGlyphs(
  table: PlaneElementTable,
  basis: readonly [number, number, number, number],
  cells: number,
  scale: number,
): DiagramGlyph[] {
  const glyphs: DiagramGlyph[] = [];
  for (const rotation of table.rotations) {
    const [u, v] = rotation.point;
    if (!inBlock(u, cells) || !inBlock(v, cells)) continue;
    const x = round(basis[0] * u + basis[1] * v);
    const y = round(basis[2] * u + basis[3] * v);
    glyphs.push({
      key: `${rotation.order}@${u},${v}`,
      order: rotation.order,
      x,
      y,
      path: rotationGlyphPath(rotation.order, x, y, scale),
    });
  }
  return glyphs;
}

/** Every mirror and glide line of the table, clipped to the block. */
function diagramLines(
  table: PlaneElementTable,
  basis: readonly [number, number, number, number],
  cells: number,
): DiagramLine[] {
  const lines: DiagramLine[] = [];
  for (const line of table.lines) {
    const segment = clipToBlock(line, cells);
    if (segment === null) continue;
    const [u1, v1, u2, v2] = segment;
    lines.push({
      key: `${line.symbol}@${line.normal.join(',')}=${line.offset}`,
      kind: line.kind,
      symbol: line.symbol,
      x1: round(basis[0] * u1 + basis[1] * v1),
      y1: round(basis[2] * u1 + basis[3] * v1),
      x2: round(basis[0] * u2 + basis[1] * v2),
      y2: round(basis[2] * u2 + basis[3] * v2),
    });
  }
  return lines;
}

/** One outline per cell of the block, the one at the origin marked. */
function diagramCells(
  basis: readonly [number, number, number, number],
  cells: number,
): DiagramCell[] {
  const outlines: DiagramCell[] = [];
  for (let v = 0; v < cells; v++) {
    for (let u = 0; u < cells; u++) {
      const corners: string[] = [];
      const offsets = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ];
      for (const offset of offsets) {
        const uu = u + (offset[0] ?? 0);
        const vv = v + (offset[1] ?? 0);
        corners.push(
          `${round(basis[0] * uu + basis[1] * vv)},${round(basis[2] * uu + basis[3] * vv)}`,
        );
      }
      outlines.push({
        key: `${u}:${v}`,
        points: corners.join(' '),
        primary: u === 0 && v === 0,
      });
    }
  }
  return outlines;
}

/** Whether a fractional coordinate lies in `[0, cells]`. */
function inBlock(value: number, cells: number): boolean {
  return value >= -TOLERANCE && value <= cells + TOLERANCE;
}
