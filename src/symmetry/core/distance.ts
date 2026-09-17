import type { Lattice } from './lattice.ts';
import { quadraticForm } from './lattice.ts';

/**
 * The distance in Å between two fractional points, taken as written — no
 * periodic images. Use {@link minimumImageDistance} for a bond.
 */
export function fractionalDistance(
  lattice: Lattice,
  from: readonly number[],
  to: readonly number[],
): number {
  const delta = [
    (to[0] ?? 0) - (from[0] ?? 0),
    (to[1] ?? 0) - (from[1] ?? 0),
    (to[2] ?? 0) - (from[2] ?? 0),
  ];
  return Math.sqrt(quadraticForm(lattice.metric, delta));
}

/**
 * The shortest distance in Å between two fractional points over all lattice
 * translations.
 *
 * Wrapping each component into [−1/2, 1/2) is **not** enough on its own: for a
 * strongly oblique cell the nearest image can be a further cell away, so the
 * neighbouring images are searched too. `search = 1` — 27 images — is right for a
 * reduced cell; pass 2 when an angle sits outside 75°–105°, where a silently
 * too-long bond is exactly the failure this prevents.
 *
 * @param search - Half-width of the image search, in cells. @default 1
 */
export function minimumImageDistance(
  lattice: Lattice,
  from: readonly number[],
  to: readonly number[],
  search = 1,
): number {
  const delta = new Array<number>(3).fill(0);
  for (let index = 0; index < 3; index++) {
    const raw = (to[index] ?? 0) - (from[index] ?? 0);
    delta[index] = raw - Math.round(raw);
  }
  let best = Number.POSITIVE_INFINITY;
  for (let i = -search; i <= search; i++) {
    for (let j = -search; j <= search; j++) {
      for (let k = -search; k <= search; k++) {
        const squared = quadraticForm(lattice.metric, [
          (delta[0] ?? 0) + i,
          (delta[1] ?? 0) + j,
          (delta[2] ?? 0) + k,
        ]);
        if (squared < best) best = squared;
      }
    }
  }
  return Math.sqrt(best);
}
