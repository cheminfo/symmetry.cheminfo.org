/**
 * What the 3D view shows for a space group: a cell, the orbit of one point in
 * it, and the elements the group's operations are.
 *
 * A space group carries no cell of its own — a group is a symmetry, not a
 * measurement — so a step draws it on a cell the crystal system allows, wide
 * enough that a rod through the origin reaches past the box.
 */

import type { Lattice, UnitCell } from '../../symmetry/core/index.ts';
import {
  createLattice,
  fractionalToCartesian,
  orbit,
  symmetryElements,
} from '../../symmetry/core/index.ts';
import type { SpaceGroupSetting } from '../../symmetry/spaceGroups.ts';
import { spaceGroupOperations } from '../../symmetry/spaceGroups.ts';
import type { Point3, SymmetryDrawing, ViewerAtom } from '../../viewer/core.ts';
import { crystalElementDrawing } from '../../viewer/core.ts';
import type { ViewerScene } from '../viewer/index.ts';

/** Which layers of the cell the step draws. */
export interface CrystalSceneOptions {
  /** The edges of the cell. @default true */
  readonly unitCell?: boolean;
  /** Rotation axes. @default false */
  readonly axes?: boolean;
  /** Mirror planes. @default false */
  readonly mirrors?: boolean;
  /** Glide planes. @default false */
  readonly glides?: boolean;
  /** Screw axes. @default false */
  readonly screws?: boolean;
  /** Inversion centres and rotoinversion axes. @default false */
  readonly inversion?: boolean;
  /** The images of one general point. @default true */
  readonly orbit?: boolean;
  /** Whether each element is named on screen. @default true */
  readonly labels?: boolean;
}

/** The scene, and the numbers a caption reads off it. */
export interface CrystalSceneResult {
  readonly scene: ViewerScene;
  /** How many images the probe point has, which is the multiplicity. */
  readonly multiplicity: number;
  /** How many elements were drawn. */
  readonly elementCount: number;
}

/**
 * A point in no special position, so its orbit is the general one.
 *
 * Every component is irrational-looking on purpose: a probe at a half or a
 * quarter sits on an element of half the groups and reports a multiplicity that
 * is not the general one.
 */
export const PROBE_POINT: readonly number[] = [0.13, 0.21, 0.07];

/**
 * The scene for one setting of a space group.
 *
 * @param setting - What `spaceGroup(number, variant)` returned.
 * @param options - See {@link CrystalSceneOptions}.
 * @returns The scene, and what it holds.
 */
export function crystalScene(
  setting: SpaceGroupSetting,
  options: CrystalSceneOptions = {},
): CrystalSceneResult {
  const { unitCell = true, orbit: showOrbit = true, labels = true } = options;
  const cell = defaultCell(setting.crystalSystem);
  const lattice = createLattice(cell);
  const operations = spaceGroupOperations(setting);
  const images = orbit(PROBE_POINT, operations);
  const atoms: ViewerAtom[] = [];
  if (showOrbit) {
    for (const image of images) {
      atoms.push({
        element: PROBE_ELEMENT,
        position: cartesian(lattice, image.position),
      });
    }
  }

  const elements = crystalDrawings(operations, lattice, options, cell.a);
  return {
    multiplicity: images.length,
    elementCount: elements.length,
    scene: {
      atoms,
      cell: unitCell ? cell : null,
      elements,
      labels,
      representation: 'spacefill',
    },
  };
}

/**
 * A cell the crystal system allows, in ångström and degrees.
 *
 * The numbers are a drawing scale and nothing more: no space group fixes a cell
 * edge, and none of them is read back as a measurement anywhere.
 * @param system - The crystal system of the setting.
 * @returns A cell of the right metric shape.
 */
export function defaultCell(system: string): UnitCell {
  const right = { alpha: 90, beta: 90, gamma: 90 };
  switch (system) {
    case 'cubic': {
      return { a: 8, b: 8, c: 8, ...right };
    }
    case 'tetragonal': {
      return { a: 8, b: 8, c: 10, ...right };
    }
    case 'orthorhombic': {
      return { a: 8, b: 9.5, c: 11, ...right };
    }
    case 'monoclinic': {
      return { a: 8, b: 9.5, c: 11, alpha: 90, beta: 105, gamma: 90 };
    }
    case 'hexagonal':
    case 'trigonal': {
      return { a: 8, b: 8, c: 11, alpha: 90, beta: 90, gamma: 120 };
    }
    default: {
      return { a: 8, b: 9.5, c: 11, alpha: 98, beta: 105, gamma: 112 };
    }
  }
}

/** The element the probe point is drawn as: a noble gas, so it reads as a marker. */
const PROBE_ELEMENT = 'He';

function crystalDrawings(
  operations: Parameters<typeof symmetryElements>[0],
  lattice: Lattice,
  options: CrystalSceneOptions,
  edge: number,
): SymmetryDrawing[] {
  const wanted = {
    rotation: options.axes ?? false,
    screw: options.screws ?? false,
    mirror: options.mirrors ?? false,
    glide: options.glides ?? false,
    inversion: options.inversion ?? false,
    rotoinversion: options.inversion ?? false,
  };
  const drawings: SymmetryDrawing[] = [];
  let index = 0;
  for (const element of symmetryElements(operations)) {
    const drawing = crystalElementDrawing(element, lattice, {
      id: `element-${index++}`,
      length: 1.6 * edge,
      size: 1.2 * edge,
    });
    if (drawing !== null && wanted[drawing.kind]) drawings.push(drawing);
  }
  return drawings;
}

function cartesian(lattice: Lattice, position: readonly number[]): Point3 {
  const point = fractionalToCartesian(lattice, position);
  return [point[0] as number, point[1] as number, point[2] as number];
}
