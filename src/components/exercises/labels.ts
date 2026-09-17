/**
 * What a box is called, and what kind of box it is.
 *
 * The validator keys every answer by the engine's own name — `mirrorPlanes`,
 * `laueClass` — and a student must not be asked to read those. One table, so
 * the wording is the same in the form, in the list and on the solution line.
 */

import type {
  CountableQuantity,
  ExerciseKind,
  SpaceGroupField,
} from '../../data/exercises/types.ts';

/** How a quantity is asked for. */
export const QUANTITY_LABEL: Record<CountableQuantity, string> = {
  order: 'Order h',
  classes: 'Classes',
  irreps: 'Irreducible representations',
  mirrorPlanes: 'Mirror planes',
  properAxes: 'Proper rotation axes',
  improperOperations: 'Improper operations',
  vibrations: 'Vibrational modes',
  infraredActiveIrreps: 'Infrared-active rows',
  ramanActiveIrreps: 'Raman-active rows',
  generalPositions: 'General positions',
  latticePoints: 'Lattice points per cell',
  settings: 'Settings in the Tables',
  operationsPerCell: 'Operations per cell',
};

/** How a fact of a space group is asked for. */
export const FIELD_LABEL: Record<SpaceGroupField, string> = {
  number: 'International Tables number',
  crystalSystem: 'Crystal system',
  centring: 'Centring letter',
  generalPositions: 'General positions',
  centrosymmetric: 'Centrosymmetric',
  sohncke: 'Sohncke',
  crystalClass: 'Crystal class',
  laueClass: 'Laue class',
};

/** One word for what a question asks, for the tag in the list. */
export const KIND_LABEL: Record<ExerciseKind, string> = {
  'assign-point-group': 'assign',
  select: 'select',
  count: 'count',
  'character-row': 'characters',
  reduce: 'reduce',
  'identify-plane-group': 'identify',
  'space-group-facts': 'read',
  'place-atom': 'build',
  multiply: 'multiply',
};

/** What kind of box a fact is answered in. */
export type FieldInput =
  | { readonly kind: 'number' }
  | { readonly kind: 'text' }
  | { readonly kind: 'choice'; readonly options: readonly string[] };

/** The box a fact takes: a number, a yes/no, a list, or free text. */
export function fieldInput(field: SpaceGroupField): FieldInput {
  switch (field) {
    case 'number':
    case 'generalPositions': {
      return { kind: 'number' };
    }
    case 'centrosymmetric':
    case 'sohncke': {
      return { kind: 'choice', options: ['yes', 'no'] };
    }
    case 'crystalSystem': {
      return { kind: 'choice', options: CRYSTAL_SYSTEMS };
    }
    case 'centring': {
      return { kind: 'choice', options: CENTRING_LETTERS };
    }
    case 'crystalClass':
    case 'laueClass': {
      return { kind: 'text' };
    }
    // no default
  }
}

const CRYSTAL_SYSTEMS: readonly string[] = [
  'triclinic',
  'monoclinic',
  'orthorhombic',
  'tetragonal',
  'trigonal',
  'hexagonal',
  'cubic',
];

const CENTRING_LETTERS: readonly string[] = ['P', 'A', 'B', 'C', 'I', 'F', 'R'];
