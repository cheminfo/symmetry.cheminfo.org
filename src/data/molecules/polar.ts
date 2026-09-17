import type { Vec3 } from '../../symmetry/point/vec3.ts';
import { scaleVector } from '../../symmetry/point/vec3.ts';

import { dichloroethene } from './bent.ts';
import type { MoleculeAtom } from './build.ts';
import { expandSeed, planarBond } from './build.ts';
import { direction } from './frames.ts';
import type { MoleculeEntry } from './types.ts';
import { molecule } from './types.ts';

/** The square pyramids, the linear heteronuclear molecules, and the `C_nh` pair. */
export const POLAR_MOLECULES: readonly MoleculeEntry[] = [
  molecule(
    {
      id: 'bromine-pentafluoride',
      name: 'Bromine pentafluoride',
      formula: 'BrF5',
      pointGroup: 'C4v',
      why: 'A square pyramid: four planes hold the C4 and none cuts it.',
      geometrySource: 'Br–F axial 1.689, basal 1.774 Å; F–Br–F 84.8°.',
    },
    expandSeed('C4v', [
      { element: 'Br', position: [0, 0, 0] },
      { element: 'F', position: [0, 0, 1.689] },
      { element: 'F', position: scaleVector(direction(84.8), 1.774) },
    ]),
  ),
  molecule(
    {
      id: 'xenon-oxytetrafluoride',
      name: 'Xenon oxytetrafluoride',
      formula: 'XeOF4',
      pointGroup: 'C4v',
      why: 'The oxygen caps the pyramid, so no plane can cut the C4 in two.',
      geometrySource: 'Xe–O 1.703, Xe–F 1.900 Å; O–Xe–F 91.8°.',
    },
    expandSeed('C4v', [
      { element: 'Xe', position: [0, 0, 0] },
      { element: 'O', position: [0, 0, 1.703] },
      { element: 'F', position: scaleVector(direction(91.8), 1.9) },
    ]),
  ),
  molecule(
    {
      id: 'hydrogen-chloride',
      name: 'Hydrogen chloride',
      formula: 'HCl',
      pointGroup: 'Cinfv',
      why: 'Two different atoms on a line: no centre to invert through.',
      geometrySource: 'H–Cl 1.2746 Å.',
      smiles: 'Cl',
    },
    [
      { element: 'H', position: [0, 0, 0] },
      { element: 'Cl', position: [0, 0, 1.2746] },
    ],
  ),
  molecule(
    {
      id: 'hydrogen-cyanide',
      name: 'Hydrogen cyanide',
      formula: 'HCN',
      pointGroup: 'Cinfv',
      why: 'Linear and read differently from each end.',
      geometrySource: 'C–H 1.0655, C≡N 1.1532 Å.',
      smiles: 'C#N',
    },
    [
      { element: 'H', position: [0, 0, 0] },
      { element: 'C', position: [0, 0, 1.0655] },
      { element: 'N', position: [0, 0, 2.2187] },
    ],
  ),
  molecule(
    {
      id: 'carbonyl-sulfide',
      name: 'Carbonyl sulfide',
      formula: 'OCS',
      pointGroup: 'Cinfv',
      why: 'Carbon dioxide with one oxygen swapped: the inversion centre goes.',
      geometrySource: 'Idealised: C=O 1.16, C=S 1.56 Å.',
      smiles: 'O=C=S',
    },
    [
      { element: 'O', position: [0, 0, 0] },
      { element: 'C', position: [0, 0, 1.16] },
      { element: 'S', position: [0, 0, 2.72] },
    ],
  ),
  molecule(
    {
      id: 'trans-dichloroethene',
      name: 'trans-1,2-dichloroethene',
      formula: 'C2H2Cl2',
      pointGroup: 'C2h',
      why: 'One chlorine each side: the C2 is perpendicular to the plane, which is σh.',
      geometrySource:
        'Idealised sp2, 120° angles; C=C 1.339, C–Cl 1.73, C–H 1.08 Å.',
      smiles: 'Cl/C=C/Cl',
    },
    dichloroethene('C2h'),
  ),
  molecule(
    {
      id: 'butadiene',
      name: 's-trans-1,3-butadiene',
      formula: 'C4H6',
      pointGroup: 'C2h',
      why: 'The planar anti chain has an inversion centre at the middle bond.',
      geometrySource:
        'Idealised planar sp2, 123.3° angles; C=C 1.34, C–C 1.46, C–H 1.08 Å.',
      smiles: 'C=CC=C',
    },
    butadiene(),
  ),
  molecule(
    {
      id: 'boric-acid',
      name: 'Boric acid',
      formula: 'B(OH)3',
      pointGroup: 'C3h',
      why: 'All three O–H turned the same way: σh survives, every σv dies.',
      geometrySource: 'B–O 1.361, O–H 0.960 Å; idealised planar, B–O–H 114°.',
      smiles: 'OB(O)O',
    },
    boricAcid(),
  ),
];

/** The planar anti chain, built as one half and inverted. */
function butadiene(): MoleculeAtom[] {
  const normal: Vec3 = [0, 0, 1];
  const inner: Vec3 = [1.46 / 2, 0, 0];
  const otherInner: Vec3 = [-1.46 / 2, 0, 0];
  const terminal = planarBond(inner, otherInner, 123.3, 1.34, normal);
  return expandSeed('C2h', [
    { element: 'C', position: inner },
    { element: 'C', position: terminal },
    {
      element: 'H',
      position: planarBond(inner, otherInner, -123.3, 1.09, normal),
    },
    { element: 'H', position: planarBond(terminal, inner, 120, 1.08, normal) },
    { element: 'H', position: planarBond(terminal, inner, -120, 1.08, normal) },
  ]);
}

/** The propeller: three hydroxyls in the plane, each turned the same way. */
function boricAcid(): MoleculeAtom[] {
  const boron: Vec3 = [0, 0, 0];
  const oxygen: Vec3 = [1.361, 0, 0];
  return expandSeed('C3h', [
    { element: 'B', position: boron },
    { element: 'O', position: oxygen },
    { element: 'H', position: planarBond(oxygen, boron, 114, 0.96, [0, 0, 1]) },
  ]);
}
