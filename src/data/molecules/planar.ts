import { expandSeed } from './build.ts';
import {
  BENZENE_RING,
  cyclopropane,
  diborane,
  ethene,
  naphthalene,
  ringAtom,
} from './flat.ts';
import type { MoleculeEntry } from './types.ts';
import { molecule } from './types.ts';

/** The flat molecules, where a `σh` is the whole of the difference. */
export const PLANAR_MOLECULES: readonly MoleculeEntry[] = [
  molecule(
    {
      id: 'boron-trifluoride',
      name: 'Boron trifluoride',
      formula: 'BF3',
      pointGroup: 'D3h',
      why: 'Trigonal planar: three C2 in the plane, and the plane itself is σh.',
      geometrySource: 'B–F 1.313 Å.',
      smiles: 'FB(F)F',
    },
    expandSeed('D3h', [
      { element: 'B', position: [0, 0, 0] },
      { element: 'F', position: [1.313, 0, 0] },
    ]),
  ),
  molecule(
    {
      id: 'phosphorus-pentachloride',
      name: 'Phosphorus pentachloride',
      formula: 'PCl5',
      pointGroup: 'D3h',
      why: 'A trigonal bipyramid: the equatorial plane is σh.',
      geometrySource: 'P–Cl axial 2.124, equatorial 2.020 Å.',
    },
    expandSeed('D3h', [
      { element: 'P', position: [0, 0, 0] },
      { element: 'Cl', position: [2.02, 0, 0] },
      { element: 'Cl', position: [0, 0, 2.124] },
    ]),
  ),
  molecule(
    {
      id: 'cyclopropane',
      name: 'Cyclopropane',
      formula: 'C3H6',
      pointGroup: 'D3h',
      why: 'The three carbons are a flat triangle with a hydrogen above and below.',
      geometrySource: 'C–C 1.510, C–H 1.089 Å, H–C–H 115.1°.',
      smiles: 'C1CC1',
    },
    cyclopropane(),
  ),
  molecule(
    {
      id: 'trichlorobenzene',
      name: '1,3,5-trichlorobenzene',
      formula: 'C6H3Cl3',
      pointGroup: 'D3h',
      why: 'Alternating substituents leave a C3 where benzene had a C6.',
      geometrySource:
        'Idealised regular hexagon; C–C 1.397, C–Cl 1.74, C–H 1.08 Å.',
      smiles: 'Clc1cc(Cl)cc(Cl)c1',
    },
    expandSeed('D3h', [
      ...ringAtom('C', 0, BENZENE_RING),
      ...ringAtom('Cl', 0, BENZENE_RING + 1.74),
      ...ringAtom('C', 60, BENZENE_RING),
      ...ringAtom('H', 60, BENZENE_RING + 1.08),
    ]),
  ),
  molecule(
    {
      id: 'ethene',
      name: 'Ethene',
      formula: 'C2H4',
      pointGroup: 'D2h',
      why: 'Planar, with three perpendicular C2 and an inversion centre.',
      geometrySource: 'C=C 1.339, C–H 1.087 Å, H–C–H 117.4°.',
      smiles: 'C=C',
    },
    ethene(),
  ),
  molecule(
    {
      id: 'diborane',
      name: 'Diborane',
      formula: 'B2H6',
      pointGroup: 'D2h',
      why: 'The two bridging hydrogens sit on the C2 perpendicular to the BH2 planes.',
      geometrySource:
        'B–H terminal 1.19, bridging 1.33 Å, B···B 1.77 Å; terminal H–B–H idealised at 121.5°.',
    },
    diborane(),
  ),
  molecule(
    {
      id: 'naphthalene',
      name: 'Naphthalene',
      formula: 'C10H8',
      pointGroup: 'D2h',
      why: 'Two fused rings: the long and short axes are C2, and so is the normal.',
      geometrySource: 'Idealised fused regular hexagons; C–C 1.40, C–H 1.08 Å.',
      smiles: 'c1ccc2ccccc2c1',
    },
    naphthalene(),
  ),
  molecule(
    {
      id: 'dichlorobenzene',
      name: '1,4-dichlorobenzene',
      formula: 'C6H4Cl2',
      pointGroup: 'D2h',
      why: 'Two substituents opposite each other cut the C6 down to a C2.',
      geometrySource:
        'Idealised regular hexagon; C–C 1.397, C–Cl 1.74, C–H 1.08 Å.',
      smiles: 'Clc1ccc(Cl)cc1',
    },
    expandSeed('D2h', [
      ...ringAtom('C', 0, BENZENE_RING),
      ...ringAtom('Cl', 0, BENZENE_RING + 1.74),
      ...ringAtom('C', 60, BENZENE_RING),
      ...ringAtom('H', 60, BENZENE_RING + 1.08),
    ]),
  ),
  molecule(
    {
      id: 'xenon-tetrafluoride',
      name: 'Xenon tetrafluoride',
      formula: 'XeF4',
      pointGroup: 'D4h',
      why: 'Square planar: the two lone pairs sit above and below, on the C4.',
      geometrySource: 'Xe–F 1.953 Å.',
    },
    expandSeed('D4h', [
      { element: 'Xe', position: [0, 0, 0] },
      { element: 'F', position: [1.953, 0, 0] },
    ]),
  ),
  molecule(
    {
      id: 'tetrachloroplatinate',
      name: 'Tetrachloroplatinate(II)',
      formula: 'PtCl4',
      pointGroup: 'D4h',
      why: 'The square-planar d8 complex, with the ligands on the x and y axes.',
      geometrySource: 'Pt–Cl 2.316 Å.',
    },
    expandSeed('D4h', [
      { element: 'Pt', position: [0, 0, 0] },
      { element: 'Cl', position: [2.316, 0, 0] },
    ]),
  ),
  molecule(
    {
      id: 'benzene',
      name: 'Benzene',
      formula: 'C6H6',
      pointGroup: 'D6h',
      why: 'A flat regular hexagon: six C2 in the plane, six more through it.',
      geometrySource: 'C–C 1.397, C–H 1.084 Å.',
      smiles: 'c1ccccc1',
    },
    expandSeed('D6h', [
      ...ringAtom('C', 0, BENZENE_RING),
      ...ringAtom('H', 0, BENZENE_RING + 1.084),
    ]),
  ),
  molecule(
    {
      id: 'carbon-dioxide',
      name: 'Carbon dioxide',
      formula: 'CO2',
      pointGroup: 'Dinfh',
      why: 'Linear and the same from both ends, so it has an inversion centre.',
      geometrySource: 'C=O 1.162 Å.',
      smiles: 'O=C=O',
    },
    [
      { element: 'O', position: [0, 0, -1.162] },
      { element: 'C', position: [0, 0, 0] },
      { element: 'O', position: [0, 0, 1.162] },
    ],
  ),
  molecule(
    {
      id: 'ethyne',
      name: 'Ethyne',
      formula: 'C2H2',
      pointGroup: 'Dinfh',
      why: 'Linear and centrosymmetric: the classic mutual-exclusion example.',
      geometrySource: 'C≡C 1.203, C–H 1.063 Å.',
      smiles: 'C#C',
    },
    [
      { element: 'H', position: [0, 0, -1.6645] },
      { element: 'C', position: [0, 0, -0.6015] },
      { element: 'C', position: [0, 0, 0.6015] },
      { element: 'H', position: [0, 0, 1.6645] },
    ],
  ),
];
