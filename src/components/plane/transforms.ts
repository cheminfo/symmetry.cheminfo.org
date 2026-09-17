/**
 * Where every copy of the motif goes, as the `matrix(…)` an SVG `<use>` carries.
 *
 * The motif is authored once, in fractional cell coordinates, and the `<defs>`
 * group carries the cell matrix **M**; each copy then carries the Cartesian
 * isometry `L = M W M⁻¹` and the translation `M (w + n)`. Composing the two
 * gives `M (W p + w + n)` — the operation acting in the cell, drawn in the
 * plane — so the pattern is a true isometry pattern however sheared the cell is.
 */

import type {
  CrystalOperation,
  Lattice,
  UnitCell2D,
} from '../../symmetry/core/index.ts';
import {
  TWELFTHS_PER_CELL,
  matrixDeterminant,
} from '../../symmetry/core/index.ts';
import { cartesianLinear, planeLattice } from '../../symmetry/planeGroups.ts';

import { round } from './precision.ts';

/** One drawn copy of the motif: one coset representative, in one cell. */
export interface PatternCopy {
  /** Stable React key, `shift u : shift v : coset index`. */
  readonly key: string;
  /** The SVG `matrix(a b c d e f)` that carries the motif onto this copy. */
  readonly transform: string;
  /** Index into the coset list the copy came from. */
  readonly operation: number;
  /** The lattice translation, in whole cells. */
  readonly shift: readonly [number, number];
  /** `det W < 0`: the copy is the mirror image of the motif, not a turn of it. */
  readonly mirrored: boolean;
}

/**
 * Every copy the tiling draws, one per operation per cell.
 *
 * @param operations - The coset list, from `wallpaperOperations` or `friezeOperations`.
 * @param lattice - From {@link patternLattice}; built once, never per operation.
 * @param shifts - The lattice translations, from {@link tileShifts}.
 * @returns `operations.length × shifts.length` copies, cell by cell.
 */
export function patternCopies(
  operations: ReadonlyArray<CrystalOperation<2>>,
  lattice: Lattice,
  shifts: ReadonlyArray<readonly [number, number]>,
): PatternCopy[] {
  const copies: PatternCopy[] = [];
  for (const shift of shifts) {
    for (let index = 0; index < operations.length; index++) {
      const operation = operations[index];
      if (operation === undefined) continue;
      copies.push({
        key: `${shift[0]}:${shift[1]}:${index}`,
        transform: copyTransform(operation, lattice, shift),
        operation: index,
        shift,
        mirrored: matrixDeterminant(operation.rotation) < 0,
      });
    }
  }
  return copies;
}

/** The cell, with M and M⁻¹ computed once for the whole drawing. */
export function patternLattice(cell: UnitCell2D): Lattice {
  return planeLattice(cell);
}

/**
 * The transform of one copy: the Cartesian linear part, then the translation.
 *
 * @param operation - One coset representative.
 * @param lattice - From {@link patternLattice}.
 * @param shift - The lattice translation, in whole cells.
 * @returns `matrix(a b c d e f)`, which SVG reads as `x' = a x + c y + e`.
 */
export function copyTransform(
  operation: CrystalOperation<2>,
  lattice: Lattice,
  shift: readonly [number, number],
): string {
  const [l00, l01, l10, l11] = cartesianLinear(operation, lattice);
  const basis = cellBasis(lattice);
  const fx = (operation.translation[0] ?? 0) / TWELFTHS_PER_CELL + shift[0];
  const fy = (operation.translation[1] ?? 0) / TWELFTHS_PER_CELL + shift[1];
  const tx = basis[0] * fx + basis[1] * fy;
  const ty = basis[2] * fx + basis[3] * fy;
  return matrixOf([l00, l10, l01, l11, tx, ty]);
}

/** The `matrix(…)` that carries a fractional drawing into the plane: **M** itself. */
export function basisTransform(lattice: Lattice): string {
  const [m00, m01, m10, m11] = cellBasis(lattice);
  return matrixOf([m00, m10, m01, m11, 0, 0]);
}

/** **M** as the row-major 2×2 `[m00, m01, m10, m11]`: its columns are **a** and **b**. */
export function cellBasis(lattice: Lattice): [number, number, number, number] {
  const rows = lattice.cartesian;
  return [
    rows[0]?.[0] ?? 0,
    rows[0]?.[1] ?? 0,
    rows[1]?.[0] ?? 0,
    rows[1]?.[1] ?? 0,
  ];
}

/**
 * The lattice translations of a block of cells, row by row from the origin.
 *
 * @param columns - Cells along **a**. @default 1
 * @param rows - Cells along **b**; a frieze group passes 1. @default columns
 */
export function tileShifts(
  columns = 1,
  rows = columns,
): Array<readonly [number, number]> {
  const shifts: Array<readonly [number, number]> = [];
  for (let v = 0; v < rows; v++) {
    for (let u = 0; u < columns; u++) shifts.push([u, v]);
  }
  return shifts;
}
/** `matrix(a b c d e f)`, every entry rounded so the string is reproducible. */
function matrixOf(values: readonly number[]): string {
  const parts: string[] = [];
  for (const value of values) parts.push(String(round(value)));
  return `matrix(${parts.join(' ')})`;
}
