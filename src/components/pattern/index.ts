/**
 * The plane workbench's own pieces: the two namespaces a link picks a group
 * from, the motif a student draws, and the strip a frieze is drawn on.
 *
 * The tiling, the element diagram and the glyph vocabulary are
 * `src/components/plane`; nothing here redraws them.
 */

export type { FriezeFigureProps } from './FriezeFigure.tsx';
export { FriezeFigure } from './FriezeFigure.tsx';
export type { MotifEditorProps } from './MotifEditor.tsx';
export { MotifEditor } from './MotifEditor.tsx';
export type { PlaneControlsProps } from './PlaneControls.tsx';
export { PlaneControls } from './PlaneControls.tsx';
export type { PlaneGroupPickerProps } from './PlaneGroupPicker.tsx';
export { PlaneGroupPicker } from './PlaneGroupPicker.tsx';
export type { PlaneReadoutProps } from './PlaneReadout.tsx';
export { PlaneReadout } from './PlaneReadout.tsx';
export { copyCaption, copyLabels } from './copyLabel.ts';
export type { DrawnPoint } from './drawnMotif.ts';
export {
  DRAWN_PREFIX,
  MAX_DRAWN_POINTS,
  MIN_DRAWN_POINTS,
  decodeDrawnMotif,
  drawnMotif,
  encodeDrawnMotif,
  isDrawnMotifId,
  motifFor,
} from './drawnMotif.ts';
export { friezeGlyphs, friezeLines } from './friezeElements.ts';
export type { FriezeFrame, StripPoint } from './friezeFrame.ts';
export {
  STRIP_REACH,
  friezeElementShifts,
  friezeFrame,
  friezeShifts,
  motifDomainPoints,
  stripPoint,
} from './friezeFrame.ts';
export { motifDomainEdge, patternMotifScale } from './motifScale.ts';
export type { PlaneFact } from './planeFacts.ts';
export { generatorText, planeGroupFacts } from './planeFacts.ts';
export type { PlaneGroupChoice } from './planeGroupRef.ts';
export {
  DEFAULT_FRIEZE_GROUP,
  FRIEZE_PREFIX,
  planeGroupCell,
  planeGroupId,
  planeGroupOperations,
  resolvePlaneGroup,
} from './planeGroupRef.ts';
