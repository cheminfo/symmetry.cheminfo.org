import type { Vec3 } from '../../symmetry/point/vec3.ts';
import {
  addVectors,
  normalizeVector,
  scaleVector,
} from '../../symmetry/point/vec3.ts';

import type { MoleculeAtom } from './build.ts';
import { expandSeed } from './build.ts';
import { adamantane, direction, perpendicular, phenylArm } from './frames.ts';
import {
  cube,
  dodecahedron,
  icosahedron,
  octahedron,
  tetrahedron,
  truncatedIcosahedron,
} from './shapes.ts';
import type { MoleculeEntry } from './types.ts';
import { molecule } from './types.ts';

/** The tetrahedral, octahedral and icosahedral cages. */
export const CAGE_MOLECULES: readonly MoleculeEntry[] = [
  molecule(
    {
      id: 'methane',
      name: 'Methane',
      formula: 'CH4',
      pointGroup: 'Td',
      why: 'A regular tetrahedron: four C3 axes, three S4, and no C4 at all.',
      geometrySource: 'C–H 1.087 Å.',
      smiles: 'C',
    },
    expandSeed('Td', [
      { element: 'C', position: [0, 0, 0] },
      { element: 'H', position: tetrahedron(1.087)[0] as Vec3 },
    ]),
  ),
  molecule(
    {
      id: 'white-phosphorus',
      name: 'White phosphorus',
      formula: 'P4',
      pointGroup: 'Td',
      why: 'Four atoms, six equal bonds: the tetrahedron with nothing at its centre.',
      geometrySource: 'P–P 2.21 Å.',
      smiles: 'P12P3P1P23',
    },
    tetrahedron(2.21 * Math.sqrt(3 / 8)).map((position) => ({
      element: 'P',
      position,
    })),
  ),
  molecule(
    {
      id: 'adamantane',
      name: 'Adamantane',
      formula: 'C10H16',
      pointGroup: 'Td',
      why: 'A piece of the diamond lattice: a C3 through each methine hydrogen.',
      geometrySource:
        'C–C 1.54, C–H 1.09 Å; methylene H–C–H idealised at 108°.',
      smiles: 'C1C2CC3CC1CC(C2)C3',
    },
    adamantane(),
  ),
  molecule(
    {
      id: 'neopentane-twisted',
      name: 'Neopentane, methyls twisted',
      formula: 'C5H12',
      pointGroup: 'T',
      why: 'Turning every methyl the same way destroys each mirror and keeps the rotations.',
      geometrySource:
        'Idealised tetrahedral core; C–C 1.54, C–H 1.09 Å, every methyl turned 20°.',
      smiles: 'CC(C)(C)C',
    },
    neopentane(20),
  ),
  molecule(
    {
      id: 'hexanitrocobaltate',
      name: 'Hexanitrocobaltate(III)',
      formula: 'CoN6O12',
      pointGroup: 'Th',
      why: 'Opposite nitro groups coplanar, adjacent ones crossed: the C4 goes, i stays.',
      geometrySource:
        'Co–N 1.94 Å; nitro group idealised, N–O 1.24 Å and O–N–O 120°.',
    },
    expandSeed('Th', [
      { element: 'Co', position: [0, 0, 0] },
      { element: 'N', position: [0, 0, 1.94] },
      {
        element: 'O',
        position: addVectors([0, 0, 1.94], scaleVector(direction(60), 1.24)),
      },
    ]),
  ),
  molecule(
    {
      id: 'tetraphenylmethane',
      name: 'Tetraphenylmethane, propeller',
      formula: 'C25H20',
      pointGroup: 'S4',
      why: 'All four rings turned alike: one S4 survives and every C3 and mirror dies.',
      geometrySource:
        'Idealised tetrahedral core and regular rings; C–C 1.54, ring C–C 1.397, C–H 1.084 Å, twist 57°.',
      smiles: 'c1ccc(C(c2ccccc2)(c2ccccc2)c2ccccc2)cc1',
    },
    tetraphenylmethane(57),
  ),
  molecule(
    {
      id: 'sulfur-hexafluoride',
      name: 'Sulfur hexafluoride',
      formula: 'SF6',
      pointGroup: 'Oh',
      why: 'A regular octahedron: three C4, four C3, and an inversion centre.',
      geometrySource: 'S–F 1.564 Å.',
      smiles: 'FS(F)(F)(F)(F)F',
    },
    [
      { element: 'S', position: [0, 0, 0] },
      ...octahedron(1.564).map((position) => ({ element: 'F', position })),
    ],
  ),
  molecule(
    {
      id: 'cubane',
      name: 'Cubane',
      formula: 'C8H8',
      pointGroup: 'Oh',
      why: 'Eight carbons at the corners of a cube, each hydrogen on a body diagonal.',
      geometrySource: 'C–C 1.571, C–H 1.10 Å.',
      smiles: 'C12C3C4C1C5C4C3C25',
    },
    cubane(),
  ),
  molecule(
    {
      id: 'buckminsterfullerene',
      name: 'Buckminsterfullerene',
      formula: 'C60',
      pointGroup: 'Ih',
      why: 'A truncated icosahedron: six C5 axes, and every carbon the same.',
      geometrySource:
        'Ideal truncated icosahedron of circumradius 3.55 Å, so the edge is 1.4326 Å.',
    },
    truncatedIcosahedron(3.55).map((position) => ({ element: 'C', position })),
  ),
  molecule(
    {
      id: 'dodecaborate',
      name: 'Dodecahydro-closo-dodecaborate',
      formula: 'B12H12',
      pointGroup: 'Ih',
      why: 'A regular icosahedron of boron with each hydrogen pointing straight out.',
      geometrySource: 'Circumradius 1.6834 Å, so B–B is 1.77 Å; B–H 1.19 Å.',
    },
    radialCage('B', 'H', icosahedron(1.6834), 1.19),
  ),
  molecule(
    {
      id: 'dodecahedrane',
      name: 'Dodecahedrane',
      formula: 'C20H20',
      pointGroup: 'Ih',
      why: 'The other icosahedral cage: twenty carbons on a regular dodecahedron.',
      geometrySource: 'C–C 1.55, C–H 1.09 Å.',
      smiles: 'C12C3C4C1C1C5C2C2C3C3C4C4C1C1C5C2C2C3C4C12',
    },
    radialCage('C', 'H', dodecahedron(1.55), 1.09),
  ),
];

