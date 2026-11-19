/**
 * The symmetry elements of a crystal, placed in its cell for the 3D view.
 *
 * Everything the view draws them with — the cell, the shapes, the labels, the
 * canvas — is `react-cheminfo/crystal3d`'s; what stays here reads this site's
 * own analysis of a space group.
 */

export type { CellShift } from './cellElements.ts';
export { NO_SHIFT, cellShiftFor, cellShifts } from './cellElements.ts';
export type { CrystalDrawingOptions, ElementLocus } from './crystalDrawing.ts';
export { crystalElementDrawing, elementLocus } from './crystalDrawing.ts';
