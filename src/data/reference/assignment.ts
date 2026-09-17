import type { SymmetrySection } from './types.ts';
import { row } from './types.ts';

/** The questions, in order. Getting the order right is the whole skill. */
export const FLOWCHART_SECTION: SymmetrySection = {
  id: 'flowchart',
  title: 'Assigning a point group',
  intro: 'Ask them in this order. Out of order, a tetrahedron becomes C₃ᵥ.',
  level: 'beginner',
  rows: [
    row('1. Linear?', 'Yes → i present? D∞ₕ, else C∞ᵥ. Stop.'),
    row(
      '2. Two or more Cₙ, n ≥ 3?',
      'Yes → i present? Oₕ or Iₕ, else Td. Stop.',
    ),
    row(
      '3. Any Cₙ at all?',
      'No → σ present? Cs, else i present? Ci, else C₁. Stop.',
    ),
    row(
      '4. n C₂ across the principal Cₙ?',
      'Yes → question 5. No → question 6.',
    ),
    row('5a. σₕ?', 'Yes → Dₙₕ.'),
    row('5b. n σd?', 'Yes → Dₙd. Otherwise Dₙ.'),
    row('6a. σₕ?', 'Yes → Cₙₕ.'),
    row('6b. n σᵥ?', 'Yes → Cₙᵥ.'),
    row('6c. S₂ₙ?', 'Yes → S₂ₙ. Otherwise Cₙ.'),
  ],
};

/** How to read a table, and the two checks that catch an arithmetic slip. */
export const CHARACTER_SECTION: SymmetrySection = {
  id: 'character-tables',
  title: 'Reading a character table',
  level: 'intermediate',
  rows: [
    row('A', 'One-dimensional, symmetric under the principal rotation.'),
    row('B', 'One-dimensional, antisymmetric under it.'),
    {
      syntax: 'E',
      description:
        'Two-dimensional. χ(E) = 2. Not the identity operation — read the column.',
      tooltip: {
        syntax: 'E',
        name: 'Two-dimensional irreducible representation',
        tag: 'a row, not an operation',
        summary:
          'A row named E is a doubly degenerate representation; the column named E is the identity.',
        detail:
          'The clash of names is historical and there is nothing to be done about it. Read the position: a row label sits at the left, a class header along the top. A group with an E row can have degenerate levels; C₂ᵥ, whose rows are all one-dimensional, cannot.',
        example: {
          code: 'E',
          input: 'C3v: E, 2C3, 3σv',
          note: 'The E row reads 2, −1, 0 — and χ(E) = 2 is its dimension.',
        },
      },
    },
    row('T', 'Three-dimensional. χ(E) = 3. Only in the cubic groups.'),
    row(
      '₁ / ₂',
      'Symmetric or antisymmetric under a perpendicular C₂, failing that a σᵥ.',
    ),
    row(
      'g / u',
      'gerade or ungerade: symmetric or antisymmetric under inversion.',
    ),
    row('′ / ″', 'Symmetric or antisymmetric under σₕ.'),
    row('x, y, z', 'In the right-hand column → that row is infrared active.'),
    row('x², xy, …', 'In the right-hand column → that row is Raman active.'),
    row(
      'Rx, Ry, Rz',
      'Rotations. Never a vibration, always subtracted from Γ₃ₙ.',
    ),
    {
      syntax: 'nᵢ = (1/h) Σ g χ χᵢ',
      description:
        'The reduction formula. g is the class size. Always a whole number.',
      tooltip: {
        syntax: 'nᵢ = (1/h) Σ g(R) χ(R) χᵢ(R)',
        name: 'Reduction formula',
        tag: 'summed over classes',
        summary:
          'How many times each irreducible representation appears in a reducible one.',
        detail:
          'The sum runs over classes, not operations, which is why the class size g appears as a weight. A fraction anywhere in the answer means the arithmetic went wrong, or Γ was scored wrongly.',
        example: {
          code: 'Γ = (2, 0, 0, 2) in C2v',
          input: 'n(A1) = (2 + 0 + 0 + 2)/4 = 1',
          note: 'Γ = A1 + B2: water’s two O–H stretches.',
        },
      },
    },
    row(
      'Σ dᵢ² = h',
      'The dimension check: 1+1+1+1 = 4 for C₂ᵥ, 1+1+4+9+9 = 24 for Td.',
    ),
  ],
};
