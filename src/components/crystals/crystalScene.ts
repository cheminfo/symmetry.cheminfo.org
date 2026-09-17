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
  fractionalToCartesian,
  symmetryElements,
} from '../../symmetry/core/index.ts';
import type { Vec3 } from '../../symmetry/point/vec3.ts';
import {
  addVectors,
  dotProduct,
  normalizeVector,
  scaleVector,
  subtractVectors,
} from '../../symmetry/point/vec3.ts';
import { spaceGroupOperations } from '../../symmetry/spaceGroups.ts';
import type { SymmetryDrawing, ViewerAtom } from '../../viewer/core.ts';
import { crystalElementDrawing, supercellAtoms } from '../../viewer/core.ts';

import { elementLabel } from './crystalLabels.ts';

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
  return {
    setting,
    lattice: createLattice(draft.cell),
    operations,
    atoms,
    sites: describeSites(draft.sites, operations),
    composition: cellComposition(atoms),
    elements: symmetryElements(operations),
  };
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
 * Each is **slid along its own locus until it is centred on the cell**. An
 * axis is a line and a plane is a plane, so moving a drawing along one changes
 * nothing about which element it is — but drawing a rod centred on the point
 * the decomposition happens to report puts most of it outside the cell, and
 * fifty of them then drag the camera off the structure entirely.
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
  const centre = cartesianPoint(analysis, [0.5, 0.5, 0.5]);
  const drawings: SymmetryDrawing[] = [];
  for (const element of analysis.elements) {
    if (!drawsKind(element, layers)) continue;
    const drawing = crystalElementDrawing(element, analysis.lattice, {
      id: elementKey(element),
      label: elementLabel(element),
      length: longest,
      size: shortest * 0.55,
    });
    if (drawing !== null) drawings.push(centreOnCell(drawing, centre));
  }
  return drawings;
}

/**
 * How many elements may be drawn before their names are left off.
 *
 * Fifty labelled rods through one cell is a wall of text, and the label of an
 * element nobody can pick out of it says nothing. The list beside the view
 * names every one of them whatever is on screen.
 */
export const LABEL_LIMIT = 24;

/** The Cartesian position of a fractional point of the cell. */
function cartesianPoint(
  analysis: CrystalAnalysis,
  fractional: readonly number[],
): Vec3 {
  const point = fractionalToCartesian(analysis.lattice, fractional);
  return [point[0] ?? 0, point[1] ?? 0, point[2] ?? 0];
}

/** The same element, drawn where it crosses the middle of the cell. */
function centreOnCell(drawing: SymmetryDrawing, centre: Vec3): SymmetryDrawing {
  switch (drawing.kind) {
    case 'rotation':
    case 'screw':
    case 'rotoinversion': {
      const direction = normalizeVector(drawing.direction);
      const along = dotProduct(
        subtractVectors(centre, drawing.point),
        direction,
      );
      return {
        ...drawing,
        point: addVectors(drawing.point, scaleVector(direction, along)),
      };
    }
    case 'mirror':
    case 'glide': {
      const normal = normalizeVector(drawing.normal);
      const off = dotProduct(subtractVectors(centre, drawing.point), normal);
      return {
        ...drawing,
        point: subtractVectors(centre, scaleVector(normal, off)),
      };
    }
    case 'inversion': {
      return drawing;
    }
    // no default
  }
}

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
