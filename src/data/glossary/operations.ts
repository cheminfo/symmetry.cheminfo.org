import type { SymmetryGlossaryEntry } from './types.ts';

/** What an operation is, and the five kinds there are. */
export const OPERATION_TERMS: Record<string, SymmetryGlossaryEntry> = {
  'symmetry operation': {
    title: 'Symmetry operation',
    summary:
      'A movement that leaves an object indistinguishable from how it started. Every atom lands on an atom of the same element, and nothing you could measure has changed. The operations of one object form a group, and it is the group, not the list, that predicts anything.',
    examples: [
      {
        object: 'molecule:water',
        observation: 'C2 swaps the two hydrogens',
        note: 'Before and after cannot be told apart by any experiment.',
      },
      {
        object: 'molecule:bromochlorofluoromethane',
        observation: 'Only E: no other operation exists',
        note: 'One operation is still a group — the smallest one.',
      },
    ],
  },
  'symmetry element': {
    title: 'Symmetry element',
    summary:
      'The point, line or plane an operation is performed about. One element can carry several operations: a C3 axis carries C3, C3² and E. Elements and operations are therefore never counted together.',
    examples: [
      {
        object: 'molecule:ammonia',
        observation: 'One C3 axis, three operations on it',
        note: 'Ammonia draws 4 elements and has 6 operations.',
      },
    ],
  },
  identity: {
    title: 'Identity, E',
    summary:
      'The operation that does nothing. Every object has it, and leaving it out is the commonest way to get the order of a group wrong. A group needs it, because every operation composed with its own inverse gives it.',
    examples: [
      {
        object: 'molecule:bromochlorofluoromethane',
        observation: 'E is the whole group: C1, order 1',
      },
    ],
  },
  'proper rotation': {
    title: 'Proper rotation, Cₙ',
    summary:
      'A turn of 360°/n about an axis. Cₙ applied k times gives Cₙᵏ, and Cₙⁿ is the identity, so one axis of order n carries n operations counting E. Proper means nothing is reflected: a rotation never turns a left hand into a right one.',
    examples: [
      {
        object: 'molecule:benzene',
        observation: 'C6 through the ring: C6, C6², C6³, C6⁴, C6⁵, E',
        note: 'C6² is C3 and C6³ is C2, so one axis carries several elements.',
      },
      {
        object: 'molecule:ammonia',
        observation: 'C3 through the nitrogen, 120° at a time',
      },
    ],
  },
  'principal axis': {
    title: 'Principal axis',
    summary:
      'The rotation axis of highest order. Every other element is named against it: a plane perpendicular to it is σₕ, one containing it is σᵥ or σd. When two axes share the highest order, the one through most atoms is chosen.',
    examples: [
      {
        object: 'molecule:benzene',
        observation: 'The C6 perpendicular to the ring, not the six C2 in it',
      },
      {
        object: 'molecule:allene',
        observation: 'The C2 along the C=C=C chain, not the two across it',
      },
    ],
  },
  'mirror plane': {
    title: 'Mirror plane, σ',
    summary:
      'A plane whose reflection maps the object onto itself. Reflecting twice returns the original, so σ² = E and a plane carries one operation besides the identity. Anything with a mirror plane is achiral.',
    examples: [
      {
        object: 'molecule:water',
        observation: 'Two planes: the molecular plane and the one across it',
      },
      {
        object: 'molecule:benzene',
        observation: '7 planes: σh, 3σv through carbons, 3σd through bonds',
      },
    ],
  },
  'sigma-h': {
    title: 'σₕ, the horizontal mirror plane',
    summary:
      'A mirror plane perpendicular to the principal axis. Whether one exists is the single question separating Dₙₕ from Dₙd and Cₙₕ from Cₙᵥ, so look for it first once the axes are found.',
    examples: [
      {
        object: 'molecule:boron-trifluoride',
        observation: 'The molecular plane is σh, perpendicular to the C3',
      },
      {
        object: 'molecule:ethane-staggered',
        observation: 'No σh, which is what makes it D3d and not D3h',
      },
    ],
  },
  'sigma-v': {
    title: 'σᵥ, the vertical mirror plane',
    summary:
      'A mirror plane containing the principal axis. A Cₙ axis with n such planes and no σₕ gives Cₙᵥ, the group most small polar molecules belong to.',
    examples: [
      {
        object: 'molecule:water',
        observation: 'Both planes contain the C2, so both are σv: C2v',
      },
      {
        object: 'molecule:ammonia',
        observation: 'Three σv, each through the nitrogen and one hydrogen',
      },
    ],
  },
  'sigma-d': {
    title: 'σd, the dihedral mirror plane',
    summary:
      'A vertical plane bisecting the angle between two C2 axes perpendicular to the principal one. It is a σᵥ geometrically; the separate name records that it falls between the C2 axes, which is what tells Dₙd from Dₙₕ.',
    examples: [
      {
        object: 'molecule:allene',
        observation: 'Two σd, each holding one CH2 group',
      },
      {
        object: 'molecule:ethane-staggered',
        observation: 'Three σd, and no σh at all: D3d',
      },
    ],
  },
  inversion: {
    title: 'Inversion centre, i',
    summary:
      'The operation sending (x, y, z) to (−x, −y, −z) through one point. Applying it twice gives the identity. An object with an inversion centre is never chiral and never polar, and its spectra obey the mutual exclusion rule.',
    examples: [
      {
        object: 'molecule:sulfur-hexafluoride',
        observation: 'Each fluorine maps onto the one opposite the sulfur',
      },
      {
        object: 'molecule:carbon-dioxide',
        observation: 'The centre is at the carbon',
        note: 'This is what makes CO2 D∞h while OCS is only C∞v.',
      },
      {
        object: 'molecule:water',
        observation: 'None, which is why water has a dipole moment',
      },
    ],
  },
  'improper rotation': {
    title: 'Improper rotation, Sₙ',
    summary:
      'A rotation by 360°/n followed by a reflection in the plane perpendicular to that axis. Neither half need be a symmetry operation on its own, which is what makes Sₙ worth a name. S₁ is a mirror and S₂ an inversion, so the interesting cases start at S₄.',
    examples: [
      {
        object: 'molecule:allene',
        observation: 'S4 along the chain',
        note: 'Allene has neither C4 nor σh — only the two together.',
      },
      {
        object: 'molecule:methane',
        observation: 'Three S4, each along an H–C–H bisector',
      },
      {
        object: 'molecule:ethane-staggered',
        observation: 'S6 along the C–C bond, whose cube is the inversion',
      },
    ],
  },
  'order of an operation': {
    title: 'Order of an operation',
    summary:
      'How many times an operation must be repeated to give the identity. σ and i have order 2, Cₙ has order n, and Sₙ has order n for even n but 2n for odd n — S3 repeated three times is σₕ, not E.',
    examples: [
      {
        object: 'molecule:ethane-staggered',
        observation: 'S6 has order 6, and S6³ is the inversion centre',
      },
    ],
  },
};
