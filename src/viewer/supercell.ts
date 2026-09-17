/**
 * The bridge from an expanded cell to the atom list the scene draws.
 *
 * The site applies its own operations — molstar's space-group expansion is
 * unusable here, since it neither wraps into the cell nor deduplicates a special
 * position, and it falls back to `P 1` without warning on settings this site
 * ships. So the atoms arrive already expanded, and all that is left is to repeat
 * them over the lattice.
 */

import { addVectors } from '../symmetry/point/vec3.ts';

import { cellAxes, latticeShifts } from './cellGeometry.ts';
import type { CellRepeat, UnitCell, ViewerAtom } from './types.ts';

/**
 * One cell's atoms, repeated over an n×n×n stack.
 *
 * @param atoms - The contents of one cell, Cartesian ångström.
 * @param cell - The six cell parameters.
 * @param repeat - Cells along a, b and c; anything below 1 counts as 1.
 * @returns The atoms of every cell, the original ones first.
 * @throws When the three angles describe no cell.
 */
export function supercellAtoms(
  atoms: readonly ViewerAtom[],
  cell: UnitCell,
  repeat: CellRepeat = [1, 1, 1],
): ViewerAtom[] {
  const shifts = latticeShifts(cellAxes(cell), repeat);
  if (shifts.length === 1) return [...atoms];
  const expanded: ViewerAtom[] = [];
  for (const shift of shifts) {
    for (const atom of atoms) {
      expanded.push({
        element: atom.element,
        position: addVectors(atom.position, shift),
      });
    }
  }
  return expanded;
}
