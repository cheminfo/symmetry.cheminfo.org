import { FRIEZE_GROUPS } from '../data/friezeGroups.ts';
import { WALLPAPER_GROUPS } from '../data/planeGroups.ts';

import type { CrystalOperation, Lattice, UnitCell2D } from './core/index.ts';
import {
  closure,
  createLattice,
  identityOperation,
  liftCell,
  parseOperation,
} from './core/index.ts';

/** The five two-dimensional Bravais lattices. */
export type PlaneLattice =
  'oblique' | 'rectangular' | 'centred-rectangular' | 'square' | 'hexagonal';

/** One of the seventeen wallpaper groups. */
export interface WallpaperGroup {
  /** International Tables plane-group number, 1–17: the stable sort order. */
  readonly number: number;
  /** IUCr short symbol, lowercase ASCII; what `/wallpaper/<id>` carries. */
  readonly id: string;
  /** Full Hermann–Mauguin symbol: `p4gm` where the short one is `p4g`. */
  readonly full: string;
  /** Conway–Thurston orbifold symbol. */
  readonly orbifold: string;
  readonly lattice: PlaneLattice;
  /** The two-dimensional point group, as {@link pointGroupName} derives it. */
  readonly pointGroup: string;
  /** Operations per conventional cell, the centring included. */
  readonly operationsPerCell: number;
  /** Generators, `;`-separated triplets. The lattice translations — and `t(1/2,1/2)` on a centred lattice — are implicit. */
  readonly generators: string;
  /** The International Tables coordinate list: a second transcription the tests check against the first. */
  readonly generalPositions: string;
  /** The asymmetric unit, in words. */
  readonly fundamentalDomain: string;
  /** Where the pattern occurs, and what it is worth pointing at. */
  readonly example: string;
}

/** One of the seven frieze groups: a strip of period 1 along **a**, unbounded across. */
export interface FriezeGroup {
  /** 1–7, in the order the International Tables list them. */
  readonly number: number;
  /** IUCr short symbol, lowercase ASCII; what `/frieze/<id>` carries. */
  readonly id: string;
  /** The three-slot symbol: `p112` where the short one is `p2`. */
  readonly full: string;
  /** Conway–Thurston orbifold symbol, with `∞` for the strip translation. */
  readonly orbifold: string;
  /** Conway's name: hop, step, sidle, jump, spinning hop, spinning sidle, spinning jump. */
  readonly conway: string;
  /** The two-dimensional point group. */
  readonly pointGroup: string;
  /** Operations per period. */
  readonly operationsPerPeriod: number;
  /** Generators, `;`-separated triplets; `t(1,0)` is implicit. */
  readonly generators: string;
  /** The coordinate list: the second transcription. */
  readonly generalPositions: string;
  /** The asymmetric unit, in words. */
  readonly fundamentalDomain: string;
  /** What it looks like. */
  readonly example: string;
}

/** The centring translation a `c` lattice carries, as a triplet. */
const CENTRING = 'x+1/2,y+1/2';

/**
 * Every coset representative of a plane group, modulo the lattice translations.
 *
 * The identity comes first, and an empty generator list gives p1 rather than a
 * three-dimensional group — which is what {@link closure} alone would return,
 * since it reads the dimension off the first generator.
 */
export function expandPlaneGroup(
  generators: ReadonlyArray<CrystalOperation<2>>,
): Array<CrystalOperation<2>> {
  return closure<2>([identityOperation(2), ...generators]);
}

/** The operations `;`-separated triplets name; an empty string is no operation at all. */
export function parsePlaneOperations(
  triplets: string,
): Array<CrystalOperation<2>> {
  const operations: Array<CrystalOperation<2>> = [];
  for (const triplet of triplets.split(';')) {
    if (triplet.trim().length > 0) operations.push(parseOperation(triplet, 2));
  }
  return operations;
}

/**
 * The full coset list of a wallpaper group, the centring included.
 *
 * Expanded from the generators, never from {@link WallpaperGroup.generalPositions}:
 * the two are independent transcriptions of the same group and the tests compare
 * them, which is what catches a mistyped generator.
 */
export function wallpaperOperations(
  group: WallpaperGroup,
): Array<CrystalOperation<2>> {
  const generators = parsePlaneOperations(group.generators);
  if (group.lattice === 'centred-rectangular') {
    generators.push(parseOperation(CENTRING, 2));
  }
  return expandPlaneGroup(generators);
}

