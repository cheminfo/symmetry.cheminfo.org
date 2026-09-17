import type { Exercise } from './types.ts';

/** Counting a group: operations, classes, elements, bands. */
export const COUNT_EXERCISES: readonly Exercise[] = [
  {
    id: 'order-of-ammonia',
    kind: 'count',
    level: 'beginner',
    title: 'How big is ammonia’s group?',
    object: 'molecule:ammonia',
    asked: ['order', 'classes', 'mirrorPlanes'],
    description:
      'Count ammonia’s operations, its [[class|classes]] and its mirror planes. They are three different numbers, and the gap between the first two is the whole reason a character table is narrow.',
    answer: { order: 6, classes: 3, mirrorPlanes: 3 },
    hints: [
      'One C3 axis carries three operations, not one: C3, C3² and E.',
      'The three mirror planes are interchanged by the rotations, so they form a single class.',
      '6 operations — E, C3, C3², 3σv — in 3 classes: E, 2C3, 3σv.',
    ],
    solution: 'order 6, 3 classes, 3 mirror planes',
  },
  {
    id: 'benzene-elements',
    kind: 'count',
    level: 'beginner',
    title: 'Count benzene’s symmetry',
    object: 'molecule:benzene',
    asked: ['order', 'mirrorPlanes', 'properAxes'],
    requiredDisplay: ['axes', 'mirrors'],
    description:
      'Count benzene’s mirror planes and its proper rotation axes, then the [[order of a group|order]] of the whole group. The two counts come out the same, which is worth noticing rather than trusting.',
    answer: { order: 24, mirrorPlanes: 7, properAxes: 7 },
    hints: [
      'The six C2 axes lie in the ring plane and the C6 is perpendicular to it.',
      'Three planes hold opposite carbons, three hold opposite bond midpoints, and one is the ring plane.',
      '7 axes (C6 and six C2), 7 planes (σh, 3σv, 3σd), and D6h has order 24.',
    ],
    solution: 'order 24, 7 mirror planes, 7 proper axes',
  },
  {
    id: 'classes-and-irreps',
    kind: 'count',
    level: 'intermediate',
    title: 'Classes, irreps and dimensions in Td',
    object: 'molecule:methane',
    asked: ['order', 'classes', 'irreps'],
    description:
      'Count the operations of Td, then its [[class|classes]]. The number of [[irreducible representation|irreducible representations]] is fixed by one of those two numbers and not the other. Work out which, then check it against 1 + 1 + 4 + 9 + 9 = 24.',
    answer: { order: 24, classes: 5, irreps: 5 },
    hints: [
      'The classes of Td are E, 8C3, 3C2, 6S4 and 6σd.',
      'Rows equal classes, always — never operations.',
      '24 operations in 5 classes, so 5 irreps: A1, A2, E, T1 and T2, of dimensions 1, 1, 2, 3 and 3.',
    ],
    solution: 'order 24, 5 classes, 5 irreps',
  },
  {
    id: 'activity-c2h',
    kind: 'count',
    level: 'advanced',
    title: 'Mutual exclusion in C₂ₕ',
    object: 'pointGroup:c2h',
    asked: ['irreps', 'infraredActiveIrreps', 'ramanActiveIrreps'],
    description:
      'C₂ₕ holds an inversion centre, so the [[mutual exclusion rule]] applies. Count its [[irreducible representation|irreps]], then how many of them carry x, y or z, and how many carry a quadratic function. The two counts add to the first, and no row is in both.',
    answer: { irreps: 4, infraredActiveIrreps: 2, ramanActiveIrreps: 2 },
    hints: [
      'Read the two right-hand columns of the table rather than working anything out.',
      'A g row is symmetric under inversion and a u row is antisymmetric; x, y and z are all u.',
      '4 irreps: Au and Bu are infrared active, Ag and Bg are Raman active, and none is both.',
    ],
    solution: '4 irreps, 2 infrared active, 2 Raman active',
  },
  {
    id: 'co2-vibrations',
    kind: 'count',
    level: 'advanced',
    title: 'How many vibrations does CO₂ have?',
    object: 'molecule:carbon-dioxide',
    asked: ['vibrations'],
    description:
      'CO₂ is linear, so it has 3N − 5 vibrations and not 3N − 6. Work out how many. Two of them are [[degenerate]] and share one band, which is why the spectrum shows fewer lines than there are modes.',
    answer: { vibrations: 4 },
    hints: [
      'A linear molecule needs only two angles to fix its orientation, not three.',
      'Three atoms, so 3N is 9, and five of those are translation and rotation.',
      '4 modes: a symmetric stretch, an antisymmetric stretch, and a degenerate pair of bends.',
    ],
    solution: '4 vibrations',
  },
];
