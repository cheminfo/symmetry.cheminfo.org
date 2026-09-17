/**
 * What a page asks the 3D view to show.
 *
 * It is a plain description — atoms, a cell, a set of elements, an operation to
 * play — so a page can build one without importing anything that pulls molstar
 * in. The canvas that reads it is behind a `React.lazy` boundary, and this type
 * is on the near side of it.
 */

import type {
  CellRepeat,
  ElementStyle,
  SymmetryDrawing,
  UnitCell,
  ViewerAtom,
  ViewerOperation,
} from '../../viewer/core.ts';

/** An operation to apply, and the cue that applies it again. */
export interface OperationPlayback {
  /**
   * Changing this number replays the operation; keeping it leaves the structure
   * where it is. It is a cue rather than a flag so that pressing *Apply* twice
   * plays it twice.
   */
  readonly nonce: number;
  /** What to apply. */
  readonly operation: ViewerOperation;
  /**
   * How long one application takes, milliseconds.
   * @default 900
   */
  readonly durationMs?: number;
}

/** Everything on screen at once. */
export interface ViewerScene {
  /**
   * The atoms, expanded and repeated already, in Cartesian ångström. An empty
   * list draws no structure, which is what an empty workbench shows.
   */
  readonly atoms: readonly ViewerAtom[];
  /**
   * The cell the atoms sit in, when there is one.
   * @default null
   */
  readonly cell?: UnitCell | null;
  /**
   * How many cells the box is drawn around. It does not repeat the atoms —
   * `supercellAtoms` does that, and the page has already called it.
   * @default [1, 1, 1]
   */
  readonly repeat?: CellRepeat;
  /**
   * The symmetry elements drawn over the structure.
   * @default []
   */
  readonly elements?: readonly SymmetryDrawing[];
  /**
   * Whether each element's name floats beside it.
   * @default true
   */
  readonly labels?: boolean;
  /**
   * How thick and how large those elements are drawn. A cell scales it to its
   * own edges, so the same figure reads the same on a 3.9 Å perovskite and a
   * 24 Å zeolite.
   * @default the defaults of `primitives.ts`
   */
  readonly elementStyle?: ElementStyle;
  /**
   * How the atoms are drawn.
   * @default 'ball-and-stick'
   */
  readonly representation?: 'ball-and-stick' | 'spacefill';
  /**
   * An operation waiting to be applied.
   * @default null
   */
  readonly play?: OperationPlayback | null;
  /**
   * Whether the scene turns on its own, for reading a 3D arrangement off a flat
   * screen. It moves the camera, never the structure.
   * @default false
   */
  readonly spinning?: boolean;
}
