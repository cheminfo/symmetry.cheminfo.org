import type { Exercise } from './types.ts';

/** What a space group leaves in a diffraction pattern, and what it builds. */
export const CRYSTAL_EXERCISES: readonly Exercise[] = [
  {
    id: 'absences-p21c',
    kind: 'select',
    level: 'advanced',
    title: 'Which reflections are absent?',
    domain: 'reflection',
    object: 'spaceGroup:14',
    description:
      'A 2₁ [[screw axis]] along b and a c [[glide plane]] across it each wipe out a class of reflections. Tick every reflection in the list that is systematically absent for P2₁/c. Four of the seven are.',
    offered: [
      {
        id: '0 2 0',
        reason: '0k0 with even k is allowed: the 2₁ only kills odd k',
      },
      {
        id: '0 3 0',
        reason: '0k0 with k odd is killed by the 2₁ screw along b',
      },
      {
        id: '1 0 1',
        reason: 'h0l with l odd is killed by the c glide',
      },
      {
        id: '1 0 2',
        reason: 'h0l with even l survives the c glide',
      },
      {
        id: '2 0 3',
        reason: 'h0l again, and l = 3 is odd',
      },
      {
        id: '1 1 1',
        reason: 'a general hkl: a primitive lattice imposes no condition on it',
      },
      {
        id: '0 0 3',
        reason:
          '00l lies inside the h0l zone with h = 0, so the c glide applies and odd l goes',
      },
    ],
    answer: ['0 3 0', '1 0 1', '2 0 3', '0 0 3'],
    hints: [
      'Each translational element kills reflections in the zone perpendicular to it.',
      'A 2₁ along b gives 0k0: k = 2n, and a c glide across b gives h0l: l = 2n.',
      'Anything with h = 0 and l odd, or with k odd and h = l = 0, is gone.',
    ],
    solution:
      '0 3 0 from the 2₁ screw; 1 0 1, 2 0 3 and 0 0 3 from the c glide',
  },
  {
    id: 'sohncke-protein',
    kind: 'select',
    level: 'advanced',
    title: 'Where can a protein crystallise?',
    domain: 'spaceGroup',
    object: 'spaceGroup:19',
    description:
      'A protein is built from L-amino acids, so its crystal can hold no [[improper rotation]] of any kind — no mirror, no glide, no inversion centre. The groups that qualify are the 65 [[sohncke group|Sohncke groups]]. Tick the ones in this list a protein could crystallise in.',
    offered: [
      {
        id: '19',
        label: 'P2₁2₁2₁ (19)',
        reason:
          'three perpendicular 2₁ screws, all proper — the commonest protein space group',
      },
      {
        id: '4',
        label: 'P2₁ (4)',
        reason: 'one 2₁ screw and nothing else',
      },
      {
        id: '5',
        label: 'C2 (5)',
        reason:
          'a C-centred lattice is a translation, not an improper operation',
      },
      {
        id: '96',
        label: 'P4₃2₁2 (96)',
        reason:
          'a 4₃ screw is a rotation plus a translation, and both are proper',
      },
      {
        id: '14',
        label: 'P2₁/c (14)',
        reason:
          'the c glide and the inversion centre it generates are improper',
      },
      {
        id: '225',
        label: 'Fm-3m (225)',
        reason: 'mirrors everywhere, and an inversion centre at the origin',
      },
      {
        id: '2',
        label: 'P-1 (2)',
        reason:
          'the bar is an inversion centre, which is what a chiral molecule forbids',
      },
    ],
    answer: ['19', '4', '5', '96'],
    hints: [
      'Look for anything that would turn a left hand into a right hand.',
      'Screw axes and lattice centrings are fine; mirrors, glides, inversion and inversion axes are not.',
      '65 of the 230 space groups are Sohncke, and four of these seven are among them.',
    ],
    solution: 'P2₁2₁2₁, P2₁, C2 and P4₃2₁2',
  },
  {
    id: 'place-rock-salt',
    kind: 'place-atom',
    level: 'advanced',
    title: 'Build rock salt',
    spaceGroupNumber: 225,
    variant: 0,
    cell: { a: 5.64, b: 5.64, c: 5.64, alpha: 90, beta: 90, gamma: 90 },
    given: [{ element: 'Na', x: 0, y: 0, z: 0 }],
    asked: { element: 'Cl', count: 1 },
    description:
      'A sodium already sits at the origin of an Fm-3m cell. Place one chlorine so the structure the group generates is NaCl: equal numbers of each, a chlorine on a site of symmetry m-3m, and nothing closer than 2 Å. More than one position works, and the constraints accept any of them.',
    constraints: [
      {
        kind: 'composition',
        ratios: { Na: 1, Cl: 1 },
        why: 'equal numbers of sodium and chlorine, which is what NaCl means',
      },
      {
        kind: 'multiplicity',
        element: 'Cl',
        count: 4,
        why: 'the F lattice turns one atom into four, and four is what a 1:1 cell needs',
      },
      {
        kind: 'siteSymmetry',
        element: 'Cl',
        symbol: 'm-3m',
        why: 'the chlorine sits where all 48 operations leave it, as the sodium does',
      },
      {
        kind: 'minDistance',
        angstrom: 2,
        why: 'no two atoms overlap: the closest Na–Cl contact is 2.82 Å',
      },
    ],
    answer: [{ element: 'Cl', x: 0.5, y: 0, z: 0 }],
    probes: [
      {
        atoms: [{ element: 'Cl', x: 0.5, y: 0, z: 0 }],
        shouldPass: true,
        why: 'the octahedral hole: Na and Cl octahedra interlock',
      },
      {
        atoms: [{ element: 'Cl', x: 0, y: 0.5, z: 0 }],
        shouldPass: true,
        why: 'the same site reached along another axis, and a legitimate answer',
      },
      {
        atoms: [{ element: 'Cl', x: 0.5, y: 0.5, z: 0.5 }],
        shouldPass: true,
        why: 'the body centre is that same orbit once the F centring is applied',
      },
      {
        atoms: [{ element: 'Cl', x: 0.25, y: 0.25, z: 0.25 }],
        shouldPass: false,
        why: 'the orbit has 8 atoms and site symmetry -43m, giving NaCl2 — that is fluorite',
      },
      {
        atoms: [{ element: 'Cl', x: 0.12, y: 0.23, z: 0.34 }],
        shouldPass: false,
        why: 'a general position: 192 chlorines, and atoms less than an ångström apart',
      },
      {
        atoms: [{ element: 'Cl', x: 0, y: 0, z: 0 }],
        shouldPass: false,
        why: 'on top of the sodium',
      },
    ],
    hints: [
      'The F lattice turns a single atom into four, so you need a site whose orbit is 4.',
      'Look for a position the 48 point-group operations leave in place, and not one of the tetrahedral holes.',
      '(½, 0, 0): site symmetry m-3m, multiplicity 4, the octahedral hole between the sodium ions.',
    ],
    solution: 'Cl at (½, 0, 0)',
  },
];
