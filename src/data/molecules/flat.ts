import type { Vec3 } from '../../symmetry/point/vec3.ts';
import { scaleVector } from '../../symmetry/point/vec3.ts';

import type { MoleculeAtom } from './build.ts';
import { expandSeed, planarBond } from './build.ts';
import { direction } from './frames.ts';
import { circumradius } from './shapes.ts';

/** The C–C distance of an aromatic ring, which is also its circumradius. */
export const BENZENE_RING = 1.397;

/** One atom on a ring of the given radius, at an azimuth in degrees. */
export function ringAtom(
  element: string,
  azimuth: number,
  radius: number,
): MoleculeAtom[] {
  return [{ element, position: scaleVector(direction(90, azimuth), radius) }];
}

/** Cyclopropane: the CH2 plane of each carbon is perpendicular to the ring. */
export function cyclopropane(): MoleculeAtom[] {
  const radius = circumradius(3, 1.51);
  const carbon: Vec3 = [radius, 0, 0];
  const half = (115.1 / 2) * (Math.PI / 180);
  return expandSeed('D3h', [
    { element: 'C', position: carbon },
    {
      element: 'H',
      position: [radius + 1.089 * Math.cos(half), 0, 1.089 * Math.sin(half)],
    },
  ]);
}

/** Ethene, drawn in the yz plane with the double bond along z. */
export function ethene(): MoleculeAtom[] {
  const carbon: Vec3 = [0, 0, 1.339 / 2];
  const other: Vec3 = [0, 0, -1.339 / 2];
  return expandSeed('D2h', [
    { element: 'C', position: carbon },
    {
      element: 'H',
      position: planarBond(carbon, other, (360 - 117.4) / 2, 1.087, [1, 0, 0]),
    },
  ]);
}

/** Diborane: the bridging hydrogens in the xz plane, the terminal ones in xy. */
export function diborane(): MoleculeAtom[] {
  const half = 1.77 / 2;
  const bridge = Math.sqrt(1.33 * 1.33 - half * half);
  const terminal = (121.5 / 2) * (Math.PI / 180);
  return expandSeed('D2h', [
    { element: 'B', position: [half, 0, 0] },
    { element: 'H', position: [0, 0, bridge] },
    {
      element: 'H',
      position: [
        half + 1.19 * Math.cos(terminal),
        1.19 * Math.sin(terminal),
        0,
      ],
    },
  ]);
}

/** Naphthalene as two regular hexagons sharing the bond along y. */
export function naphthalene(): MoleculeAtom[] {
  const bond = 1.4;
  const half = bond / 2;
  const offset = (bond * Math.sqrt(3)) / 2;
  const bridgehead: Vec3 = [0, half, 0];
  const alpha: Vec3 = [offset, bond, 0];
  const beta: Vec3 = [2 * offset, half, 0];
  return expandSeed('D2h', [
    { element: 'C', position: bridgehead },
    { element: 'C', position: alpha },
    { element: 'C', position: beta },
    { element: 'H', position: [offset, bond + 1.08, 0] },
    {
      element: 'H',
      position: [
        2 * offset + 1.08 * Math.cos(Math.PI / 6),
        half + 1.08 * Math.sin(Math.PI / 6),
        0,
      ],
    },
  ]);
}
