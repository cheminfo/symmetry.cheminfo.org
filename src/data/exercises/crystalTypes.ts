/**
 * The kinds of question whose object is a crystal or a pattern.
 *
 * They are split out for the file-size rule alone; `types.ts` re-exports every
 * name, so nothing imports this file directly.
 */

import type { CommonExercise, NearMiss } from './types.ts';

/** The cell a pattern is drawn on. */
export interface PatternCell {
  a: number;
  b: number;
  gamma: number;
}

/** Name the plane group of a drawn pattern. */
export interface IdentifyPlaneGroupExercise extends CommonExercise {
  kind: 'identify-plane-group';
  /** The pattern is generated from this, never read back off pixels. */
  pattern: {
    /** Which drawing the plane workbench repeats. */
    motif: string;
    /** Which of the two namespaces the group belongs to. */
    namespace: 'wallpaper' | 'frieze';
    /** The group that generated the drawing, and the checked answer. */
    group: string;
    cell: PatternCell;
  };
  /** Equals `pattern.group`; both are checked against the catalogue. */
  solution: string;
  nearMisses: NearMiss[];
}

/** A fact about a space group that the setting record answers. */
export type SpaceGroupField =
  | 'number'
  | 'crystalSystem'
  | 'centring'
  | 'generalPositions'
  | 'centrosymmetric'
  | 'sohncke'
  | 'crystalClass'
  | 'laueClass';

/** Read the facts off one space group. */
export interface SpaceGroupFactsExercise extends CommonExercise {
  kind: 'space-group-facts';
  /** International Tables number, 1 to 230 — never a Hermann–Mauguin string. */
  spaceGroupNumber: number;
  /** Which setting of it. */
  variant: number;
  asked: SpaceGroupField[];
  answer: Partial<Record<SpaceGroupField, string | number | boolean>>;
  solution: string;
}

/** One atom, in fractional coordinates. */
export interface PlacedAtom {
  element: string;
  x: number;
  y: number;
  z: number;
}

/** What the generated structure must satisfy. */
export type StructureConstraint =
  | { kind: 'multiplicity'; element: string; count: number; why: string }
  | { kind: 'siteSymmetry'; element: string; symbol: string; why: string }
  | { kind: 'composition'; ratios: Record<string, number>; why: string }
  | { kind: 'minDistance'; angstrom: number; why: string };

/** The six cell parameters, in ångström and degrees. */
export interface CellParameters {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
}

/** Place atoms in a cell so the generated structure is the named one. */
export interface PlaceAtomExercise extends CommonExercise {
  kind: 'place-atom';
  spaceGroupNumber: number;
  variant: number;
  cell: CellParameters;
  /** Atoms already in the cell. */
  given: PlacedAtom[];
  /** What the student adds. */
  asked: { element: string; count: number };
  constraints: StructureConstraint[];
  /** One right answer of possibly several; the constraints accept the others. */
  answer: PlacedAtom[];
  /** Never shown. The tests run them, so the constraints are neither loose nor tight. */
  probes: Array<{ atoms: PlacedAtom[]; shouldPass: boolean; why: string }>;
  solution: string;
}
