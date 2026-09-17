/**
 * What the rest of the site hands the viewer, and nothing molstar knows about.
 *
 * Every coordinate here is **Cartesian ångström**. The site has already applied
 * its own operations by the time it draws: molstar's space-group expansion
 * silently falls back to `P 1` on five settings this site ships, so nothing in
 * `src/viewer` ever asks it to expand anything.
 */

import type { Vec3 } from '../symmetry/point/vec3.ts';

export type { UnitCell } from '../symmetry/core/index.ts';

/** A point or a direction in Cartesian ångström. */
export type Point3 = Vec3;

/** How many cells to draw along a, b and c. */
export type CellRepeat = readonly [number, number, number];

/** One atom of the scene, already in its final place. */
export interface ViewerAtom {
  /** Element symbol, as `Na`, `Cl`, `C`. */
  readonly element: string;
  /** Where it sits, Cartesian ångström. */
  readonly position: Point3;
}

/** What every drawn symmetry element carries. */
export interface DrawingBase {
  /** Stable across redraws, so one element can be removed on its own. */
  readonly id: string;
  /** What the pointer reads: `C3`, `2₁ along [001]`, `σv`, `n glide`. */
  readonly label: string;
  /**
   * The short form written on the element in the scene — `m`, `3`, `2₁`, `-1`.
   * Forty rods each carrying their full name is a wall of text nobody reads,
   * and the list beside the view says the rest.
   * @default the label
   */
  readonly badge?: string;
  /**
   * Its colour, `#rrggbb`. The kind's own convention is used when absent.
   * @default the convention in `palette.ts`
   */
  readonly colour?: string;
}

/** A proper rotation axis: a rod through `point` along `direction`. */
export interface RotationDrawing extends DrawingBase {
  readonly kind: 'rotation';
  /** A point the axis passes through. */
  readonly point: Point3;
  /** The axis direction; need not be normalised. */
  readonly direction: Point3;
  /** Total rod length, ångström, centred on `point`. */
  readonly length: number;
  /** n of the n-fold, which is what gets labelled. */
  readonly order: number;
}

/** A screw axis: the rod, plus an arrow as long as the pitch beside it. */
export interface ScrewDrawing extends DrawingBase {
  readonly kind: 'screw';
  readonly point: Point3;
  readonly direction: Point3;
  readonly length: number;
  readonly order: number;
  /** The intrinsic translation of one turn, ångström along `direction`. */
  readonly pitch: number;
}

/** A rotoinversion: a dashed rod, with a ball at the inversion point on it. */
export interface RotoinversionDrawing extends DrawingBase {
  readonly kind: 'rotoinversion';
  /** The inversion point, which is where the ball sits. */
  readonly point: Point3;
  readonly direction: Point3;
  readonly length: number;
  readonly order: number;
}

/** A mirror plane: a translucent face through `point`. */
export interface MirrorDrawing extends DrawingBase {
  readonly kind: 'mirror';
  readonly point: Point3;
  /** The plane normal; need not be normalised. */
  readonly normal: Point3;
  /** Side of the drawn square, ångström, when there is no outline. */
  readonly size: number;
  /**
   * The corners the plane is drawn between, in order around it. A crystal
   * hands over the polygon where the plane cuts the cell, which says where it
   * sits far better than a square floating in the middle of one does.
   * @default a square of `size`, spanned by the frame of the normal
   */
  readonly outline?: readonly Point3[];
}

/** A glide plane: the face, plus an arrow in it along the glide vector. */
export interface GlideDrawing extends DrawingBase {
  readonly kind: 'glide';
  readonly point: Point3;
  readonly normal: Point3;
  readonly size: number;
  /** The glide vector itself, ångström, lying in the plane. */
  readonly glide: Point3;
  /**
   * The corners the plane is drawn between, in order around it.
   * @default a square of `size`, spanned by the frame of the normal
   */
  readonly outline?: readonly Point3[];
}

/** An inversion centre: a small ball. */
export interface InversionDrawing extends DrawingBase {
  readonly kind: 'inversion';
  readonly point: Point3;
}

/** One symmetry element as the viewer draws it. */
export type SymmetryDrawing =
  | RotationDrawing
  | ScrewDrawing
  | RotoinversionDrawing
  | MirrorDrawing
  | GlideDrawing
  | InversionDrawing;

/** Which of the six kinds a drawing is. */
export type SymmetryDrawingKind = SymmetryDrawing['kind'];

/**
 * An operation to apply to the structure, so a student watches it map onto
 * itself.
 *
 * A proper rotation and a screw have a rigid path from the identity and are
 * turned through it. The improper three have none, and say so by passing
 * through the plane or the centre rather than around it.
 */
export type ViewerOperation =
  | {
      readonly kind: 'rotation';
      readonly axis: Point3;
      readonly origin: Point3;
      /** n of the n-fold. */
      readonly order: number;
      /**
       * k of `Cₙᵏ`.
       * @default 1
       */
      readonly power?: number;
    }
  | {
      readonly kind: 'screw';
      readonly axis: Point3;
      readonly origin: Point3;
      readonly order: number;
      /** @default 1 */
      readonly power?: number;
      /** The translation of one application, Cartesian ångström. */
      readonly translation: Point3;
    }
  | {
      readonly kind: 'improperRotation';
      readonly axis: Point3;
      readonly origin: Point3;
      readonly order: number;
      /** @default 1 */
      readonly power?: number;
    }
  | { readonly kind: 'mirror'; readonly normal: Point3; readonly point: Point3 }
  | {
      readonly kind: 'glide';
      readonly normal: Point3;
      readonly point: Point3;
      readonly translation: Point3;
    }
  | { readonly kind: 'inversion'; readonly centre: Point3 }
  | {
      readonly kind: 'rotoinversion';
      readonly axis: Point3;
      readonly origin: Point3;
      readonly order: number;
      /** @default 1 */
      readonly power?: number;
    };
