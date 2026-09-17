import type { Vec3 } from '../../symmetry/point/vec3.ts';
import {
  addVectors,
  crossProduct,
  normalizeVector,
  scaleVector,
  subtractVectors,
} from '../../symmetry/point/vec3.ts';

import type { MoleculeAtom } from './build.ts';
import { sp3Pair } from './build.ts';
import { circumradius, ring } from './shapes.ts';

const DEGREE = Math.PI / 180;

/**
 * Ethane at an arbitrary dihedral: 60° is staggered `D₃d`, 0° eclipsed `D₃h`,
 * anything else `D₃` — the cleanest demonstration in chemistry that a point
 * group belongs to a geometry and not to a molecule.
 */
export function ethane(dihedral: number): MoleculeAtom[] {
  const carbonCarbon = 1.535;
  const carbonHydrogen = 1.094;
  const angle = 111.2;
  const zCarbon = carbonCarbon / 2;
  // The H–C–C angle is measured from the C–C bond, which points at the other
  // carbon: the hydrogens lean away from it, so the height is a sum.
  const radius = carbonHydrogen * Math.sin(angle * DEGREE);
  const height = zCarbon + carbonHydrogen * Math.abs(Math.cos(angle * DEGREE));
  return [
    { element: 'C', position: [0, 0, zCarbon] },
    { element: 'C', position: [0, 0, -zCarbon] },
    ...ring(3, radius, height, 0).map(toHydrogen),
    ...ring(3, radius, -height, dihedral).map(toHydrogen),
  ];
}

/**
 * A metallocene. 0° is eclipsed and `D₅h`, 36° staggered and `D₅d`; ferrocene
 * is staggered in the gas phase and the barrier between them is 4 kJ/mol.
 */
export function metallocene(
  metal: string,
  offset: number,
  metalCarbon = 2.064,
): MoleculeAtom[] {
  const radius = circumradius(5, 1.42);
  const height = Math.sqrt(metalCarbon * metalCarbon - radius * radius);
  const hydrogenRadius = radius + 1.08;
  return [
    { element: metal, position: [0, 0, 0] },
    ...ring(5, radius, height, 0).map(toCarbon),
    ...ring(5, radius, -height, offset).map(toCarbon),
    ...ring(5, hydrogenRadius, height, 0).map(toHydrogen),
    ...ring(5, hydrogenRadius, -height, offset).map(toHydrogen),
  ];
}

/**
 * Cyclohexane in the chair, `D₃d`.
 *
 * The ring is solved rather than measured: six carbons alternating at `±h` on a
 * circle of radius r give `C–C² = r² + 4h²` and `cos(C–C–C) = 1 − 1.5 r²/C–C²`,
 * so the reported bond and angle fix both.
 */
export function cyclohexaneChair(
  bond = 1.536,
  angle = 111.4,
  carbonHydrogen = 1.094,
): MoleculeAtom[] {
  const radius = Math.sqrt(
    (bond * bond * (1 - Math.cos(angle * DEGREE))) / 1.5,
  );
  const height = Math.sqrt(bond * bond - radius * radius) / 2;
  const carbons = ring(6, radius, 0).map((position, index): Vec3 => [
    position[0],
    position[1],
    index % 2 === 0 ? height : -height,
  ]);
  const atoms: MoleculeAtom[] = carbons.map(toCarbon);
  for (let i = 0; i < 6; i++) {
    const pair = sp3Pair(
      carbons[i] as Vec3,
      carbons[(i + 1) % 6] as Vec3,
      carbons[(i + 5) % 6] as Vec3,
      carbonHydrogen,
      107.5,
    );
    atoms.push(toHydrogen(pair[0]), toHydrogen(pair[1]));
  }
  return atoms;
}

/**
 * Adamantane, `T_d`: four methine carbons on the tetrahedral directions at
 * `d/√3` and six methylene carbons at twice that along the cube axes, which is
 * the fragment of the diamond lattice the cage is.
 */
export function adamantane(bond = 1.54, carbonHydrogen = 1.09): MoleculeAtom[] {
  const u = bond / Math.sqrt(3);
  const methine: Vec3[] = [
    [u, u, u],
    [u, -u, -u],
    [-u, u, -u],
    [-u, -u, u],
  ];
  const methylene: Vec3[] = [
    [2 * u, 0, 0],
    [-2 * u, 0, 0],
    [0, 2 * u, 0],
    [0, -2 * u, 0],
    [0, 0, 2 * u],
    [0, 0, -2 * u],
  ];
  const atoms: MoleculeAtom[] = [...methine, ...methylene].map(toCarbon);
  for (const carbon of methine) {
    const outward = normalizeVector(carbon);
    atoms.push(
      toHydrogen(addVectors(carbon, scaleVector(outward, carbonHydrogen))),
    );
  }
  for (const carbon of methylene) {
    const bonded = methine.filter(
      (other) => distance(other, carbon) < bond * 1.05,
    );
    const pair = sp3Pair(
      carbon,
      bonded[0] as Vec3,
      bonded[1] as Vec3,
      carbonHydrogen,
      108,
    );
    atoms.push(toHydrogen(pair[0]), toHydrogen(pair[1]));
  }
  return atoms;
}

/**
 * A phenyl group attached at `ipso`, its ring running along `axis` and its plane
 * containing `inPlane` — the twist a biphenyl or a propeller is built from.
 *
 * The ipso carbon carries no hydrogen; the other five do, radially outward.
 */
export function phenylArm(
  ipso: Vec3,
  axis: Vec3,
  inPlane: Vec3,
  bond = 1.397,
  carbonHydrogen = 1.084,
): MoleculeAtom[] {
  const along = normalizeVector(axis);
  const across = normalizeVector(
    subtractVectors(inPlane, scaleVector(along, dot(inPlane, along))),
  );
  const centre = addVectors(ipso, scaleVector(along, bond));
  const atoms: MoleculeAtom[] = [];
  for (let k = 0; k < 6; k++) {
    const angle = k * 60 * DEGREE;
    const outward = addVectors(
      scaleVector(along, -Math.cos(angle)),
      scaleVector(across, Math.sin(angle)),
    );
    atoms.push(toCarbon(addVectors(centre, scaleVector(outward, bond))));
    if (k === 0) continue;
    atoms.push(
      toHydrogen(
        addVectors(centre, scaleVector(outward, bond + carbonHydrogen)),
      ),
    );
  }
  return atoms;
}

/** The unit vector `angle` degrees from **z**, at azimuth `azimuth`. */
export function direction(angle: number, azimuth = 0): Vec3 {
  const polar = angle * DEGREE;
  const around = azimuth * DEGREE;
  return [
    Math.sin(polar) * Math.cos(around),
    Math.sin(polar) * Math.sin(around),
    Math.cos(polar),
  ];
}

/** A perpendicular to `axis`, turned `twist` degrees about it from a fixed start. */
export function perpendicular(axis: Vec3, twist: number): Vec3 {
  const along = normalizeVector(axis);
  const seed: Vec3 = Math.abs(along[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const first = normalizeVector(crossProduct(along, seed));
  const second = crossProduct(along, first);
  return addVectors(
    scaleVector(first, Math.cos(twist * DEGREE)),
    scaleVector(second, Math.sin(twist * DEGREE)),
  );
}

function toCarbon(position: Vec3): MoleculeAtom {
  return { element: 'C', position };
}

function toHydrogen(position: Vec3): MoleculeAtom {
  return { element: 'H', position };
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
