import type { TutorialStep } from './types.ts';

/** Characters, and what they predict: five steps beside the character table. */
export const INTERMEDIATE_STEPS: readonly TutorialStep[] = [
  {
    id: 'classes-c3v',
    level: 'intermediate',
    title: 'Operations fall into classes',
    object: 'molecule:ammonia',
    show: ['axes', 'mirrors', 'labels'],
    panel: 'characterTable',
    observe: 'Six operations, three columns: E, 2C3, 3σv.',
    description:
      'Ammonia’s three mirror planes are not three different things: a rotation of the group turns any one into any other. Operations related that way form one [[class]], and a character table has one column per class, never one per operation. C₃ᵥ has six operations in three classes — E, 2C₃, 3σᵥ — which is why the table is three columns wide. The number of classes is also the number of rows.',
  },
  {
    id: 'representation-basis',
    level: 'intermediate',
    title: 'A representation is what the operations do to a basis',
    object: 'molecule:water',
    show: ['axes', 'mirrors', 'orbit'],
    panel: 'characterTable',
    observe: 'Pick z, then x, then Rz, and read the row that lights up.',
    description:
      'Pick something to watch — the z axis, a p orbital, one O–H stretch — and write down for each operation whether it comes back unchanged or reversed. That list is a [[representation]] and the numbers are [[character|characters]]. For water’s z axis it reads 1, 1, 1, 1, the row named [[mulliken symbol|A₁]]. For x it reads 1, −1, 1, −1, the row named B₁, and that sign difference is what puts one infrared band where another is missing.',
  },
  {
    id: 'character-table-c2v',
    level: 'intermediate',
    title: 'Reading a character table',
    object: 'molecule:water',
    show: ['axes', 'mirrors', 'labels'],
    panel: 'characterTable',
    observe: 'Four classes, four rows, and 1 + 1 + 1 + 1 = 4 = h.',
    description:
      'C₂ᵥ has four rows because the group has four classes. Each row is one [[irreducible representation]], named by a [[mulliken symbol]]: A when the principal rotation leaves it unchanged, B when it reverses it, the subscript for the behaviour under σᵥ. The right-hand columns list which [[basis function|functions]] transform that way, and that is where every [[selection rule]] comes from. The squared dimensions always sum to the [[order of a group|order]].',
  },
  {
    id: 'reduce-water',
    level: 'intermediate',
    title: 'Reducing a reducible representation',
    object: 'molecule:water',
    show: ['axes', 'mirrors'],
    panel: 'characterTable',
    observe:
      'Count unmoved bonds: 2, 0, 0, 2. Then let the formula do the rest.',
    description:
      'Build a [[reducible representation]] from the two O–H bonds by counting how many each operation leaves in place: E leaves 2, C₂ leaves 0, σᵥ(xz) leaves 0, σᵥ′(yz) leaves 2. So Γ is 2, 0, 0, 2. The [[reduction formula]] turns it into A₁ + B₂, the symmetric and the antisymmetric stretch. Water’s two stretching bands, at 3657 and 3756 cm⁻¹, are exactly those two rows.',
  },
  {
    id: 'selection-rules',
    level: 'intermediate',
    title: 'What the table predicts',
    object: 'molecule:trans-dichloroethene',
    show: ['axes', 'mirrors', 'inversion'],
    panel: 'characterTable',
    observe:
      'Au and Bu carry x, y and z. Ag and Bg carry the quadratics. No row carries both.',
    description:
      'A vibration is infrared active when its row carries x, y or z, and [[raman active]] when it carries a quadratic function. In water, whose rows carry both, all three bands appear in both spectra. trans-1,2-dichloroethene has an inversion centre, so the [[mutual exclusion rule]] applies and no vibration is ever both. Read the two right-hand columns of C₂ₕ and the split is there before any sample is measured.',
  },
];
