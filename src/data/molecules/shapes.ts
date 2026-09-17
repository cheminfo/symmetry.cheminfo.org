import type { Vec3 } from '../../symmetry/point/vec3.ts';

import { dedupePositions } from './build.ts';

const DEGREE = Math.PI / 180;

/** φ, which every icosahedral shape is built from. */
export const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

/** n points on a circle of radius r at height z, the first at azimuth `phase`. */
export function ring(n: number, r: number, z = 0, phase = 0): Vec3[] {
  const points: Vec3[] = [];
  for (let k = 0; k < n; k++) {
    const angle = (phase + (360 * k) / n) * DEGREE;
    points.push([r * Math.cos(angle), r * Math.sin(angle), z]);
  }
  return points;
}

/** The circumradius of a regular n-gon of the given side. */
export function circumradius(n: number, side: number): number {
  return side / (2 * Math.sin(Math.PI / n));
}

/**
 * n directions at `polar` degrees from **z**, at radius r — the ligands of a
 * pyramid, a cone of bonds about the principal axis.
 */
export function cone(
  n: number,
  polar: number,
  r: number,
  phase = 0,
  z = 0,
): Vec3[] {
  const height = z + r * Math.cos(polar * DEGREE);
  return ring(n, r * Math.sin(polar * DEGREE), height, phase);
}

/**
 * The angle from the principal axis that puts n equivalent bonds at `bondAngle`
 * to each other — how a pyramid is built from the H–N–H a table reports.
 */
export function conePolar(bondAngle: number, n: number): number {
  const neighbour = Math.cos((2 * Math.PI) / n);
  const cosine = Math.sqrt(
    (Math.cos(bondAngle * DEGREE) - neighbour) / (1 - neighbour),
  );
  return Math.acos(cosine) / DEGREE;
}

/** The four vertices of a regular tetrahedron at distance d, on the cube diagonals. */
export function tetrahedron(d: number): Vec3[] {
  const a = d / Math.sqrt(3);
  return [
    [a, a, a],
    [a, -a, -a],
    [-a, a, -a],
    [-a, -a, a],
  ];
}

/**
 * A regular tetrahedron with **two vertices in the xz plane and two in the yz
 * plane**, so that substituting one pair leaves a mirror and substituting three
 * leaves nothing. The frame `C1`, `Cs` and `C2v` substitution patterns are drawn
 * in.
 */
export function edgeTetrahedron(d: number): Vec3[] {
  const s = d / Math.sqrt(1.5);
  const h = 1 / Math.SQRT2;
  return [
    [s, 0, -s * h],
    [-s, 0, -s * h],
    [0, s, s * h],
    [0, -s, s * h],
  ];
}

/** The six vertices of an octahedron at distance d, along ±x, ±y and ±z. */
export function octahedron(d: number): Vec3[] {
  return [
    [d, 0, 0],
    [-d, 0, 0],
    [0, d, 0],
    [0, -d, 0],
    [0, 0, d],
    [0, 0, -d],
  ];
}

/** Three equatorial ligands at rEquatorial and two axial at ±rAxial. */
export function trigonalBipyramid(rEquatorial: number, rAxial: number): Vec3[] {
  return [...ring(3, rEquatorial, 0, 90), [0, 0, rAxial], [0, 0, -rAxial]];
}

/** Five equatorial ligands and two axial, the `D5h` of IF₇. */
export function pentagonalBipyramid(
  rEquatorial: number,
  rAxial: number,
): Vec3[] {
  return [...ring(5, rEquatorial, 0, 90), [0, 0, rAxial], [0, 0, -rAxial]];
}

/** Two squares of radius r at ±h, turned 45° from each other: the `D4d` shape. */
export function squareAntiprism(r: number, h: number): Vec3[] {
  return [...ring(4, r, h, 0), ...ring(4, r, -h, 45)];
}

/**
 * The `S₈` crown, solved from the two measured constraints.
 *
 * `S–S = 2.055 Å` and `S–S–S = 108.0°` give a ring radius of 2.3512 Å and a
 * half-height of 0.4962 Å — a ring 4.70 Å across and 0.99 Å deep, whose dihedral
 * comes out at 98.8° against the 98.5° reported for α-S₈.
 */
export function crown8(): Vec3[] {
  return squareAntiprism(2.3512, 0.4962);
}

/** The eight vertices of a cube of the given edge. */
export function cube(edge: number): Vec3[] {
  const a = edge / 2;
  const points: Vec3[] = [];
  for (const x of [a, -a]) {
    for (const y of [a, -a]) {
      for (const z of [a, -a]) points.push([x, y, z]);
    }
  }
  return points;
}

/** The twelve vertices of a regular icosahedron of circumradius R. */
export function icosahedron(R: number): Vec3[] {
  const s = R / Math.sqrt(1 + GOLDEN_RATIO * GOLDEN_RATIO);
  const points: Vec3[] = [];
  for (const a of [1, -1]) {
    for (const b of [1, -1]) {
      points.push(
        [0, a * s, b * GOLDEN_RATIO * s],
        [a * s, b * GOLDEN_RATIO * s, 0],
        [b * GOLDEN_RATIO * s, 0, a * s],
      );
    }
  }
  return points;
}

/** The twenty vertices of a regular dodecahedron of the given edge. */
export function dodecahedron(edge: number): Vec3[] {
  const s = edge / (2 / GOLDEN_RATIO);
  const points: Vec3[] = [];
  for (const a of [1, -1]) {
    for (const b of [1, -1]) {
      for (const c of [1, -1]) points.push([a * s, b * s, c * s]);
      points.push(
        [0, (a * s) / GOLDEN_RATIO, b * GOLDEN_RATIO * s],
        [(a * s) / GOLDEN_RATIO, b * GOLDEN_RATIO * s, 0],
        [b * GOLDEN_RATIO * s, 0, (a * s) / GOLDEN_RATIO],
      );
    }
  }
  return points;
}

/**
 * The sixty vertices of a truncated icosahedron of circumradius R: the even
 * permutations of `(0, ±1, ±3φ)`, `(±1, ±(2+φ), ±2φ)` and `(±2, ±(1+2φ), ±φ)`.
 */
export function truncatedIcosahedron(R: number): Vec3[] {
  const s = R / Math.sqrt(1 + 9 * GOLDEN_RATIO * GOLDEN_RATIO);
  const seeds: Vec3[] = [
    [0, 1, 3 * GOLDEN_RATIO],
    [1, 2 + GOLDEN_RATIO, 2 * GOLDEN_RATIO],
    [2, 1 + 2 * GOLDEN_RATIO, GOLDEN_RATIO],
  ];
  const points: Vec3[] = [];
  for (const [p, q, r] of seeds) {
    for (const sp of [1, -1]) {
      for (const sq of [1, -1]) {
        for (const sr of [1, -1]) {
          const v: Vec3 = [p * sp * s, q * sq * s, r * sr * s];
          points.push(
            [v[0], v[1], v[2]],
            [v[1], v[2], v[0]],
            [v[2], v[0], v[1]],
          );
        }
      }
    }
  }
  return dedupePositions(points);
}
