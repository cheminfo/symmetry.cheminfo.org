import type { Exercise } from './types.ts';

/** Character tables: completing a row, and reducing a representation. */
export const CHARACTER_EXERCISES: readonly Exercise[] = [
  {
    id: 'character-row-c2v-b1',
    kind: 'character-row',
    level: 'intermediate',
    title: 'Complete the B₁ row of C₂ᵥ',
    pointGroup: 'C2v',
    irrep: 'B1',
    given: ['A1', 'A2', 'B2'],
    description:
      'Three rows of the C₂ᵥ table are filled in and B₁ is blank. Every [[character]] here is +1 or −1, every row is orthogonal to every other, and Σ g χ² must come to the [[order of a group|order]] 4. Those two conditions fix the row before you think about what B₁ means.',
    answer: { E: 1, C2: -1, 'σv(xz)': 1, 'σv′(yz)': -1 },
    hints: [
      'χ(E) is the dimension of the representation, and every irrep of C2v is one-dimensional.',
      'B means the character under the principal rotation is −1; subscript 1 means +1 under σv(xz).',
      '1, −1, 1, −1 — the row that x and Ry transform as.',
    ],
    solution: 'E = 1, C2 = −1, σv(xz) = 1, σv′(yz) = −1',
  },
  {
    id: 'character-row-c3v-a2',
    kind: 'character-row',
    level: 'intermediate',
    title: 'Complete the A₂ row of C₃ᵥ',
    pointGroup: 'C3v',
    irrep: 'A2',
    given: ['A1', 'E'],
    description:
      'C₃ᵥ has three classes, so its table has three columns and three rows. A₁ and E are given. Use orthogonality against both and the fact that Σ g χ² is 6, remembering that the class sizes 1, 2 and 3 are the weights.',
    answer: { E: 1, '2C3': 1, '3σv': -1 },
    hints: [
      'A means +1 under the principal rotation, so the middle entry is settled at once.',
      'Orthogonality to A1 reads 1·χ(E) + 2·χ(2C3) + 3·χ(3σv) = 0.',
      '1, 1, −1 — the row Rz transforms as.',
    ],
    solution: 'E = 1, 2C3 = 1, 3σv = −1',
  },
  {
    id: 'reduce-water-stretch',
    kind: 'reduce',
    level: 'intermediate',
    title: 'Reduce the O–H stretches',
    pointGroup: 'C2v',
    basis: 'stretch',
    gamma: [2, 0, 0, 2],
    description:
      'Γ for water’s two O–H bonds is 2, 0, 0, 2: each operation scored by how many bonds it leaves in place. Apply the [[reduction formula]] and say how many of each [[irreducible representation]] it holds. Rows that appear zero times are part of the answer too.',
    answer: { A1: 1, A2: 0, B1: 0, B2: 1 },
    hints: [
      'nᵢ = (1/h) Σ g(R) χ(R) χᵢ(R), and h is 4 with every g equal to 1 here.',
      'For A1 all four characters are 1, so n is (2 + 0 + 0 + 2)/4.',
      'A1 + B2: the symmetric stretch at 3657 cm⁻¹ and the antisymmetric one at 3756 cm⁻¹.',
    ],
    solution: 'A1 + B2',
  },
  {
    id: 'reduce-ammonia-3n',
    kind: 'reduce',
    level: 'advanced',
    title: 'All 3N motions of ammonia',
    pointGroup: 'C3v',
    basis: 'cartesian',
    gamma: [12, 0, 2],
    description:
      'Γ₃ₙ for ammonia is 12, 0, 2: four atoms times three Cartesian directions, scored operation by operation. Reduce it, then check the answer by adding up the dimensions before going looking for the vibrations.',
    answer: { A1: 3, A2: 1, E: 4 },
    hints: [
      'h is 6, and the class sizes are 1, 2 and 3.',
      'Only atoms left in place by an operation contribute: the nitrogen to all three classes, one hydrogen to σv.',
      '3A1 + A2 + 4E, and taking A1 + E away for translation and A2 + E for rotation leaves 2A1 + 2E, the 6 = 3N − 6 vibrations.',
    ],
    solution: '3A1 + A2 + 4E',
  },
  {
    id: 'reduce-water-3n',
    kind: 'reduce',
    level: 'advanced',
    title: 'All 3N motions of water',
    pointGroup: 'C2v',
    basis: 'cartesian',
    gamma: [9, -1, 3, 1],
    description:
      'Water has three atoms, so Γ₃ₙ has nine dimensions and reads 9, −1, 3, 1. Reduce it, then subtract the three translations and three rotations the right-hand columns name to reach Γᵥᵢᵦ. The three [[normal mode|modes]] that survive are the ones an infrared spectrum shows.',
    answer: { A1: 3, A2: 1, B1: 3, B2: 2 },
    hints: [
      'An atom left where it was contributes 1 + 2cos θ for a rotation and −1 + 2cos θ for a reflection.',
      'Take away the translations — z is A1, x is B1, y is B2 — and the rotations A2, B1 and B2.',
      '3A1 + A2 + 3B1 + 2B2, which leaves Γvib = 2A1 + B2.',
    ],
    solution: '3A1 + A2 + 3B1 + 2B2',
  },
];
