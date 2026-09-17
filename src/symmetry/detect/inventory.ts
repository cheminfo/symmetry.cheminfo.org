import type { Mat3 } from '../point/mat3.ts';
import { multiplyMatrices, transposeMatrix } from '../point/mat3.ts';
import type { Vec3 } from '../point/vec3.ts';
import {
  collinear,
  crossProduct,
  dotProduct,
  normalizeVector,
  scaleVector,
  subtractVectors,
  vectorDistance,
  vectorNorm,
} from '../point/vec3.ts';

/** One atom, as the detector sees it: an element and a position from the centroid. */
export interface DetectedAtom {
  readonly element: string;
  readonly position: Vec3;
}

/** An axis and the highest-order rotation found on it. */
export interface AxisFinding {
  readonly axis: Vec3;
  readonly order: number;
}

/** What the tolerance means, and how far a search goes. */
export interface DetectionOptions {
  /**
   * How far an atom may land from the atom it maps onto, in ångström, for an
   * atom 2 Å from the centre. It grows with the radius, because a misalignment
   * of a given angle displaces a distant atom further: a flat tolerance is
   * either too tight for a cage or too loose for a hydride.
   * @default 0.1
   */
  readonly tolerance?: number;
  /** The highest `Cₙ` a found matrix may stand for. @default 8 */
  readonly maxOrder?: number;
}

/** Every atom moved so the centroid, which every operation fixes, is the origin. */
export function centreAtoms(
  positions: readonly Vec3[],
  elements: readonly string[],
): DetectedAtom[] {
  if (positions.length !== elements.length) {
    throw new RangeError('every position needs an element symbol');
  }
  let x = 0;
  let y = 0;
  let z = 0;
  for (const position of positions) {
    x += position[0];
    y += position[1];
    z += position[2];
  }
  const count = positions.length || 1;
  const centre: Vec3 = [x / count, y / count, z / count];
  return positions.map((position, index) => ({
    element: elements[index] as string,
    position: subtractVectors(position, centre),
  }));
}

/**
 * Every matrix that could be a symmetry operation of this structure.
 *
 * An operation is fixed by where it sends **two** atoms: one reference atom `a`
 * and one atom `b` not on the same line through the centre. So every candidate
 * comes from a pair `(a′, b′)` at the same distances and the same angle, and
 * each pair gives exactly two matrices — one proper and one improper. Nothing
 * is guessed, so nothing is missed: the `C₃` of an icosahedron through a face,
 * which no axis through an atom or a pair of atoms points along, is found like
 * any other.
 */
export function candidateMatrices(
  atoms: readonly DetectedAtom[],
  tolerance: number,
): Mat3[] {
  const offCentre = atoms.filter(
    (atom) => vectorNorm(atom.position) > 10 * Number.EPSILON,
  );
  const first = chooseReference(offCentre);
  if (first === null) return [];
  const second = chooseSecond(offCentre, first);
  if (second === null) return [];
  const base = transposeMatrix(
    orthonormalFrame(first.position, second.position),
  );
  const radiusA = vectorNorm(first.position);
  const radiusB = vectorNorm(second.position);
  const angle = dotProduct(first.position, second.position);
  const slack = tolerance * (radiusA + radiusB + 2);
  const found: Mat3[] = [];
  for (const a of offCentre) {
    if (a.element !== first.element) continue;
    if (Math.abs(vectorNorm(a.position) - radiusA) > slack) continue;
    for (const b of offCentre) {
      if (b.element !== second.element) continue;
      if (Math.abs(vectorNorm(b.position) - radiusB) > slack) continue;
      if (Math.abs(dotProduct(a.position, b.position) - angle) > slack) {
        continue;
      }
      const frame = orthonormalFrame(a.position, b.position);
      if (frame === null) continue;
      found.push(
        multiplyMatrices(frame, base),
        multiplyMatrices(mirrored(frame), base),
      );
    }
  }
  return found;
}

/**
 * Whether the matrix maps every atom onto an atom of the same element.
 *
 * An atom at the centre is fixed by every operation, and still has to be of the
 * element it maps onto, which it is because it maps onto itself.
 */
export function mapsOnto(
  atoms: readonly DetectedAtom[],
  matrix: Mat3,
  tolerance: number,
): boolean {
  for (const atom of atoms) {
    const [x, y, z] = atom.position;
    const image: Vec3 = [
      matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z,
      matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z,
      matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z,
    ];
    const allowed = tolerance * Math.max(1, vectorNorm(atom.position) / 2);
    let hit = false;
    for (const other of atoms) {
      if (other.element !== atom.element) continue;
      if (vectorDistance(other.position, image) > allowed) continue;
      hit = true;
      break;
    }
    if (!hit) return false;
  }
  return true;
}

/** Whether every atom lies on one line, which the two continuous groups need. */
export function isLinear(atoms: readonly DetectedAtom[]): boolean {
  return collinear(atoms.map((atom) => atom.position));
}

/**
 * The reference atom: one of the rarest element at its distance, so that the
 * pair search has as few candidates as possible.
 */
function chooseReference(atoms: readonly DetectedAtom[]): DetectedAtom | null {
  let best: DetectedAtom | null = null;
  let fewest = Infinity;
  for (const atom of atoms) {
    let alike = 0;
    for (const other of atoms) {
      if (other.element !== atom.element) continue;
      if (
        Math.abs(vectorNorm(other.position) - vectorNorm(atom.position)) > 1e-3
      ) {
        continue;
      }
      alike++;
    }
    if (alike >= fewest) continue;
    fewest = alike;
    best = atom;
  }
  return best;
}

/** The second reference: the atom furthest from the line through the first. */
function chooseSecond(
  atoms: readonly DetectedAtom[],
  first: DetectedAtom,
): DetectedAtom | null {
  let best: DetectedAtom | null = null;
  let furthest = 1e-6;
  for (const atom of atoms) {
    const offLine = vectorNorm(crossProduct(first.position, atom.position));
    if (offLine <= furthest) continue;
    furthest = offLine;
    best = atom;
  }
  return best;
}

/** The frame `[û₁ û₂ û₃]` as columns, with û₁ along `a` and `b` in the û₁û₂ plane. */
function orthonormalFrame(a: Vec3, b: Vec3): Mat3 {
  const u1 = normalizeVector(a);
  const u2 = normalizeVector(
    subtractVectors(b, scaleVector(u1, dotProduct(b, u1))),
  );
  const u3 = crossProduct(u1, u2);
  return [
    [u1[0], u2[0], u3[0]],
    [u1[1], u2[1], u3[1]],
    [u1[2], u2[2], u3[2]],
  ];
}

/** The same frame with û₃ reversed, which turns a rotation into an improper one. */
function mirrored(frame: Mat3): Mat3 {
  return [
    [frame[0][0], frame[0][1], -frame[0][2]],
    [frame[1][0], frame[1][1], -frame[1][2]],
    [frame[2][0], frame[2][1], -frame[2][2]],
  ];
}
