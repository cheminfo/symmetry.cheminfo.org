import type { SymmetryGlossaryEntry } from './types.ts';

/** The space groups themselves, and what they leave in a diffraction pattern. */
export const CRYSTAL_TERMS: Record<string, SymmetryGlossaryEntry> = {
  'space group': {
    title: 'Space group',
    summary:
      'The full symmetry group of a crystal: a point group combined with a lattice, plus the screw axes and glide planes translation makes possible. There are exactly 230 in three dimensions and 17 in two.',
    examples: [
      {
        object: 'spaceGroup:14',
        observation: 'No. 14, P2₁/c, about a third of all organic structures',
      },
      { object: 'spaceGroup:225', observation: 'No. 225, Fm-3m, rock salt' },
    ],
  },
  'general position': {
    title: 'General position',
    summary:
      'A point lying on no symmetry element, so the group makes the largest possible number of copies of it. That count is the order of the space group inside one cell, and it is the length of the operation list.',
    examples: [
      {
        object: 'spaceGroup:14',
        observation: '4 positions: x,y,z; −x,y+½,−z+½; −x,−y,−z; x,−y+½,z+½',
      },
      { object: 'spaceGroup:225', observation: '192, the largest there is' },
    ],
  },
  'special position': {
    title: 'Special position',
    summary:
      'A point lying on one or more symmetry elements, so some operations map it onto itself and its orbit is smaller. Its multiplicity always divides the general one, and the operations fixing it are its site symmetry.',
    examples: [
      {
        object: 'spaceGroup:225',
        observation: 'Na at (0,0,0) has multiplicity 4, not 192',
        note: 'Its site symmetry is m-3m: the full point group fixes it.',
      },
    ],
  },
  orbit: {
    title: 'Orbit',
    summary:
      'Every copy of one position the operations of the group produce, counted inside one cell. This site names a position by its orbit rather than by an International Tables letter: the orbit is derived from the operations and can be checked, and a letter cannot.',
    examples: [
      {
        object: 'spaceGroup:225',
        observation: '(¼,¼,¼) has an orbit of 8 and site symmetry -43m',
        note: 'It is where the fluorine of fluorite sits.',
      },
    ],
  },
  'site symmetry': {
    title: 'Site symmetry',
    summary:
      'The point group of the operations leaving one position fixed. It is a subgroup of the crystal class, and it constrains what can sit there: a molecule on a site of symmetry 2 must itself carry at least a twofold axis.',
    examples: [
      {
        object: 'spaceGroup:14',
        observation: '(0,0,0) has site symmetry -1, multiplicity 2',
        note: 'Only a centrosymmetric molecule fits there.',
      },
    ],
  },
  multiplicity: {
    title: 'Multiplicity',
    summary:
      'How many equivalent points one position holds in the conventional cell. The general multiplicity divided by a site multiplicity gives the order of that site symmetry group, which is a quick check on any structure.',
    examples: [
      {
        object: 'spaceGroup:225',
        observation: '192 / 4 = 48, and m-3m has 48 operations',
      },
    ],
  },
  'screw axis': {
    title: 'Screw axis, nₘ',
    summary:
      'A rotation by 360°/n combined with a translation of m/n of the lattice vector along that axis. A 2₁ turns 180° and slides half a cell. A screw is a proper operation, so a crystal of a single enantiomer may have one.',
    examples: [
      {
        object: 'spaceGroup:19',
        observation: 'P2₁2₁2₁: three perpendicular 2₁ axes and nothing else',
        note: 'The commonest space group for a protein.',
      },
    ],
  },
  'glide plane': {
    title: 'Glide plane',
    summary:
      'A reflection combined with a translation of half a lattice vector, named for the direction it slides: a, b, c along an axis, n along a face diagonal, d along a quarter of one, e for two glides in one plane. A glide is improper, so no chiral molecule crystallises in a group that has one.',
    examples: [
      {
        object: 'spaceGroup:14',
        observation: 'The c glide across b: reflect, then slide c/2',
      },
    ],
  },
  'miller index': {
    title: 'Miller index, hkl',
    summary:
      'Three integers naming a family of parallel planes: the plane cuts the axes at a/h, b/k and c/l, and a zero means it is parallel to that axis. Diffraction is indexed this way, so every reflection carries an hkl.',
    examples: [
      {
        object: 'spaceGroup:14',
        observation: '(100) is parallel to b and c; (111) cuts all three',
      },
    ],
  },
  'systematic absence': {
    title: 'Systematic absence',
    summary:
      'A class of reflections whose intensity is exactly zero, because a translational symmetry element makes the contributions cancel. Reading the absences off a data set is how the space group is found before any atom is placed.',
    examples: [
      {
        object: 'spaceGroup:14',
        observation: '0k0 absent for odd k, h0l absent for odd l',
        note: '0 0 3 is gone too: 00l is inside the h0l zone.',
      },
      {
        object: 'spaceGroup:225',
        observation:
          'F: hkl survives only when h, k, l are all odd or all even',
      },
    ],
  },
  'laue class': {
    title: 'Laue class',
    summary:
      'The point group of a diffraction pattern, always centrosymmetric because Friedel’s law makes hkl and −h−k−l equal in intensity. There are 11, so diffraction symmetry alone never tells a chiral structure from its mirror image without anomalous scattering.',
    examples: [
      {
        object: 'spaceGroup:19',
        observation: 'Point group 222, Laue class mmm',
        note: 'The inversion centre is in the data, not in the crystal.',
      },
    ],
  },
  'sohncke group': {
    title: 'Sohncke group',
    summary:
      'One of the 65 space groups holding only proper operations — rotations, screws and translations, with no mirror, glide, inversion or inversion axis. A crystal of a single enantiomer must belong to one, which is why every protein structure is in one of these 65.',
    examples: [
      { object: 'spaceGroup:19', observation: 'P2₁2₁2₁ is Sohncke' },
      {
        object: 'spaceGroup:14',
        observation: 'P2₁/c is not, and no protein ever crystallises in it',
      },
    ],
  },
};
