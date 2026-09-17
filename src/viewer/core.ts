/**
 * The half of the viewer that has never heard of molstar.
 *
 * A page that only *builds* a scene — works out which symmetry elements to
 * draw, repeats a cell, measures what it has — imports this and pays nothing:
 * the 2.8 MB molstar chunk hangs off `index.ts`, which is reached through the
 * lazy canvas and nowhere else.
 */

export type { CellEdge } from './cellGeometry.ts';
export {
  cellAxes,
  cellAxisLabelPoints,
  cellEdges,
  cellPoint,
  clampRepeat,
  latticeShifts,
} from './cellGeometry.ts';
export type { CrystalDrawingOptions } from './crystalDrawing.ts';
export { crystalElementDrawing } from './crystalDrawing.ts';
export { mergeDrawings, sameDrawings, withoutDrawings } from './drawingSet.ts';
export type { ElementGroup } from './elementDrawing.ts';
export {
  drawingLabels,
  drawingPrimitives,
  elementGroups,
} from './elementDrawing.ts';
export type { PlaneFrame } from './frame.ts';
export { perpendicularTo, planeFrame } from './frame.ts';
export type { SceneSphere } from './framing.ts';
export {
  boundingSphereOf,
  framedRadius,
  primitivesExtent,
  unionSpheres,
} from './framing.ts';
export type { Matrix4 } from './operationMatrix.ts';
export {
  IDENTITY_MATRIX4,
  ROTATION_PHASE,
  operationAt,
  operationIsRigid,
  operationMatrix,
} from './operationMatrix.ts';
export {
  CELL_COLOUR,
  ELEMENT_COLOURS,
  LABEL_COLOUR,
  drawingColour,
} from './palette.ts';
export type {
  ElementStyle,
  MeshPrimitive,
  ResolvedElementStyle,
  TextItem,
} from './primitives.ts';
export {
  DEFAULT_ELEMENT_STYLE,
  primitivePoints,
  resolveElementStyle,
} from './primitives.ts';
export { toXyzText } from './structureText.ts';
export { supercellAtoms } from './supercell.ts';
export type {
  CellRepeat,
  DrawingBase,
  GlideDrawing,
  InversionDrawing,
  MirrorDrawing,
  Point3,
  RotationDrawing,
  RotoinversionDrawing,
  ScrewDrawing,
  SymmetryDrawing,
  SymmetryDrawingKind,
  UnitCell,
  ViewerAtom,
  ViewerOperation,
} from './types.ts';
