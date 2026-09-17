import type { TutorialStep } from './types.ts';

/** Operations, elements and point groups: eight steps, all in the molecule view. */
export const BEGINNER_STEPS: readonly TutorialStep[] = [
  {
    id: 'mirror-water',
    level: 'beginner',
    title: 'The simplest operation: a mirror plane',
    object: 'molecule:water',
    show: ['mirrors', 'labels'],
    animate: 'σv(xz)',
    observe:
      'Reflect in either plane: the two hydrogens swap, and nothing you could measure has changed.',
    description:
      'A [[symmetry operation]] moves an object onto a copy you cannot tell from the original. Water has two [[mirror plane|mirror planes]]: the one the three atoms lie in, and the one perpendicular to it through the oxygen. Reflect in either and the hydrogens exchange places, which no experiment can detect. The plane is the [[symmetry element]] and the reflection is the operation.',
  },
  {
    id: 'rotation-ammonia',
    level: 'beginner',
    title: 'Turn it, and nothing changes',
    object: 'molecule:ammonia',
    show: ['axes', 'orbit', 'labels'],
    animate: 'C3',
    observe:
      'Three hydrogens, three positions, one axis: C3, then C3 again, then E.',
    description:
      'A [[proper rotation]] Cₙ turns the object by 360°/n about an axis. Ammonia has a C₃ through the nitrogen, so a 120° turn cycles the hydrogens. Do it twice and you get C₃², a different operation; three times and you are back at the [[identity]] E. One element carries three operations, which is how a group grows larger than the picture suggests.',
  },
  {
    id: 'principal-axis-benzene',
    level: 'beginner',
    title: 'The principal axis sets every convention',
    object: 'molecule:benzene',
    show: ['axes', 'labels'],
    observe:
      'One C6 through the ring, six C2 in the ring plane — and they are not all alike.',
    description:
      'Most objects have several axes, and the [[principal axis]] is the one of highest order. Every convention here is measured against it: a [[sigma-h|σₕ]] is perpendicular to it, a [[sigma-v|σᵥ]] contains it. Benzene’s is the C₆ through the ring centre, with six C₂ axes lying in the ring plane. Switch the axes on and look closely: three C₂ pass through opposite carbons and three through opposite bond midpoints, and no operation turns one kind into the other.',
  },
  {
    id: 'inversion-sf6',
    level: 'beginner',
    title: 'Inversion: straight through the centre',
    object: 'molecule:sulfur-hexafluoride',
    show: ['inversion', 'orbit', 'labels'],
    animate: 'i',
    observe:
      'Drag the probe point: its image is always on the far side of the sulfur, at the same distance.',
    description:
      '[[inversion|Inversion]] sends the point (x, y, z) to (−x, −y, −z) through a single centre. SF₆ has one, and each fluorine maps onto the fluorine opposite. That one operation already decides two experiments: anything with an inversion centre is never [[chirality|chiral]] and never [[polarity|polar]]. Water has no inversion centre, which is why it has a dipole moment and SF₆ has none.',
  },
  {
    id: 'improper-allene',
    level: 'beginner',
    title: 'Rotate, then reflect: the improper axis',
    object: 'molecule:allene',
    show: ['improper', 'axes', 'labels'],
    animate: 'S4',
    observe:
      'Neither half of S4 is a symmetry of allene. The two together are.',
    description:
      'An [[improper rotation]] Sₙ is a rotation by 360°/n followed by a reflection in the plane perpendicular to that axis. Neither half need be a symmetry operation on its own: allene’s S₄ is real, while its C₄ alone is not and its σₕ alone is not. S₁ is just a mirror and S₂ is just an inversion, which is why those two keep their older names. Anything carrying an improper operation is superimposable on its mirror image.',
  },
  {
    id: 'flowchart-methane',
    level: 'beginner',
    title: 'Six questions and a name',
    object: 'molecule:methane',
    show: ['axes', 'improper', 'mirrors'],
    panel: 'flowchart',
    observe: 'Four C3 along the C–H bonds, three S4 along the H–C–H bisectors.',
    description:
      'The [[assignment flowchart]] asks the same questions in the same order: linear, more than one axis of order 3 or higher, a principal Cₙ, n C₂ across it, a σₕ, n σd. Methane answers no, then yes — four C₃ axes — and lands in [[td|Td]] before the third question is asked. Follow it on the panel and watch each answer strike out the groups it kills. Knowing the order of the questions matters more than knowing the groups.',
  },
  {
    id: 'order-and-closure',
    level: 'beginner',
    title: 'Counting the group',
    object: 'molecule:water',
    show: ['axes', 'mirrors', 'labels'],
    panel: 'multiplication',
    observe:
      'Four operations, so a 4 × 4 table, and every cell holds one of the same four.',
    description:
      'The [[order of a group|order]] h counts operations, not elements drawn. Water’s [[c2v|C₂ᵥ]] holds exactly four: E, C₂, σᵥ(xz) and σᵥ′(yz). Multiply any two and you land on a third, and that [[closure]] is what makes the set a [[group]] rather than a list. Try σᵥ(xz) then C₂ in the panel: the answer is σᵥ′(yz), every time, and there is no way out of the four.',
  },
  {
    id: 'chirality-polarity',
    level: 'beginner',
    title: 'What symmetry forbids',
    object: 'molecule:bromochlorofluoromethane',
    show: ['mirrors', 'improper', 'labels'],
    observe:
      'No mirror, no inversion, no Sn: only E. Load trans-dichloroethene and all three appear.',
    description:
      'A molecule is [[chirality|chiral]] exactly when its group holds no improper operation — no mirror, no inversion centre, no Sₙ. It is [[polarity|polar]] exactly when its group is C₁, Cs, Cₙ or Cₙᵥ, because only there does a direction survive every operation. CHFClBr is [[c1|C₁]] and is both. Load trans-1,2-dichloroethene, which is [[c2h|C₂ₕ]], and both properties vanish at once.',
  },
];
