/**
 * More than one cell of it.
 *
 * The stack is n×n×n and starts at cell `0`, which is the bug the old site had:
 * its loop started the first axis at 1 while the other two started at 0, and its
 * own `if (!a && !b && !c) continue` guard — dead code — shows 0 was meant. A
 * 2×2×2 supercell therefore drew four of its eight cells.
 *
 * The atoms themselves are repeated by `supercellAtoms` in `src/viewer/core.ts`,
 * which works in Cartesian ångström and is what the scene wants. What is here is
 * what that does not say: the six parameters of the stack, how many atoms it
 * holds, and how large a stack this machine should be asked to draw.
 */

import type { UnitCell } from '../symmetry/core/index.ts';

/**
 * How many atoms the workbench draws before it stops growing the stack.
 *
 * The whole stack is rebuilt on every change — a cell edge, an atom, a group —
 * so the ceiling is what keeps a 4×4×4 of a 192-operation group from freezing
 * the page rather than drawing it.
 */
export const SUPERCELL_ATOM_CAP = 20000;

/**
 * The six parameters of the stack itself: the edges multiply, the angles do not.
 *
 * Its operations are **not** those of the cell it was built from — half of
 * `P2₁/c`'s stop being symmetry operations the moment `a` is doubled — so
 * nothing here claims a space group for it.
 *
 * @param cell - The cell being repeated.
 * @param cells - Cells along each axis; anything below 1 counts as 1.
 * @returns The stack's own cell.
 */
export function repeatCell(cell: UnitCell, cells: number): UnitCell {
  const count = wholeCells(cells);
  return {
    a: cell.a * count,
    b: cell.b * count,
    c: cell.c * count,
    alpha: cell.alpha,
    beta: cell.beta,
    gamma: cell.gamma,
  };
}

/**
 * How many atoms the stack holds, without building it.
 *
 * @param atomsPerCell - Atoms in one cell, after the symmetry has filled it.
 * @param cells - Cells along each axis.
 */
export function repeatedAtomCount(atomsPerCell: number, cells: number): number {
  const count = wholeCells(cells);
  return atomsPerCell * count * count * count;
}

/**
 * The largest stack at or below the one asked for that stays under the ceiling.
 *
 * A cell of eight atoms reaches 4×4×4 and a cell of a thousand does not, so the
 * answer depends on the structure rather than on a number in the interface. The
 * page says which it drew when it is not the one asked for.
 *
 * @param atomsPerCell - Atoms in one cell.
 * @param cells - Cells along each axis the student asked for.
 * @param cap - Atoms the page will draw.
 *   @default SUPERCELL_ATOM_CAP
 * @returns Cells along each axis, never below 1 even when one cell is already
 *   over the ceiling: a structure is drawn whole or not at all.
 */
export function largestRepeatThatFits(
  atomsPerCell: number,
  cells: number,
  cap = SUPERCELL_ATOM_CAP,
): number {
  for (let count = wholeCells(cells); count > 1; count--) {
    if (repeatedAtomCount(atomsPerCell, count) <= cap) return count;
  }
  return 1;
}

/** Whole cells, one at the least. */
function wholeCells(cells: number): number {
  if (!Number.isFinite(cells)) return 1;
  return Math.max(1, Math.round(cells));
}
