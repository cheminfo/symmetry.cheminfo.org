import type { Exercise } from './types.ts';

/** Naming the plane group of a repeating pattern. */
export const PATTERN_EXERCISES: readonly Exercise[] = [
  {
    id: 'wallpaper-p4m',
    kind: 'identify-plane-group',
    level: 'intermediate',
    title: 'Name this wallpaper',
    pattern: {
      motif: 'pinwheel-mirrored',
      namespace: 'wallpaper',
      group: 'p4m',
      cell: { a: 1, b: 1, gamma: 90 },
    },
    description:
      'Find the highest-order rotation centre in the pattern, then ask whether mirror lines run through it. The [[wallpaper group|17 wallpaper groups]] are separated by those two questions plus one about glides.',
    nearMisses: [
      {
        group: 'p4',
        why: 'p4 has the fourfold centres and no mirrors at all. Look along the cell edge: the pattern reflects across it.',
      },
      {
        group: 'p4g',
        why: 'in p4g the fourfold centres do not lie on mirror lines — the mirrors miss them and glides run between. Here every fourfold centre sits where two mirrors cross.',
      },
      {
        group: 'pmm',
        why: 'the highest rotation in pmm is twofold, and turning this pattern by 90° brings it back.',
      },
    ],
    hints: [
      'Turn the pattern by 90° and see whether it comes back.',
      'A fourfold centre lies on a mirror line, and another kind of fourfold centre sits at the cell corner.',
      'p4m, orbifold *442: mirrors through both kinds of fourfold centre and through the twofold centres between them.',
    ],
    solution: 'p4m',
  },
  {
    id: 'frieze-sidle',
    kind: 'identify-plane-group',
    level: 'intermediate',
    title: 'Name this border pattern',
    pattern: {
      motif: 'boot',
      namespace: 'frieze',
      group: 'p1m1',
      cell: { a: 1, b: 1, gamma: 90 },
    },
    description:
      'A strip pattern repeats in one direction only, so it belongs to one of the 7 [[frieze group|frieze groups]]. Ask three questions: a mirror across the strip, a mirror along it, a half-turn. Name the group from the answers.',
    nearMisses: [
      {
        group: 'p11m',
        why: 'p11m has the mirror along the strip, so each motif is reflected top to bottom. Here the mirror lines are vertical, across it.',
      },
      {
        group: 'p1',
        why: 'p1 has translation only. Look at any two neighbouring motifs: one is the mirror image of the other.',
      },
      {
        group: 'p2mm',
        why: 'p2mm needs both mirror directions at once, and there is no horizontal mirror here.',
      },
    ],
    hints: [
      'Seven groups, three questions: vertical mirror, horizontal mirror, half-turn.',
      'Hold a mirror perpendicular to the strip, between two motifs, and the pattern comes back.',
      'Vertical mirrors only, no horizontal mirror and no rotation: p1m1, the one Conway calls sidle.',
    ],
    solution: 'p1m1',
  },
  {
    id: 'wallpaper-p31m',
    kind: 'identify-plane-group',
    level: 'advanced',
    title: 'p3m1 or p31m?',
    pattern: {
      motif: 'triangle-rosette',
      namespace: 'wallpaper',
      group: 'p31m',
      cell: { a: 1, b: 1, gamma: 120 },
    },
    description:
      'Both groups have threefold centres and mirror lines, and telling them apart is the classic trap of the subject. The question is not whether there are mirrors but whether every threefold centre lies on one. Count the kinds of threefold centre before answering.',
    nearMisses: [
      {
        group: 'p3m1',
        why: 'in p3m1 all three kinds of threefold centre lie on mirror lines. Here one kind sits off every mirror, in an open region, which is p31m.',
      },
      {
        group: 'p3',
        why: 'p3 has no mirror at all, and this pattern clearly reflects.',
      },
      {
        group: 'p6m',
        why: 'p6m would come back after a 60° turn. Try it: this pattern does not.',
      },
    ],
    hints: [
      'There are three inequivalent threefold centres in any p3 lattice.',
      'In one of the two groups, one of those three centres does not lie on a mirror line.',
      'p31m, orbifold 3*3: one threefold centre sits free between the mirrors, where p3m1 (*333) has all three on them.',
    ],
    solution: 'p31m',
  },
];
