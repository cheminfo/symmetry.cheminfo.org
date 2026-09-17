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
import type {
  CellShift,
  ElementStyle,
  SymmetryDrawing,
  ViewerAtom,
} from '../../viewer/core.ts';
import {
  NO_SHIFT,
  cellShifts,
  crystalElementDrawing,
  supercellAtoms,
} from '../../viewer/core.ts';

import { elementBadge, elementLabel } from './crystalLabels.ts';

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

/** Which kinds of element are drawn. */
export interface CrystalLayers {
  readonly axes: boolean;
  readonly screws: boolean;
  readonly mirrors: boolean;
  readonly glides: boolean;
  readonly inversion: boolean;
  readonly improper: boolean;
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

/**
 * The symmetry elements the layers ask for, in Cartesian ångström.
 *
 * Each is **cut off at the cell**: an axis runs from where it enters the box to
 * where it leaves it, and a plane is drawn as the polygon it slices out of it.
 * That is what makes a cell full of elements readable — every rod ends on a
 * face, every plane shows exactly where it cuts — where rods of one arbitrary
 * length and squares hanging in the middle of the box read as a pile of sticks.
 *
 * The identity and the centring translations are elements with nothing to draw,
 * so they come back as `null` and are dropped.
 *
 * @param analysis - What {@link analyseCrystal} returned.
 * @param layers - Which kinds are drawn.
 */
export function crystalDrawings(
  analysis: CrystalAnalysis,
  layers: CrystalLayers,
): SymmetryDrawing[] {
  const { cell } = analysis.lattice;
  const shortest = Math.min(cell.a, cell.b, cell.c);
  const longest = Math.max(cell.a, cell.b, cell.c);
  const drawings: SymmetryDrawing[] = [];
  for (const element of analysis.elements) {
    if (!drawsKind(element, layers)) continue;
    const drawing = crystalElementDrawing(element, analysis.lattice, {
      id: elementKey(element),
      label: elementLabel(element),
      badge: elementBadge(element),
      clip: true,
      shift: analysis.shifts.get(elementKey(element)) ?? NO_SHIFT,
      length: longest,
      size: shortest * 0.55,
    });
    if (drawing !== null) drawings.push(drawing);
  }
  return drawings;
}

/**
 * How thick and how large the elements of this cell are drawn.
 *
 * Everything is a fraction of the shortest cell edge, so the same figure reads
 * the same on a 3.9 Å perovskite and a 24 Å zeolite. A fixed size in ångström
 * is a hairline on one and a wall of text on the other.
 *
 * @param analysis - What {@link analyseCrystal} returned.
 */
export function crystalElementStyle(analysis: CrystalAnalysis): ElementStyle {
  const { cell } = analysis.lattice;
  const shortest = Math.min(cell.a, cell.b, cell.c);
  return {
    axisRadius: shortest * 0.012,
    rimRadius: shortest * 0.007,
    arrowRadius: shortest * 0.032,
    arrowLength: shortest * 0.08,
    centreRadius: shortest * 0.04,
    labelSize: shortest * 0.26,
    labelGap: shortest * 0.09,
  };
}

/**
 * How many elements may be drawn before their names are left off.
 *
 * Fifty labelled rods through one cell is a wall of text, and the label of an
 * element nobody can pick out of it says nothing. The list beside the view
 * names every one of them whatever is on screen.
 */
export const LABEL_LIMIT = 24;

function drawsKind(element: SymmetryElement, layers: CrystalLayers): boolean {
  switch (element.kind) {
    case 'rotation': {
      return layers.axes;
    }
    case 'screw': {
      return layers.screws;
    }
    case 'rotoinversion': {
      return layers.improper;
    }
    case 'mirror': {
      return layers.mirrors;
    }
    case 'glide': {
      return layers.glides;
    }
    case 'inversion': {
      return layers.inversion;
    }
    case 'identity':
    case 'translation': {
      return false;
    }
    // no default
  }
}
