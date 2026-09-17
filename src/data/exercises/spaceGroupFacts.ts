import type { Exercise } from './types.ts';

/** Reading the facts off a space group symbol, and off its settings. */
export const SPACE_GROUP_FACT_EXERCISES: readonly Exercise[] = [
  {
    id: 'facts-p21c',
    kind: 'space-group-facts',
    level: 'advanced',
    title: 'Read P2₁/c',
    spaceGroupNumber: 14,
    variant: 0,
    asked: [
      'number',
      'crystalSystem',
      'centring',
      'generalPositions',
      'centrosymmetric',
      'sohncke',
    ],
    description:
      'P2₁/c is the [[space group]] of roughly a third of published organic crystal structures. Read its symbol: the lattice letter, the system it forces, how many [[general position|general positions]] it has, and whether it can hold a chiral molecule.',
    answer: {
      number: 14,
      crystalSystem: 'monoclinic',
      centring: 'P',
      generalPositions: 4,
      centrosymmetric: true,
      sohncke: false,
    },
    hints: [
      'The leading letter is the lattice centring; the rest is the point group with translations added.',
      'A 2₁ with a c glide across it generates an inversion centre.',
      'No. 14, monoclinic, P, 4 general positions, centrosymmetric — so a single enantiomer never crystallises in it.',
    ],
    solution:
      'No. 14 · monoclinic · P · 4 general positions · centrosymmetric · not Sohncke',
  },
  {
    id: 'facts-fm3m',
    kind: 'space-group-facts',
    level: 'advanced',
    title: 'Read Fm-3m',
    spaceGroupNumber: 225,
    variant: 0,
    asked: [
      'number',
      'crystalSystem',
      'centring',
      'generalPositions',
      'crystalClass',
      'centrosymmetric',
    ],
    description:
      'Fm-3m is rock salt, copper and most of the simple metals, and its general [[multiplicity]] is the largest in the tables. Work the number out from the crystal class and the centring rather than looking it up: 48 operations, four lattice points per cell.',
    answer: {
      number: 225,
      crystalSystem: 'cubic',
      centring: 'F',
      generalPositions: 192,
      crystalClass: 'm-3m',
      centrosymmetric: true,
    },
    hints: [
      'The cubic point group m-3m has 48 operations.',
      'An F lattice multiplies every orbit by the number of lattice points in the cell.',
      '48 × 4 = 192 general positions, in space group No. 225.',
    ],
    solution:
      'No. 225 · cubic · F · 192 general positions · m-3m · centrosymmetric',
  },
  {
    id: 'setting-r3c',
    kind: 'space-group-facts',
    level: 'advanced',
    title: 'The same group, two settings',
    spaceGroupNumber: 167,
    variant: 0,
    asked: ['number', 'crystalSystem', 'centring', 'generalPositions'],
    description:
      'R-3c is calcite and corundum. It is listed twice, once on hexagonal axes and once on rhombohedral ones, and the number of [[general position|general positions]] differs between them. Give the hexagonal figure, then switch the setting on the panel and read the other.',
    answer: {
      number: 167,
      crystalSystem: 'trigonal',
      centring: 'R',
      generalPositions: 36,
    },
    hints: [
      'A rhombohedral group can be described in a rhombohedral cell or in a hexagonal one three times larger.',
      'The point group -3m has 12 operations, and the hexagonal cell holds three rhombohedral lattice points.',
      '36 on hexagonal axes, 12 on rhombohedral axes: one crystal, two cells.',
    ],
    solution: 'No. 167 · trigonal · R · 36 general positions on hexagonal axes',
  },
];
