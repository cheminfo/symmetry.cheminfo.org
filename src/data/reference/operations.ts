import type { SymmetrySection } from './types.ts';
import { row } from './types.ts';

/** The five kinds of operation, and the three ways a mirror is named. */
export const OPERATION_SECTION: SymmetrySection = {
  id: 'operations',
  title: 'The five kinds of operation',
  level: 'beginner',
  rows: [
    row('E', 'Identity. Every object has it. Order 1.'),
    row('Cₙ', 'Rotation by 360°/n. Carries n operations counting E. Proper.'),
    row('σ', 'Reflection in a plane. σ² = E. Improper.'),
    row('i', 'Inversion through a point: (x, y, z) → (−x, −y, −z). Improper.'),
    {
      syntax: 'Sₙ',
      description:
        'Rotate 360°/n, then reflect perpendicular. Order n for even n, 2n for odd.',
      tooltip: {
        syntax: 'Sₙ',
        name: 'Improper rotation',
        tag: 'rotation-reflection axis',
        summary:
          'Rotate by 360°/n, then reflect in the plane perpendicular to that axis.',
        detail:
          'Neither half need be a symmetry operation on its own, which is the whole reason the operation has a name. S₁ is a mirror and S₂ is an inversion, so both keep their older names. Anything carrying any Sₙ is achiral.',
        example: {
          code: 'S4',
          input: 'allene',
          note: 'Allene has no C4 and no σh — only the two together.',
        },
      },
    },
    row(
      'σₕ',
      'Mirror perpendicular to the principal axis. Separates Dₙₕ from Dₙd.',
    ),
    row('σᵥ', 'Mirror containing the principal axis.'),
    {
      syntax: 'σd',
      description:
        'Mirror containing the axis and bisecting two perpendicular C₂.',
      tooltip: {
        syntax: 'σd',
        name: 'Dihedral mirror plane',
        tag: 'a σᵥ with a job',
        summary:
          'A vertical plane falling between two C₂ axes rather than containing them.',
        detail:
          'Geometrically it is a σᵥ. The separate name records where it sits, and that is exactly what tells Dₙd from Dₙₕ: a group with σd and no σₕ is Dₙd.',
        example: {
          code: '2σd',
          input: 'allene, D2d',
          note: 'Each σd holds one CH2 group and bisects the two C2 axes.',
        },
      },
    },
  ],
};

/** The families, in the order the flowchart reaches them. */
export const FAMILY_SECTION: SymmetrySection = {
  id: 'point-groups',
  title: 'Point-group families',
  level: 'beginner',
  rows: [
    row('C₁', 'E only. h = 1. Chiral, polar. CHFClBr'),
    row('Cs', 'E and σ. h = 2. Achiral, polar. SOCl₂, CH₂ClBr'),
    row('Ci', 'E and i. h = 2. Achiral, non-polar. anti-CHClF–CHClF'),
    row('Cₙ', 'E plus n−1 rotations. h = n. Chiral, polar. H₂O₂ is C₂'),
    row('Cₙᵥ', 'Cₙ with n σᵥ. h = 2n. Achiral, polar. H₂O is C₂ᵥ, NH₃ is C₃ᵥ'),
    row('Cₙₕ', 'Cₙ with σₕ. h = 2n. B(OH)₃ is C₃ₕ, trans-C₂H₂Cl₂ is C₂ₕ'),
    row(
      'Sₙ (n even)',
      'E plus the powers of Sₙ. h = n. Tetraphenylmethane is S₄',
    ),
    row('Dₙ', 'Cₙ with n C₂ across it. h = 2n. Chiral. Ethane at 30° is D₃'),
    row('Dₙₕ', 'Dₙ with σₕ. h = 4n. BF₃ is D₃ₕ, XeF₄ D₄ₕ, benzene D₆ₕ'),
    row(
      'Dₙd',
      'Dₙ with n σd and no σₕ. h = 4n. Allene D₂d, staggered ethane D₃d',
    ),
    row('Td', '4 C₃, 3 C₂, 6 S₄, 6 σd. h = 24. CH₄, P₄, adamantane'),
    row('Oₕ', '3 C₄, 4 C₃, 6 C₂, i, 9 σ. h = 48. SF₆, cubane'),
    row('Iₕ', '6 C₅, 10 C₃, 15 C₂, i. h = 120. C₆₀, B₁₂H₁₂²⁻, dodecahedrane'),
    row('C∞ᵥ', 'Linear, no inversion centre. HCl, HCN, OCS'),
    row('D∞ₕ', 'Linear with an inversion centre. CO₂, C₂H₂'),
  ],
};
