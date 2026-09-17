import type { Vec3 } from '../../symmetry/point/vec3.ts';
import { addVectors, scaleVector } from '../../symmetry/point/vec3.ts';

import type { MoleculeAtom } from './build.ts';
import { expandSeed, planarBond } from './build.ts';
import { direction } from './frames.ts';
import { edgeTetrahedron } from './shapes.ts';

/** Four unit directions: two in the xz plane, two in the yz plane. */
const TETRAHEDRAL = edgeTetrahedron(1);

/** One substituent of the shared tetrahedral frame. */
export function substituent(
  element: string,
  index: number,
  bond: number,
): MoleculeAtom {
  return { element, position: scaleVector(TETRAHEDRAL[index] as Vec3, bond) };
}

/** One arm of a staggered tripod on the carbon at +z, leaning away from the other. */
export function tripod(
  element: string,
  bond: number,
  azimuth: number,
): MoleculeAtom {
  return {
    element,
    position: addVectors(
      [0, 0, 0.7675],
      scaleVector(direction(180 - 111.2, azimuth), bond),
    ),
  };
}

/** One arm of a bent AB2 drawn in the yz plane, so the C2 is z. */
export function bendArm(bond: number, angle: number): Vec3 {
  return scaleVector(direction(angle / 2, 90), bond);
}

/** SOCl2: the two chlorines straddle the xz plane and the oxygen lies in it. */
export function thionylChloride(): MoleculeAtom[] {
  const chlorine = direction(96.2 / 2, 90);
  const cosine =
    Math.cos((106.3 * Math.PI) / 180) / Math.cos((48.1 * Math.PI) / 180);
  const oxygen: Vec3 = [Math.sqrt(1 - cosine * cosine), 0, cosine];
  return [
    { element: 'S', position: [0, 0, 0] },
    { element: 'O', position: scaleVector(oxygen, 1.443) },
    { element: 'Cl', position: scaleVector(chlorine, 2.076) },
    {
      element: 'Cl',
      position: scaleVector([chlorine[0], -chlorine[1], chlorine[2]], 2.076),
    },
  ];
}

/** H2O2 at its gas-phase dihedral, with the C2 along z. */
export function hydrogenPeroxide(): MoleculeAtom[] {
  const half = 1.475 / 2;
  const oxygen: Vec3 = [half, 0, 0];
  const away = (180 - 94.8) * (Math.PI / 180);
  const twist = ((180 - 111.5) / 2) * (Math.PI / 180);
  const hydrogen = addVectors(
    oxygen,
    scaleVector(
      [
        Math.cos(away),
        Math.sin(away) * Math.cos(twist),
        Math.sin(away) * Math.sin(twist),
      ],
      0.95,
    ),
  );
  return expandSeed('C2', [
    { element: 'O', position: oxygen },
    { element: 'H', position: hydrogen },
  ]);
}

/** A 1,2-dichloroethene, drawn in the plane the group needs. */
export function dichloroethene(group: 'C2v' | 'C2h'): MoleculeAtom[] {
  const normal: Vec3 = group === 'C2v' ? [1, 0, 0] : [0, 0, 1];
  const carbon: Vec3 = group === 'C2v' ? [0, 1.339 / 2, 0] : [1.339 / 2, 0, 0];
  const other = scaleVector(carbon, -1);
  return expandSeed(group, [
    { element: 'C', position: carbon },
    { element: 'Cl', position: planarBond(carbon, other, 120, 1.73, normal) },
    { element: 'H', position: planarBond(carbon, other, -120, 1.08, normal) },
  ]);
}
