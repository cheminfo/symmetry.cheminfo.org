/**
 * From the cell on the workbench to what the 3D view draws.
 *
 * Nothing here is React and nothing here is molstar: it reads the draft and the
 * setting, runs the exact expansion, and returns plain data. The page then hands
 * that to `ViewerPanel`, which is the only thing that knows there is a canvas.
 *
 * The atoms are expanded **here**, never by molstar: its space-group expansion
 * neither wraps into the cell nor deduplicates a special position, so every
 * atom of halite would be drawn 48 times on top of itself.
 *
 * What the cell holds is exact and settled by the crystallography. How much of
 * it is drawn, and how large, is a separate question, and it is answered in
 * `crystalElementLayers.ts`.
 */

import type { CrystalDraft } from '../../crystal/draft.ts';
import type { ExpandedAtom, SiteReport } from '../../crystal/expand.ts';
import {
  cellComposition,
  describeSites,
  expandStructure,
} from '../../crystal/expand.ts';
import type { SpaceGroupSetting } from '../../data/spaceGroups.ts';
import type {
  CrystalOperation,
  Lattice,
  SymmetryElement,
} from '../../symmetry/core/index.ts';
import {
  createLattice,
  elementKey,
  elementPoint,
  fractionalToCartesian,
  symmetryElements,
} from '../../symmetry/core/index.ts';
import { spaceGroupOperations } from '../../symmetry/spaceGroups.ts';
import type { CellShift, ViewerAtom } from '../../viewer/core.ts';
import { NO_SHIFT, cellShifts, supercellAtoms } from '../../viewer/core.ts';

/** Everything one cell is, derived from the draft and the setting in force. */
export interface CrystalAnalysis {
  readonly setting: SpaceGroupSetting;
  readonly lattice: Lattice;
  /** The coset list, centring included. */
  readonly operations: ReadonlyArray<CrystalOperation<3>>;
  /** Every atom of one cell, fractional, each knowing where it came from. */
  readonly atoms: readonly ExpandedAtom[];
  /** One line per site of the asymmetric unit. */
  readonly sites: readonly SiteReport[];
  /** Atoms of each element in one cell, counting occupancy. */
  readonly composition: ReadonlyMap<string, number>;
  /** Every distinct symmetry element of the cell. */
  readonly elements: readonly SymmetryElement[];
  /**
   * Which cell each of them is drawn in, keyed by `elementKey`.
   *
   * An element reported through the origin may only graze the cell there —
   * three of the nine mirror planes of `Pm-3m` do — and is drawn one lattice
   * translation over, where it cuts it. The list beside the view reads the
   * same map, so the row and the rod always name the same place.
   */
  readonly shifts: ReadonlyMap<string, CellShift>;
}

/**
 * The cell, filled.
 *
 * @param draft - The structure on the workbench.
 * @param setting - The setting in force.
 * @throws When the cell's three angles describe no cell.
 */
export function analyseCrystal(
  draft: CrystalDraft,
  setting: SpaceGroupSetting,
): CrystalAnalysis {
  const operations = spaceGroupOperations(setting);
  const atoms = expandStructure(draft.sites, operations);
  const lattice = createLattice(draft.cell);
  const elements = symmetryElements(operations);
  return {
    setting,
    lattice,
    operations,
    atoms,
    sites: describeSites(draft.sites, operations),
    composition: cellComposition(atoms),
    elements,
    shifts: cellShifts(elements, lattice, elementKey),
  };
}

/**
 * Where one element is drawn, as fractional coordinates of the cell.
 *
 * @param analysis - What {@link analyseCrystal} returned.
 * @param element - One of its elements.
 */
export function drawnElementPoint(
  analysis: CrystalAnalysis,
  element: SymmetryElement,
): number[] {
  const shift = analysis.shifts.get(elementKey(element)) ?? NO_SHIFT;
  const point = elementPoint(element);
  const moved: number[] = [];
  for (let index = 0; index < 3; index++) {
    moved.push((point[index] ?? 0) + (shift[index] ?? 0));
  }
  return moved;
}

/**
 * The atoms the scene draws, in Cartesian ångström.
 *
 * @param analysis - What {@link analyseCrystal} returned.
 * @param cells - Cells along each axis.
 * @param asymmetricUnitOnly - Draw the sites as typed rather than the orbit they
 *   generate, which is what the *Asymmetric unit* layer asks for.
 *   @default false
 */
export function crystalAtoms(
  analysis: CrystalAnalysis,
  cells: number,
  asymmetricUnitOnly = false,
): ViewerAtom[] {
  const wanted = asymmetricUnitOnly
    ? analysis.atoms.filter((atom) => atom.operationIndex === 0)
    : analysis.atoms;
  const oneCell: ViewerAtom[] = [];
  for (const atom of wanted) {
    const point = fractionalToCartesian(analysis.lattice, atom.position);
    oneCell.push({
      element: atom.element,
      position: [point[0] ?? 0, point[1] ?? 0, point[2] ?? 0],
    });
  }
  return supercellAtoms(oneCell, analysis.lattice.cell, [cells, cells, cells]);
}
