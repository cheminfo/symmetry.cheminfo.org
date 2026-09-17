import type { SymmetrySection } from './types.ts';
import { row } from './types.ts';

/** Every character of a Hermann–Mauguin symbol, in the order it is read. */
export const SYMBOL_SECTION: SymmetrySection = {
  id: 'hermann-mauguin',
  title: 'Reading a space-group symbol',
  level: 'advanced',
  rows: [
    row('P', 'Primitive: 1 lattice point per cell.'),
    row('A, B, C', 'One pair of faces centred. 2 points per cell.'),
    row('I', 'Body-centred, from innenzentriert. 2 points per cell.'),
    row('F', 'All faces centred. 4 points per cell.'),
    row('R', 'Rhombohedral, described on hexagonal axes. 3 points per cell.'),
    row(
      '2, 3, 4, 6',
      'Proper rotation axes. 5- and 7-fold are impossible in a lattice.',
    ),
    row('-1, -3, -4, -6', 'Inversion axes. -1 is the inversion centre itself.'),
    row('m', 'Mirror plane.'),
    {
      syntax: '2₁, 3₁, 4₁, 6₅ …',
      description: 'Screw axis: rotate 360°/n, then translate m/n along it.',
      tooltip: {
        syntax: 'nₘ',
        name: 'Screw axis',
        tag: 'proper, so a chiral crystal may have one',
        summary:
          'A rotation by 360°/n combined with a translation of m/n of the lattice vector along that axis.',
        detail:
          'A 2₁ turns 180° and slides half a cell. Screws are proper operations, so the 65 Sohncke groups — the only ones a single enantiomer crystallises in — are full of them. Each leaves its own class of systematic absences.',
        example: {
          code: '2₁ ∥ b',
          input: 'P2₁/c, No. 14',
          note: 'It kills 0k0 whenever k is odd.',
        },
      },
    },
    row('a, b, c', 'Axial glide: reflect, then translate half of that axis.'),
    row('n', 'Diagonal glide: translate half a face diagonal.'),
    row(
      'd',
      'Diamond glide: translate a quarter of one. Only in F and I lattices.',
    ),
    row('e', 'Double glide: two glide directions in one plane.'),
    row(
      '4/m',
      'The slash means the mirror is perpendicular to the axis before it.',
    ),
    row(
      'P 2₁/c',
      'Primitive, 2₁ along b, c glide across b. No. 14, 4 general positions.',
    ),
  ],
};

/** What each translational element removes from the diffraction pattern. */
export const ABSENCE_SECTION: SymmetrySection = {
  id: 'absences',
  title: 'Systematic absences',
  intro:
    'A condition names what survives; everything else in that class is gone.',
  level: 'advanced',
  rows: [
    row('A centring', 'hkl present only when k + l = 2n.'),
    row('B centring', 'hkl present only when h + l = 2n.'),
    row('C centring', 'hkl present only when h + k = 2n.'),
    row('I centring', 'hkl present only when h + k + l = 2n.'),
    row(
      'F centring',
      'hkl present only when h, k and l are all even or all odd.',
    ),
    row('R (hexagonal axes)', 'hkl present only when −h + k + l = 3n.'),
    row('2₁ ∥ b', '0k0 present only when k = 2n.'),
    row('4₁ ∥ c', '00l present only when l = 4n.'),
    row('c glide ⊥ b', 'h0l present only when l = 2n.'),
    row('n glide ⊥ c', 'hk0 present only when h + k = 2n.'),
    row('d glide ⊥ b', 'h0l present only when h + l = 4n.'),
  ],
};
