import type { Exercise } from './types.ts';

/** Which operations a molecule has, and what two of them compose to. */
export const OPERATION_EXERCISES: readonly Exercise[] = [
  {
    id: 'ops-of-water',
    kind: 'select',
    level: 'beginner',
    title: 'Which operations does water have?',
    domain: 'operation',
    object: 'molecule:water',
    requiredDisplay: ['mirrors', 'axes'],
    description:
      'Tick every [[symmetry operation]] water actually has and leave the others alone. Four of the six offered belong to it. An operation is there only when it maps every atom onto an atom of the same element.',
    offered: [
      {
        id: 'E',
        reason:
          'every object has the identity, and it is an operation like any other',
      },
      {
        id: 'C2',
        reason:
          '180° about the axis through the oxygen swaps the two hydrogens',
      },
      {
        id: 'σv(xz)',
        reason:
          'the plane across the molecule, through the oxygen, swaps the hydrogens',
      },
      {
        id: 'σv′(yz)',
        reason:
          'the plane the three atoms lie in leaves every atom where it is',
      },
      {
        id: 'i',
        reason:
          'inversion would send each hydrogen through the oxygen into empty space',
      },
      {
        id: 'S4',
        reason:
          'a 90° turn about the C2 axis puts a hydrogen where there is nothing',
      },
    ],
    answer: ['E', 'C2', 'σv(xz)', 'σv′(yz)'],
    hints: [
      'Start with E: forgetting it is the commonest way to get the order wrong.',
      'Count the mirror planes first: one holds all three atoms and one lies across it.',
      'Four operations — E, C2 and two mirror planes — with no inversion centre and no improper axis.',
    ],
    solution: 'E, C2, σv(xz), σv′(yz)',
  },
  {
    id: 'chfclbr-operations',
    kind: 'select',
    level: 'beginner',
    title: 'What symmetry does CHFClBr have?',
    domain: 'operation',
    object: 'molecule:bromochlorofluoromethane',
    description:
      'Four different atoms round one carbon. Tick every operation this molecule has. The answer is shorter than the list, and it is why the molecule is [[chirality|chiral]].',
    offered: [
      {
        id: 'E',
        reason:
          'the identity is always there, and here it is the only operation',
      },
      {
        id: 'C2',
        reason:
          'no two substituents are the same, so no rotation can exchange a pair',
      },
      {
        id: 'C3',
        reason:
          'a C3 needs three identical substituents, and here all four differ',
      },
      {
        id: 'σ',
        reason:
          'a mirror plane would need two identical atoms either side of it',
      },
      {
        id: 'i',
        reason:
          'inversion needs an identical atom opposite each one, through the carbon',
      },
      {
        id: 'S4',
        reason:
          'no improper operation at all, which is exactly why the molecule is chiral',
      },
    ],
    answer: ['E'],
    hints: [
      'Any rotation has to send each atom onto an atom of the same element.',
      'Four different substituents means no two of them can ever be exchanged.',
      'Only E: the group is C1, order 1, and the molecule is chiral and polar.',
    ],
    solution: 'E',
  },
  {
    id: 'multiply-c2v',
    kind: 'multiply',
    level: 'intermediate',
    title: 'Multiply in C₂ᵥ',
    pointGroup: 'C2v',
    description:
      'Give the single operation each pair is equivalent to, reading every row as apply b first, then a. Every answer is one of the four operations already in the group, and that is [[closure]].',
    products: [
      { a: 'σv(xz)', b: 'C2' },
      { a: 'C2', b: 'C2' },
      { a: 'σv(xz)', b: 'σv(yz)' },
    ],
    offered: ['E', 'C2', 'σv(xz)', 'σv(yz)'],
    answer: ['σv(yz)', 'E', 'C2'],
    hints: [
      'Write each operation as what it does to the point (x, y, z).',
      'C2 about z sends (x, y, z) to (−x, −y, z), and σv(xz) sends it to (x, −y, z).',
      'Compose them: (x, y, z) to (−x, −y, z) to (−x, y, z), which is σv(yz).',
    ],
    solution:
      'σv(xz) then C2 gives σv(yz); C2 twice gives E; σv(xz) after σv(yz) gives C2',
  },
  {
    id: 'multiply-d3d',
    kind: 'multiply',
    level: 'intermediate',
    title: 'Powers of S₆',
    pointGroup: 'D3d',
    description:
      'Powers of an [[improper rotation]] alternate between proper and improper. Work out S₆², S₆³ and the product of the inversion with C₃. Two of the three answers have names of their own, and noticing that is the point.',
    products: [
      { a: 'S6', b: 'S6' },
      { a: 'S6', b: 'C3' },
      { a: 'i', b: 'C3' },
    ],
    offered: ['E', 'C3', 'C3^2', 'i', 'S6', 'S6^5'],
    answer: ['C3', 'i', 'S6^5'],
    hints: [
      'Sn is a rotation by 360°/n followed by a reflection in the perpendicular plane.',
      'Do the reflection twice and it cancels, so an even power of Sn is a pure rotation.',
      'S6² is C3, S6³ is the inversion, and i composed with C3 is S6⁵.',
    ],
    solution: 'S6² = C3; S6³ = i; i ∘ C3 = S6⁵',
  },
];
