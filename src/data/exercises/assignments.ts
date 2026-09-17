import type { Exercise } from './types.ts';

/** Name the point group: six molecules, from the obvious to the trap. */
export const ASSIGNMENT_EXERCISES: readonly Exercise[] = [
  {
    id: 'point-group-water',
    kind: 'assign-point-group',
    level: 'beginner',
    title: 'Assign water',
    molecule: 'water',
    description:
      'Give the Schoenflies symbol of water. Walk the [[assignment flowchart]]: not linear, no axis above order 2, one C₂, no C₂ across it, no [[sigma-h|σₕ]], but two [[sigma-v|σᵥ]] containing the axis.',
    nearMisses: [
      {
        group: 'C2h',
        why: 'there is no σh: both of water’s planes contain the C2 axis, so both are σv.',
      },
      {
        group: 'D2h',
        why: 'D2h needs two more C2 axes perpendicular to the first, and water has none.',
      },
      {
        group: 'Cs',
        why: 'Cs stops at a single mirror plane. Water has two, and a C2 where they cross.',
      },
    ],
    hints: [
      'Find the highest-order rotation axis first: everything else is named against it.',
      'Both mirror planes contain the C2 axis, which makes them σv rather than σh.',
      'A Cn axis with n σv planes and no σh is Cnv.',
    ],
    solution: 'C2v',
  },
  {
    id: 'point-group-methane',
    kind: 'assign-point-group',
    level: 'beginner',
    title: 'Assign methane',
    molecule: 'methane',
    description:
      'Give the point group of methane. Question two of the [[assignment flowchart]] — more than one axis of order 3 or higher? — is the only one you need here.',
    nearMisses: [
      {
        group: 'C3v',
        why: 'one C–H bond does carry a C3 with three σv, but there are four such axes and the flowchart asks that question first.',
      },
      {
        group: 'Oh',
        why: 'Oh has a centre of inversion and methane has none: a tetrahedron is not an octahedron.',
      },
      {
        group: 'D4h',
        why: 'the H–C–H angle is 109.5°, not 90°, so methane is not square planar.',
      },
    ],
    hints: [
      'Count the axes of order 3 or higher before anything else.',
      'There is a C3 along each of the four C–H bonds.',
      'Four C3 axes, no inversion centre, three S4: that is Td, order 24.',
    ],
    solution: 'Td',
  },
  {
    id: 'point-group-bf3',
    kind: 'assign-point-group',
    level: 'beginner',
    title: 'Assign boron trifluoride',
    molecule: 'boron-trifluoride',
    description:
      'BF₃ is trigonal planar. Find the principal axis, then ask the two questions that separate the D groups from the C groups: are there n C₂ axes across it, and is there a [[sigma-h|σₕ]]?',
    nearMisses: [
      {
        group: 'C3v',
        why: 'C3v is what ammonia is. BF3 is flat, so it also has three C2 in the plane and a σh, and that is what makes it D.',
      },
      {
        group: 'D3d',
        why: 'D3d has σd bisecting the C2 axes and no σh. The molecular plane of BF3 is a σh.',
      },
      {
        group: 'D3',
        why: 'D3 would mean no mirror plane at all, and BF3 has four.',
      },
    ],
    hints: [
      'A planar molecule always has one mirror plane for free.',
      'Each B–F bond is a C2 axis lying in the molecular plane.',
      'C3, three C2 across it and a σh is D3h, order 12.',
    ],
    solution: 'D3h',
  },
  {
    id: 'point-group-co2',
    kind: 'assign-point-group',
    level: 'beginner',
    title: 'Assign carbon dioxide',
    molecule: 'carbon-dioxide',
    description:
      'CO₂ is linear, which settles question one of the flowchart. Question two is the only one left: is there an [[inversion|inversion centre]]? Load carbonyl sulfide afterwards and ask it again.',
    nearMisses: [
      {
        group: 'Cinfv',
        why: 'C∞v is what OCS and HCN are: linear with no inversion centre. CO2 has one at the carbon, because the two oxygens are identical.',
      },
      {
        group: 'D2h',
        why: 'the molecule is linear, so the axis is C∞ and every plane containing it is a mirror plane.',
      },
    ],
    hints: [
      'A linear molecule has only two possible point groups.',
      'The two ends of CO2 are identical; the two ends of OCS are not.',
      'Linear with a centre of inversion is D∞h.',
    ],
    solution: 'Dinfh',
  },
  {
    id: 'point-group-allene',
    kind: 'assign-point-group',
    level: 'intermediate',
    title: 'Assign allene',
    molecule: 'allene',
    requiredDisplay: ['improper'],
    description:
      'The two CH₂ groups of allene are perpendicular to each other. Find the principal axis, then look for an [[improper rotation]] along it before deciding which D group this is.',
    nearMisses: [
      {
        group: 'D2h',
        why: 'D2h is ethene, which is flat. The two ends of allene are twisted 90° apart, so there is no σh.',
      },
      {
        group: 'C2v',
        why: 'there are two more C2 axes across the principal one, bisecting the two CH2 planes.',
      },
      {
        group: 'D2',
        why: 'D2 has no mirror plane at all, and allene has two σd, each holding one CH2 group.',
      },
    ],
    hints: [
      'The principal axis runs along the C=C=C chain.',
      'Two planes contain the principal axis and bisect the angle between the perpendicular C2 axes, so they are σd.',
      'C2, two C2 across it, two σd and an S4: D2d, order 8.',
    ],
    solution: 'D2d',
  },
  {
    id: 'point-group-ethane',
    kind: 'assign-point-group',
    level: 'intermediate',
    title: 'Assign staggered ethane',
    molecule: 'ethane-staggered',
    description:
      'Ethane in the staggered conformation it sits in at room temperature. Find the C₃, find the three C₂ across it, then decide between D₃ₕ and D₃d by looking for a [[sigma-h|σₕ]].',
    nearMisses: [
      {
        group: 'D3h',
        why: 'D3h is the eclipsed conformer, which has a σh between the two carbons. Load it and compare.',
      },
      {
        group: 'C3v',
        why: 'there are three C2 axes across the C3, each passing between one H of each carbon.',
      },
      {
        group: 'D3',
        why: 'the three σd planes, each holding one C–H of each carbon, are real.',
      },
    ],
    hints: [
      'Rotate one CH3 group and watch which mirror planes survive.',
      'In the staggered form the plane between the carbons is not a mirror: an H above it has no partner below.',
      'No σh but three σd bisecting the C2 axes: D3d, order 12, and it holds an inversion centre.',
    ],
    solution: 'D3d',
  },
];
