import type { SymmetryGlossaryEntry } from './types.ts';

/** Symmetry with two dimensions, or one. */
export const PLANE_TERMS: Record<string, SymmetryGlossaryEntry> = {
  'plane group': {
    title: 'Plane group',
    summary:
      'The symmetry group of a pattern periodic in two directions. There are exactly 17, from combining the 5 plane lattices with the 10 two-dimensional point groups — most of the 50 pairings give a group already in the list.',
    examples: [
      {
        object: 'wallpaper:p4m',
        observation: 'Square lattice, fourfold centres on crossing mirrors',
      },
    ],
  },
  'wallpaper group': {
    title: 'Wallpaper group',
    summary:
      'Another name for a plane group, used when the pattern is decorative. The 17 have been looked for in the tilework of the Alhambra and in Escher’s prints, both of which predate the proof that there are only 17.',
    examples: [
      {
        object: 'wallpaper:p31m',
        observation: '3*3: one threefold centre sits off every mirror line',
      },
      {
        object: 'wallpaper:p3m1',
        observation: '*333: all three threefold centres lie on mirrors',
      },
    ],
  },
  'frieze group': {
    title: 'Frieze group',
    summary:
      'The symmetry group of a pattern periodic in one direction only — a border, a strip, a decorated edge. There are exactly 7, separated by three questions: a mirror across the strip, a mirror along it, a half-turn.',
    examples: [
      {
        object: 'frieze:p1m1',
        observation: 'Mirrors across the strip — Conway calls it sidle',
      },
      {
        object: 'frieze:p11g',
        observation: 'A glide along the strip: footprints of someone walking',
      },
    ],
  },
  'orbifold notation': {
    title: 'Orbifold notation',
    summary:
      'Conway’s naming, read straight off the picture: digits before a * are rotation centres off every mirror, * marks mirrors, digits after it are the orders of the corners where mirror lines cross, and × marks a glide. The 17 wallpaper groups are exactly the symbols whose cost adds to 2.',
    examples: [
      {
        object: 'wallpaper:p4m',
        observation: '*442: mirror corners of order 4, 4 and 2',
      },
      {
        object: 'wallpaper:p6m',
        observation: '*632: the most symmetric wallpaper group there is',
      },
    ],
  },
  'fundamental domain': {
    title: 'Fundamental domain',
    summary:
      'The smallest region the operations rebuild the whole pattern from — the two-dimensional asymmetric unit. Its area is the cell area divided by the order of the point group.',
    examples: [
      {
        object: 'wallpaper:p4m',
        observation: 'One eighth of the square cell, because 4mm has order 8',
      },
      {
        object: 'wallpaper:p1',
        observation: 'The whole cell: nothing but translation to divide it',
      },
    ],
  },
  'plane lattice': {
    title: 'Plane lattice',
    summary:
      'One of the 5 two-dimensional Bravais lattices: oblique, rectangular, centred rectangular, square and hexagonal. Fourteen in three dimensions, five in two, and the argument that limits them is the same.',
    examples: [
      {
        object: 'wallpaper:p3m1',
        observation: 'Hexagonal lattice: a = b, γ = 120°',
      },
      {
        object: 'wallpaper:cm',
        observation: 'Centred rectangular, the one that is not primitive',
      },
    ],
  },
};
