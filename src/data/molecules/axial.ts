import type { Vec3 } from '../../symmetry/point/vec3.ts';

import type { MoleculeAtom } from './build.ts';
import { expandSeed } from './build.ts';
import {
  cyclohexaneChair,
  direction,
  ethane,
  metallocene,
  phenylArm,
} from './frames.ts';
import { circumradius, crown8, pentagonalBipyramid } from './shapes.ts';
import type { MoleculeEntry } from './types.ts';
import { molecule } from './types.ts';

/** The molecules whose group is a conformation — where the tolerance is taught. */
export const AXIAL_MOLECULES: readonly MoleculeEntry[] = [
  molecule(
    {
      id: 'biphenyl',
      name: 'Biphenyl',
      formula: 'C12H10',
      pointGroup: 'D2',
      why: 'The 44° twist kills every mirror, so gas-phase biphenyl is chiral.',
      geometrySource:
        'Idealised regular rings; inter-ring C–C 1.49, ring C–C 1.397, C–H 1.084 Å, twist 44.4°.',
      smiles: 'c1ccc(-c2ccccc2)cc1',
    },
    biphenyl('D2', 44.4 / 2),
  ),
  molecule(
    {
      id: 'biphenyl-perpendicular',
      name: 'Biphenyl, rings perpendicular',
      formula: 'C12H10',
      pointGroup: 'D2d',
      why: 'At exactly 90° an S4 appears along the long axis, and the chirality goes.',
      geometrySource:
        'Idealised regular rings; inter-ring C–C 1.49, ring C–C 1.397, C–H 1.084 Å, twist 90°.',
      smiles: 'c1ccc(-c2ccccc2)cc1',
    },
    biphenyl('D2d', 45),
  ),
  molecule(
    {
      id: 'ethane-staggered',
      name: 'Ethane, staggered',
      formula: 'C2H6',
      pointGroup: 'D3d',
      why: 'At 60° three σd bisect the C2 axes and an S6 runs along C–C.',
      geometrySource: 'C–C 1.535, C–H 1.094 Å, H–C–C 111.2°, dihedral 60°.',
      smiles: 'CC',
    },
    ethane(60),
  ),
  molecule(
    {
      id: 'ethane-eclipsed',
      name: 'Ethane, eclipsed',
      formula: 'C2H6',
      pointGroup: 'D3h',
      why: 'At 0° the hydrogens line up and the plane between the carbons is σh.',
      geometrySource: 'C–C 1.535, C–H 1.094 Å, H–C–C 111.2°, dihedral 0°.',
      smiles: 'CC',
    },
    ethane(0),
  ),
  molecule(
    {
      id: 'ethane-skew',
      name: 'Ethane, at 30°',
      formula: 'C2H6',
      pointGroup: 'D3',
      why: 'Between the two, no mirror is left and only the rotations survive.',
      geometrySource: 'C–C 1.535, C–H 1.094 Å, H–C–C 111.2°, dihedral 30°.',
      smiles: 'CC',
    },
    ethane(30),
  ),
  molecule(
    {
      id: 'cyclohexane-chair',
      name: 'Cyclohexane, chair',
      formula: 'C6H12',
      pointGroup: 'D3d',
      why: 'The chair puts an S6 through the ring centre; the boat does not.',
      geometrySource:
        'Solved from C–C 1.536 Å and C–C–C 111.4°; C–H 1.094 Å, H–C–H idealised at 107.5°.',
      smiles: 'C1CCCCC1',
    },
    cyclohexaneChair(),
  ),
  molecule(
    {
      id: 'allene',
      name: 'Allene',
      formula: 'C3H4',
      pointGroup: 'D2d',
      why: 'The two CH2 planes are perpendicular, so the long axis is an S4, not a C4.',
      geometrySource: 'C=C 1.308, C–H 1.087 Å, H–C–H 118.2°.',
      smiles: 'C=C=C',
    },
    allene(),
  ),
  molecule(
    {
      id: 'sulfur-crown',
      name: 'Cyclooctasulfur',
      formula: 'S8',
      pointGroup: 'D4d',
      why: 'The crown is two squares turned 45°, so the S8 axis is improper.',
      geometrySource:
        'Solved from S–S 2.055 Å and S–S–S 108.0°: ring radius 2.3512, half-height 0.4962 Å.',
      smiles: 'S1SSSSSSS1',
    },
    crown8().map((position) => ({ element: 'S', position })),
  ),
  molecule(
    {
      id: 'ferrocene-eclipsed',
      name: 'Ferrocene, eclipsed',
      formula: 'C10H10Fe',
      pointGroup: 'D5h',
      why: 'The rings superimpose, so the plane between them is σh.',
      geometrySource: 'Fe–C 2.064, ring C–C 1.42, C–H 1.08 Å; ring offset 0°.',
    },
    metallocene('Fe', 0),
  ),
  molecule(
    {
      id: 'ferrocene-staggered',
      name: 'Ferrocene, staggered',
      formula: 'C10H10Fe',
      pointGroup: 'D5d',
      why: 'Offset by 36°, it gains an inversion centre and loses σh.',
      geometrySource: 'Fe–C 2.064, ring C–C 1.42, C–H 1.08 Å; ring offset 36°.',
    },
    metallocene('Fe', 36),
  ),
  molecule(
    {
      id: 'iodine-heptafluoride',
      name: 'Iodine heptafluoride',
      formula: 'IF7',
      pointGroup: 'D5h',
      why: 'A pentagonal bipyramid: five C2 in the equatorial plane, which is σh.',
      geometrySource: 'I–F axial 1.786, equatorial 1.858 Å.',
    },
    pentagonalBipyramid(1.858, 1.786)
      .map((position) => ({
        element: 'F',
        position,
      }))
      .concat([{ element: 'I', position: [0, 0, 0] }]),
  ),
  molecule(
    {
      id: 'cyclopentadienide',
      name: 'Cyclopentadienide',
      formula: 'C5H5',
      pointGroup: 'D5h',
      why: 'A flat aromatic five-ring: the ring plane is σh.',
      geometrySource: 'C–C 1.417, C–H 1.080 Å.',
      smiles: '[cH-]1cccc1',
    },
    expandSeed('D5h', [
      { element: 'C', position: [circumradius(5, 1.417), 0, 0] },
      { element: 'H', position: [circumradius(5, 1.417) + 1.08, 0, 0] },
    ]),
  ),
];

/** Two phenyl rings on one axis, turned by twice `halfTwist` from each other. */
function biphenyl(group: 'D2' | 'D2d', halfTwist: number): MoleculeAtom[] {
  const ipso: Vec3 = [0, 0, 1.49 / 2];
  const inPlane = direction(90, halfTwist);
  return expandSeed(group, phenylArm(ipso, [0, 0, 1], inPlane));
}

/** Allene, with its CH2 planes on the two σd of the standard orientation. */
function allene(): MoleculeAtom[] {
  const terminal: Vec3 = [0, 0, 1.308];
  const half = 118.2 / 2;
  const arm = direction(half, 45);
  return expandSeed('D2d', [
    { element: 'C', position: [0, 0, 0] },
    { element: 'C', position: terminal },
    {
      element: 'H',
      position: [1.087 * arm[0], 1.087 * arm[1], terminal[2] + 1.087 * arm[2]],
    },
  ]);
}
