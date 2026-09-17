import type { SymmetryGlossaryEntry } from './types.ts';

/** Characters, tables, and what they predict about a spectrum. */
export const REPRESENTATION_TERMS: Record<string, SymmetryGlossaryEntry> = {
  representation: {
    title: 'Representation',
    summary:
      'A set of matrices, one per operation, multiplying the way the operations do. Only their traces are ever used, and those traces are the characters. Any basis you care about — bond vectors, orbitals, displacements — generates one.',
    examples: [
      {
        object: 'molecule:water',
        observation: 'z generates 1, 1, 1, 1; x generates 1, −1, 1, −1',
      },
    ],
  },
  'irreducible representation': {
    title: 'Irreducible representation',
    summary:
      'A representation that cannot be broken into smaller ones. A group has exactly as many as it has classes, and they are the rows of its character table. Every prediction a point group makes is stated in terms of these.',
    examples: [
      {
        object: 'molecule:water',
        observation: '4 irreps: A1, A2, B1, B2, all one-dimensional',
      },
      {
        object: 'molecule:methane',
        observation: '5 irreps, two of them three-dimensional',
        note: 'That is where triple degeneracy comes from.',
      },
    ],
  },
  'reducible representation': {
    title: 'Reducible representation',
    summary:
      'A representation built from a physical basis, almost always a sum of irreducible ones. Its character for an operation is found by counting basis items left in place. Reducing it is how a vibrational analysis is done.',
    examples: [
      {
        object: 'molecule:water',
        observation: 'The two O–H bonds give Γ = 2, 0, 0, 2 = A1 + B2',
      },
      {
        object: 'molecule:ammonia',
        observation: 'All 3N displacements give 12, 0, 2 = 3A1 + A2 + 4E',
      },
    ],
  },
  character: {
    title: 'Character, χ',
    summary:
      'The trace of the matrix representing one operation — the sum of its diagonal. Only the trace matters, because it does not depend on the basis chosen, and every operation in a class has the same one.',
    examples: [
      {
        object: 'molecule:water',
        observation: 'χ(E) is the dimension: 1 for A1, 2 for E, 3 for T',
      },
    ],
  },
  'character table': {
    title: 'Character table',
    summary:
      'One row per irreducible representation, one column per class, and two columns on the right naming the functions that transform as each row. Almost every prediction here is read straight off it, and those right-hand columns give the selection rules.',
    examples: [
      {
        object: 'molecule:water',
        observation: '4 × 4 for C2v, with z in A1 and xy in A2',
      },
      {
        object: 'pointGroup:c3v',
        observation: '3 × 3, because C3v has 3 classes',
      },
    ],
  },
  'mulliken symbol': {
    title: 'Mulliken symbol',
    summary:
      'The name of a row. A and B are one-dimensional, E two, T three; A is symmetric under the principal rotation and B antisymmetric. The subscript records behaviour under a σᵥ or a perpendicular C₂, g and u under inversion, a prime under σₕ.',
    examples: [
      {
        object: 'molecule:water',
        observation: 'B1: one-dimensional, −1 under C2, +1 under σv(xz)',
      },
      {
        object: 'molecule:benzene',
        observation: 'A2u and E1u: u is antisymmetric under inversion',
      },
    ],
  },
  degenerate: {
    title: 'Degenerate',
    summary:
      'Two or more states forced by symmetry to share an energy. A group whose table has an E or a T row can have degenerate levels; C₂ᵥ, whose rows are all one-dimensional, cannot. Degenerate vibrations give one band, not two.',
    examples: [
      {
        object: 'molecule:carbon-dioxide',
        observation: 'The two bends share one band at 667 cm⁻¹',
      },
    ],
  },
  'basis function': {
    title: 'Basis function',
    summary:
      'Whatever is being watched as the operations act: a coordinate, an orbital, a bond vector, a displacement. The right-hand columns of a table list the standard ones, which is what lets a selection rule be read without algebra.',
    examples: [
      {
        object: 'molecule:water',
        observation: 'z is A1, x is B1, y is B2, and Rz is A2',
      },
    ],
  },
  'reduction formula': {
    title: 'Reduction formula',
    summary:
      'nᵢ = (1/h) Σ g(R) χ(R) χᵢ(R), summed over classes, where g(R) is the size of the class. It counts how many times each irreducible representation appears in a reducible one, and the answer is always a whole number — a fraction means a slip.',
    examples: [
      {
        object: 'molecule:water',
        observation: 'Γ = 2, 0, 0, 2 gives n(A1) = (2 + 0 + 0 + 2)/4 = 1',
      },
    ],
  },
  'great orthogonality theorem': {
    title: 'Great orthogonality theorem',
    summary:
      'Two different rows of a character table are orthogonal when weighted by class size, and one row weighted the same way sums to the order. Those two facts are what the reduction formula comes from, and together they fix an entire missing row.',
    examples: [
      {
        object: 'molecule:water',
        observation: 'Σ g χ(A1) χ(B1) = 0, and Σ g χ(B1)² = 4 = h',
      },
    ],
  },
  'direct product': {
    title: 'Direct product',
    summary:
      'Multiply two rows character by character and you get the representation of the product of their basis functions. It is how an integral is decided to vanish: the product must contain the totally symmetric representation, or the integral is zero.',
    examples: [
      {
        object: 'molecule:water',
        observation: 'B1 × B2 = 1, 1, −1, −1, which is A2',
      },
    ],
  },
  'selection rule': {
    title: 'Selection rule',
    summary:
      'A transition is allowed only when a particular direct product contains the totally symmetric representation. For a vibration that reduces to reading a column: x, y or z means infrared active, a quadratic function means Raman active.',
    examples: [
      {
        object: 'molecule:water',
        observation: '2A1 + B2, and every one of those rows carries both',
      },
    ],
  },
  'raman active': {
    title: 'Raman active',
    summary:
      'A vibration whose row carries one of the quadratic functions — x², xy, z² and the rest. Raman scattering probes the polarisability, which is a second-rank tensor, and that is what those quadratic entries are.',
    examples: [
      {
        object: 'molecule:carbon-dioxide',
        observation: 'Only the symmetric stretch at 1388 cm⁻¹ is Raman active',
      },
    ],
  },
  'mutual exclusion rule': {
    title: 'Mutual exclusion rule',
    summary:
      'In a molecule with a centre of inversion no vibration is both infrared and Raman active: the infrared ones are u and the Raman ones g. Seeing one band in both spectra is therefore evidence that there is no inversion centre.',
    examples: [
      {
        object: 'pointGroup:c2h',
        observation: 'Au and Bu carry x, y, z; Ag and Bg carry the quadratics',
        note: 'Four rows, and no row carries both.',
      },
      {
        object: 'molecule:water',
        observation: 'No inversion centre, so all three bands appear in both',
      },
    ],
  },
  'normal mode': {
    title: 'Normal mode',
    summary:
      'One of the 3N − 6 independent vibrations of a molecule, or 3N − 5 if it is linear, in which every atom moves at one frequency and in phase. Each transforms as a single irreducible representation, which is what makes the group treatment work.',
    examples: [
      {
        object: 'molecule:water',
        observation: '3 modes: 2A1 and B2',
      },
      {
        object: 'molecule:ammonia',
        observation: '6 modes: 2A1 + 2E, each E a degenerate pair',
      },
    ],
  },
};
