/**
 * The nine kinds of question, and what each one stores.
 *
 * **The authored answer is never the source of truth.** The engine in
 * `src/symmetry/` derives it from the object, and the value written here exists
 * so `src/data/__tests__/content.test.ts` can hold the two together: a wrong
 * number in a data file then fails the build rather than a student.
 *
 * `solution` keeps the family's meaning — the sentence shown when a student
 * asks to see the answer. The machine-checked value is `answer`, except where
 * the answer is a single symbol and the two are the same thing.
 */

import type {
  BaseExercise as PedagogicExercise,
  ExerciseLevel,
} from 'react-cheminfo/core';

import type { DisplayFlagKey } from '../../state/displayFlags.ts';
import type { ObjectRef } from '../glossary/types.ts';

import type {
  IdentifyPlaneGroupExercise,
  PlaceAtomExercise,
  SpaceGroupFactsExercise,
} from './crystalTypes.ts';

export type { ExerciseLevel } from 'react-cheminfo/core';

/** What a question asks for. */
export type ExerciseKind =
  /** Type the Schoenflies symbol of a molecule. */
  | 'assign-point-group'
  /** Tick exactly the members of a set: operations, reflections, groups. */
  | 'select'
  /** Type a number for each asked quantity. */
  | 'count'
  /** Fill one blanked-out row of a character table. */
  | 'character-row'
  /** Turn a reducible representation into a sum of irreps. */
  | 'reduce'
  /** Name the wallpaper or frieze group of a drawn pattern. */
  | 'identify-plane-group'
  /** Answer structured questions about one space group. */
  | 'space-group-facts'
  /** Place atoms in a cell so the generated structure meets constraints. */
  | 'place-atom'
  /** Give the single operation a pair composes to. */
  | 'multiply';

/** What every question carries. */
export interface CommonExercise extends Omit<
  PedagogicExercise,
  'solution' | 'level'
> {
  level: ExerciseLevel;
  kind: ExerciseKind;
  /**
   * Layers the question needs switched on, reported apart from the answer the
   * way a missing regex flag is.
   * @default undefined
   */
  requiredDisplay?: DisplayFlagKey[];
}

/** A wrong answer students give, with the sentence that corrects it. */
export interface NearMiss {
  /** The group they answered. */
  group: string;
  /** Why it is not this one, in one or two sentences. */
  why: string;
}

/** Name the point group of a molecule. */
export interface AssignPointGroupExercise extends CommonExercise {
  kind: 'assign-point-group';
  /** `MoleculeEntry.id`; the group is detected from its coordinates. */
  molecule: string;
  /** The `PointGroup.id`, which is both the checked answer and what is shown. */
  solution: string;
  /** At least two, so the question carries negative cases. */
  nearMisses: NearMiss[];
}

/** Which engine answers a `select`. */
export type SelectDomain =
  /** The class labels of the molecule's point group. */
  | 'operation'
  /** Whether a reflection `h k l` is systematically absent. */
  | 'reflection'
  /** Whether a space group is Sohncke. */
  | 'spaceGroup';

/** One checkbox. */
export interface SelectOption {
  /** What the engine is asked about: a class label, `0 3 0`, a group number. */
  id: string;
  /**
   * What the checkbox reads, when it is not the id itself.
   * @default the id
   */
  label?: string;
  /** Why it belongs, or why it does not — the sentence the student reads. */
  reason: string;
}

/** Tick exactly the members of a set. */
export interface SelectExercise extends CommonExercise {
  kind: 'select';
  domain: SelectDomain;
  /** The object the domain is asked about. */
  object: ObjectRef;
  /** The checkboxes, mixing what belongs with what does not. */
  offered: SelectOption[];
  /** Exactly the ids that belong — no more, no fewer. */
  answer: string[];
  solution: string;
}

/** A quantity a `count` can ask for, each derived and none tabulated. */
export type CountableQuantity =
  | 'order'
  | 'classes'
  | 'irreps'
  | 'mirrorPlanes'
  | 'properAxes'
  | 'improperOperations'
  | 'vibrations'
  | 'infraredActiveIrreps'
  | 'ramanActiveIrreps'
  | 'generalPositions'
  | 'latticePoints'
  | 'settings'
  | 'operationsPerCell';

/** Type a number for each asked quantity. */
export interface CountExercise extends CommonExercise {
  kind: 'count';
  object: ObjectRef;
  asked: CountableQuantity[];
  answer: Partial<Record<CountableQuantity, number>>;
  solution: string;
}

/** Complete one blanked-out row of a character table. */
export interface CharacterRowExercise extends CommonExercise {
  kind: 'character-row';
  /** `PointGroup.id` of a group that ships a table. */
  pointGroup: string;
  /** The Mulliken symbol of the blanked row. */
  irrep: string;
  /** Rows shown filled in, so there is something to be orthogonal to. */
  given: string[];
  /** One character per class label, in the table's own spelling. */
  answer: Record<string, number>;
  solution: string;
}

/** What Γ was built from, so the page labels the input honestly. */
export type ReduceBasis = 'stretch' | 'cartesian' | 'vibration' | 'ligand';

/** Reduce a representation to a sum of irreps. */
export interface ReduceExercise extends CommonExercise {
  kind: 'reduce';
  pointGroup: string;
  basis: ReduceBasis;
  /** The reducible characters, one per class, in table order. */
  gamma: number[];
  /** Every irrep of the group, the ones that appear zero times included. */
  answer: Record<string, number>;
  solution: string;
}

/** Give the operation a pair composes to. */
export interface MultiplyExercise extends CommonExercise {
  kind: 'multiply';
  pointGroup: string;
  /** Each row reads "apply b first, then a", and the page says so above it. */
  products: Array<{ a: string; b: string }>;
  /** The operation names offered, as `groupOperationNames` spells them. */
  offered: string[];
  /** One answer per product, in order. */
  answer: string[];
  solution: string;
}

export type {
  CellParameters,
  IdentifyPlaneGroupExercise,
  PatternCell,
  PlaceAtomExercise,
  PlacedAtom,
  SpaceGroupFactsExercise,
  SpaceGroupField,
  StructureConstraint,
} from './crystalTypes.ts';

/** Any question this site asks. */
export type Exercise =
  | AssignPointGroupExercise
  | SelectExercise
  | CountExercise
  | CharacterRowExercise
  | ReduceExercise
  | IdentifyPlaneGroupExercise
  | SpaceGroupFactsExercise
  | PlaceAtomExercise
  | MultiplyExercise;
