import type { TutorialStep } from './types.ts';

/**
 * Lattices, plane groups, space groups.
 *
 * The plane groups sit between the lattices and the space groups on purpose. A
 * wallpaper group is a lattice, a point group and glides with one dimension
 * fewer to keep track of; a student who has seen p4m recognises P4/mmm at once,
 * and a student who meets a glide first in three dimensions does not.
 */
export const ADVANCED_STEPS: readonly TutorialStep[] = [
  {
    id: 'lattice-and-cell',
    level: 'advanced',
    title: 'Add translation: the lattice',
    object: 'spaceGroup:1',
    show: ['unitCell', 'orbit'],
    observe: 'Drag one atom: every copy moves with it, one per cell, for ever.',
    description:
      'A crystal is a [[motif]] repeated by a [[lattice]], an infinite set of points with identical surroundings. The [[unit cell]] is the box that tiles space by translation alone, and its six [[lattice parameters|parameters]] are what a diffractometer measures. Only 2-, 3-, 4- and 6-fold rotations survive alongside translation, which is the [[crystallographic restriction theorem]] and is why no crystal has a fivefold axis. Change the cell angles and watch which rotations stay legal.',
  },
  {
    id: 'bravais',
    level: 'advanced',
    title: 'Seven systems, fourteen lattices',
    object: 'spaceGroup:225',
    show: ['unitCell', 'labels'],
    observe:
      'Switch P, I then F on the cubic cell: 1, 2 then 4 lattice points.',
    description:
      'Constrain the cell by symmetry and you get seven [[crystal system|crystal systems]]. Allow an extra lattice point at the body centre, on one pair of faces, or on all of them, and you get the 14 [[bravais lattice|Bravais lattices]] and no more: every other centring is either a smaller [[primitive cell]] in disguise or breaks the system it claims. A face-centred cubic cell holds four lattice points, a body-centred one two, a primitive one one. That count is also the factor the number of general positions goes up by.',
  },
  {
    id: 'plane-groups',
    level: 'advanced',
    title: 'The two-dimensional rehearsal',
    object: 'wallpaper:p4m',
    show: ['unitCell', 'mirrors', 'axes', 'fundamentalDomain'],
    observe:
      'Drag the motif inside the shaded triangle: every copy in the plane follows it.',
    description:
      'Combine the 5 [[plane lattice|plane lattices]] with the 10 two-dimensional point groups and you get exactly 17 [[wallpaper group|wallpaper groups]], not 50, because most pairings give a group already in the list. Each also has an [[orbifold notation|orbifold symbol]]: p4m is *442, three mirror corners of order 4, 4 and 2. The [[fundamental domain]] is the smallest piece the operations rebuild the pattern from, and for p4m it is one eighth of the square. The next two steps are this, with one more dimension.',
  },
  {
    id: 'glide-and-screw',
    level: 'advanced',
    title: 'What translation adds',
    object: 'spaceGroup:14',
    show: ['unitCell', 'glides', 'screws', 'labels'],
    observe:
      'The 2₁ axis: rotate 180° about b, then slide half a cell along it.',
    description:
      'A [[glide plane]] is a reflection combined with a translation of half a lattice vector; a [[screw axis]] is a rotation combined with one. Neither can exist in a point group, because both need the lattice to close them. P2₁/c, which holds roughly a third of all published organic structures, has a 2₁ screw along b and a c glide across it. Each leaves a fingerprint in the diffraction pattern: 0k0 vanishes for odd k and h0l for odd l, and that [[systematic absence]] is how the symbol is read off the data.',
  },
  {
    id: 'space-group-positions',
    level: 'advanced',
    title: 'One atom becomes the structure',
    object: 'spaceGroup:225',
    show: ['unitCell', 'asymmetricUnit', 'orbit'],
    panel: 'positions',
    observe:
      'Na at 0,0,0 and Cl at ½,0,0: rock salt, four formula units, from two lines of input.',
    description:
      'Give one atom [[fractional coordinates]] and the space group makes the rest. P2₁/c has 4 [[general position|general positions]], so one atom in the [[asymmetric unit]] becomes four in the cell; Fm-3m has 192. An atom sitting on a symmetry element occupies a [[special position]] with lower [[multiplicity]] and its own [[site symmetry]], and this site names it by those two numbers rather than by a letter from a table. Put sodium at 0,0,0 and chlorine at ½,0,0 and you have built rock salt: both on sites of multiplicity 4 and symmetry m-3m.',
  },
];
