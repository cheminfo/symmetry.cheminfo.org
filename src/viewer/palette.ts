// tokens-ok: file — these colours are subject matter: they tell a 3-fold axis
// from a glide plane in the scene, the way a crystallographic diagram does.
/**
 * What each kind of symmetry element is drawn in.
 *
 * The family's tokens paint the page around the canvas; inside it a colour
 * carries a meaning — proper or improper, axis or plane — so each kind owns
 * one, and a drawing overrides it only when a page has a reason to.
 */

import type { SymmetryDrawingKind } from './types.ts';

/** The colour of each kind, `#rrggbb`. */
export const ELEMENT_COLOURS: Readonly<Record<SymmetryDrawingKind, string>> = {
  rotation: '#1d4ed8',
  screw: '#0f766e',
  rotoinversion: '#7c3aed',
  mirror: '#0891b2',
  glide: '#c2410c',
  inversion: '#be123c',
};

/** The unit cell box, and the lattice repeats drawn around it. */
export const CELL_COLOUR = '#475569';

/** An element's label, and the a/b/c letters on the cell. */
export const LABEL_COLOUR = '#1f2937';

/** The card a label is written on, so it reads over a structure or a plane. */
export const LABEL_CARD_COLOUR = '#ffffff';

/**
 * The colour a drawing is painted in.
 * @param kind - Which of the six it is.
 * @param colour - What the drawing asked for, if anything.
 * @returns The chosen colour, `#rrggbb`.
 */
export function drawingColour(
  kind: SymmetryDrawingKind,
  colour?: string,
): string {
  return colour ?? ELEMENT_COLOURS[kind];
}