/** A cage with one hydrogen pointing radially out of every vertex. */
function radialCage(
  cageElement: string,
  shellElement: string,
  vertices: readonly Vec3[],
  bond: number,
): MoleculeAtom[] {
  const atoms: MoleculeAtom[] = [];
  for (const vertex of vertices) {
    atoms.push(
      { element: cageElement, position: vertex },
      {
        element: shellElement,
        position: addVectors(
          vertex,
          scaleVector(normalizeVector(vertex), bond),
        ),
      },
    );
  }
  return atoms;
}

/** Cubane: the hydrogens run along the body diagonals. */
function cubane(): MoleculeAtom[] {
  const carbons = cube(1.571);
  const half = 1.571 / 2;
  const stretch = 1 + 1.1 / (half * Math.sqrt(3));
  const atoms: MoleculeAtom[] = [];
  for (const carbon of carbons) {
    atoms.push(
      { element: 'C', position: carbon },
      { element: 'H', position: scaleVector(carbon, stretch) },
    );
  }
  return atoms;
}

/** Neopentane with every methyl turned by the same angle in the same sense. */
function neopentane(twist: number): MoleculeAtom[] {
  const axis = normalizeVector([1, 1, 1]);
  const methyl = scaleVector(axis, 1.54);
  const across = perpendicular(axis, twist);
  const lean = (180 - 109.47) * (Math.PI / 180);
  const hydrogen = addVectors(
    methyl,
    scaleVector(
      addVectors(
        scaleVector(axis, Math.cos(lean)),
        scaleVector(across, Math.sin(lean)),
      ),
      1.09,
    ),
  );
  return expandSeed('T', [
    { element: 'C', position: [0, 0, 0] },
    { element: 'C', position: methyl },
    { element: 'H', position: hydrogen },
  ]);
}

/** Four phenyl rings on the tetrahedral directions, each turned the same way. */
function tetraphenylmethane(twist: number): MoleculeAtom[] {
  const axis = normalizeVector([1, 1, 1]);
  const ipso = scaleVector(axis, 1.54);
  return expandSeed('S4', [
    { element: 'C', position: [0, 0, 0] },
    ...phenylArm(ipso, axis, perpendicular(axis, twist)),
  ]);
}