/** The operations of one period of a frieze group. */
export function friezeOperations(
  group: FriezeGroup,
): Array<CrystalOperation<2>> {
  return expandPlaneGroup(parsePlaneOperations(group.generators));
}

/**
 * One of the seventeen, by short or full symbol: `p4g` and `p4gm` are the same
 * group, and a student types either.
 */
export function wallpaperById(id: string): WallpaperGroup | undefined {
  const wanted = id.toLowerCase();
  return WALLPAPER_GROUPS.find(
    (group) => group.id === wanted || group.full === wanted,
  );
}

/** One of the seven, by short or full symbol. */
export function friezeById(id: string): FriezeGroup | undefined {
  const wanted = id.toLowerCase();
  return FRIEZE_GROUPS.find(
    (group) => group.id === wanted || group.full === wanted,
  );
}

/**
 * A cell the lattice actually allows, for drawing and for the geometry tests.
 *
 * **The hexagonal cell is γ = 120°, never 60°.** At 60° the conjugated matrix of
 * a 3-fold comes out sheared rather than a rotation, `det` is still 1, and the
 * picture merely looks wrong — {@link isOrthogonal} is what catches it.
 *
 * @param lattice - Which of the five.
 * @param size - Length of **a**, in the caller's units. @default 1
 */
export function latticeCell(lattice: PlaneLattice, size = 1): UnitCell2D {
  switch (lattice) {
    case 'oblique':
      return { a: size, b: size * 1.25, gamma: 105 };
    case 'rectangular':
    case 'centred-rectangular':
      return { a: size, b: size * 0.75, gamma: 90 };
    case 'square':
      return { a: size, b: size, gamma: 90 };
    case 'hexagonal':
      return { a: size, b: size, gamma: 120 };
    default:
      throw new RangeError(`there is no ${String(lattice)} plane lattice`);
  }
}

/**
 * The cell with everything derived from it computed once, so the conjugation
 * below does not re-invert a matrix per operation.
 */
export function planeLattice(cell: UnitCell2D): Lattice {
  return createLattice(liftCell(cell));
}

/**
 * The operation's linear part in Cartesian coordinates, row-major
 * `[l00, l01, l10, l11]`: `L = M · W · M⁻¹`.
 *
 * `W` is a shear in any basis but the Cartesian one, so this is what a renderer
 * needs and what an SVG `matrix(…)` carries. On a cell the lattice allows, `L`
 * is always a rotation or a reflection.
 */
export function cartesianLinear(
  operation: CrystalOperation<2>,
  lattice: Lattice,
): [number, number, number, number] {
  const linear: number[] = [0, 0, 0, 0];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      let sum = 0;
      for (let k = 0; k < 2; k++) {
        for (let l = 0; l < 2; l++) {
          sum +=
            (lattice.cartesian[i]?.[k] ?? 0) *
            (operation.rotation[k]?.[l] ?? 0) *
            (lattice.fractional[l]?.[j] ?? 0);
        }
      }
      linear[i * 2 + j] = sum;
    }
  }
  return [linear[0] ?? 0, linear[1] ?? 0, linear[2] ?? 0, linear[3] ?? 0];
}

/**
 * Whether `L · Lᵀ = I`, i.e. whether the Cartesian linear part is an isometry.
 *
 * @param linear - From {@link cartesianLinear}.
 * @param tolerance - How far each entry may sit from the identity. @default 1e-9
 */
export function isOrthogonal(
  linear: readonly [number, number, number, number],
  tolerance = 1e-9,
): boolean {
  const [a, b, c, d] = linear;
  return (
    Math.abs(a * a + b * b - 1) <= tolerance &&
    Math.abs(c * c + d * d - 1) <= tolerance &&
    Math.abs(a * c + b * d) <= tolerance
  );
}

/**
 * The lattice translations of a square block of cells, `(0,0)` first — what a
 * diagram passes to {@link symmetryElements} so its lines continue past the cell
 * edge instead of stopping at it.
 *
 * @param count - How many cells beyond the first, in each direction. @default 1
 */
export function cellShifts(count = 1): number[][] {
  const shifts: number[][] = [];
  for (let u = 0; u <= count; u++) {
    for (let v = 0; v <= count; v++) shifts.push([u, v]);
  }
  return shifts;
}
