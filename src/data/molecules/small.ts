import { scaleVector } from '../../symmetry/point/vec3.ts';

import {
  bendArm,
  dichloroethene,
  hydrogenPeroxide,
  substituent,
  thionylChloride,
  tripod,
} from './bent.ts';
import { expandSeed } from './build.ts';
import { direction } from './frames.ts';
import { conePolar } from './shapes.ts';
import type { MoleculeEntry } from './types.ts';
import { molecule } from './types.ts';

/** The molecules with one axis or none — where the flowchart is learnt. */
export const SMALL_MOLECULES: readonly MoleculeEntry[] = [
  molecule(
    {
      id: 'bromochlorofluoromethane',
      name: 'Bromochlorofluoromethane',
      formula: 'CHFClBr',
      pointGroup: 'C1',
      why: 'Four different substituents on one carbon leave no operation but E.',
      geometrySource:
        'Idealised tetrahedral carbon; C–H 1.09, C–F 1.35, C–Cl 1.77, C–Br 1.94 Å.',
      smiles: '[C@H](F)(Cl)Br',
    },
    [
      { element: 'C', position: [0, 0, 0] },
      substituent('H', 0, 1.09),
      substituent('F', 1, 1.35),
      substituent('Cl', 2, 1.77),
      substituent('Br', 3, 1.94),
    ],
  ),
  molecule(
    {
      id: 'bromochloromethane',
      name: 'Bromochloromethane',
      formula: 'CH2ClBr',
      pointGroup: 'Cs',
      why: 'One plane holds C, Cl and Br and bisects the two hydrogens.',
      geometrySource:
        'Idealised tetrahedral carbon; C–H 1.09, C–Cl 1.77, C–Br 1.94 Å.',
      smiles: 'ClCBr',
    },
    [
      { element: 'C', position: [0, 0, 0] },
      substituent('Cl', 0, 1.77),
      substituent('Br', 1, 1.94),
      substituent('H', 2, 1.09),
      substituent('H', 3, 1.09),
    ],
  ),
  molecule(
    {
      id: 'thionyl-chloride',
      name: 'Thionyl chloride',
      formula: 'SOCl2',
      pointGroup: 'Cs',
      why: 'The pyramid keeps one plane, through S and O, and nothing else.',
      geometrySource: 'S–O 1.443, S–Cl 2.076 Å; O–S–Cl 106.3°, Cl–S–Cl 96.2°.',
    },
    thionylChloride(),
  ),
  molecule(
    {
      id: 'meso-dichlorodifluoroethane',
      name: 'anti meso-1,2-dichloro-1,2-difluoroethane',
      formula: 'C2H2F2Cl2',
      pointGroup: 'Ci',
      why: 'The anti conformer maps onto itself only through the C–C midpoint.',
      geometrySource:
        'Idealised staggered tripods; C–C 1.535, C–H 1.094, C–F 1.38, C–Cl 1.77 Å, H–C–C 111.2°.',
    },
    expandSeed('Ci', [
      { element: 'C', position: [0, 0, 0.7675] },
      tripod('H', 1.094, 0),
      tripod('F', 1.38, 120),
      tripod('Cl', 1.77, 240),
    ]),
  ),
  molecule(
    {
      id: 'hydrogen-peroxide',
      name: 'Hydrogen peroxide',
      formula: 'H2O2',
      pointGroup: 'C2',
      why: 'The skew dihedral leaves a C2 through the O–O midpoint and no plane.',
      geometrySource: 'O–O 1.475, O–H 0.950 Å; O–O–H 94.8°, dihedral 111.5°.',
      smiles: 'OO',
    },
    hydrogenPeroxide(),
  ),
  molecule(
    {
      id: 'water',
      name: 'Water',
      formula: 'H2O',
      pointGroup: 'C2v',
      why: 'A bent AB2: the C2 runs through O, and both planes hold it.',
      geometrySource: 'O–H 0.9572 Å, H–O–H 104.52°; drawn in the yz plane.',
      smiles: 'O',
    },
    expandSeed('C2v', [
      { element: 'O', position: [0, 0, 0] },
      { element: 'H', position: bendArm(0.9572, 104.52) },
    ]),
  ),
  molecule(
    {
      id: 'sulfur-dioxide',
      name: 'Sulfur dioxide',
      formula: 'SO2',
      pointGroup: 'C2v',
      why: 'Bent, like water, and wider: the lone pair still leaves the C2.',
      geometrySource: 'S–O 1.431 Å, O–S–O 119.0°.',
      smiles: 'O=S=O',
    },
    expandSeed('C2v', [
      { element: 'S', position: [0, 0, 0] },
      { element: 'O', position: bendArm(1.431, 119) },
    ]),
  ),
  molecule(
    {
      id: 'formaldehyde',
      name: 'Formaldehyde',
      formula: 'CH2O',
      pointGroup: 'C2v',
      why: 'Planar, with the C2 along C=O and the molecular plane one of the two.',
      geometrySource: 'C=O 1.208, C–H 1.116 Å, H–C–H 116.5°.',
      smiles: 'C=O',
    },
    expandSeed('C2v', [
      { element: 'C', position: [0, 0, 0] },
      { element: 'O', position: [0, 0, 1.208] },
      { element: 'H', position: scaleVector(bendArm(1.116, 116.5), -1) },
    ]),
  ),
  molecule(
    {
      id: 'cis-dichloroethene',
      name: 'cis-1,2-dichloroethene',
      formula: 'C2H2Cl2',
      pointGroup: 'C2v',
      why: 'Both chlorines on one side: the C2 lies in the molecular plane.',
      geometrySource:
        'Idealised sp2, 120° angles; C=C 1.339, C–Cl 1.73, C–H 1.08 Å.',
      smiles: String.raw`Cl/C=C\Cl`,
    },
    dichloroethene('C2v'),
  ),
  molecule(
    {
      id: 'sulfur-tetrafluoride',
      name: 'Sulfur tetrafluoride',
      formula: 'SF4',
      pointGroup: 'C2v',
      why: 'The see-saw: a lone pair takes one equatorial place and one C2 survives.',
      geometrySource:
        'S–F axial 1.646, equatorial 1.545 Å; F–S–F axial 173.1°, equatorial 101.6°.',
    },
    expandSeed('C2v', [
      { element: 'S', position: [0, 0, 0] },
      { element: 'F', position: scaleVector(direction(101.6 / 2, 0), 1.545) },
      { element: 'F', position: scaleVector(direction(173.1 / 2, 90), 1.646) },
    ]),
  ),
  molecule(
    {
      id: 'ammonia',
      name: 'Ammonia',
      formula: 'NH3',
      pointGroup: 'C3v',
      why: 'A trigonal pyramid: three planes hold the C3, and none is horizontal.',
      geometrySource: 'N–H 1.012 Å, H–N–H 106.7°.',
      smiles: 'N',
    },
    expandSeed('C3v', [
      { element: 'N', position: [0, 0, 0] },
      {
        element: 'H',
        position: scaleVector(direction(conePolar(106.7, 3)), 1.012),
      },
    ]),
  ),
  molecule(
    {
      id: 'chloroform',
      name: 'Chloroform',
      formula: 'CHCl3',
      pointGroup: 'C3v',
      why: 'The C3 runs along C–H; the fourth substituent breaks the tetrahedron.',
      geometrySource: 'C–H 1.100, C–Cl 1.758 Å, Cl–C–Cl 111.3°.',
      smiles: 'ClC(Cl)Cl',
    },
    expandSeed('C3v', [
      { element: 'C', position: [0, 0, 0] },
      { element: 'H', position: [0, 0, 1.1] },
      {
        element: 'Cl',
        position: scaleVector(direction(180 - conePolar(111.3, 3)), 1.758),
      },
    ]),
  ),
];
