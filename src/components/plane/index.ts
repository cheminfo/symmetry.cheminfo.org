/**
 * The two-dimensional renderers: a wallpaper tiling, an International Tables
 * element diagram, and a stereographic projection — all SVG, because the
 * cheatsheet prints and the share dialog exports.
 */

export type { ElementDiagramProps } from './ElementDiagram.tsx';
export { ElementDiagram } from './ElementDiagram.tsx';
export type { PatternSvgProps } from './PatternSvg.tsx';
export { PatternSvg } from './PatternSvg.tsx';
export type { StereogramProps } from './Stereogram.tsx';
export { Stereogram } from './Stereogram.tsx';
export { clipToBlock } from './clip.ts';
export type {
  DiagramCell,
  DiagramGlyph,
  DiagramLine,
  PlaneDiagram,
} from './diagram.ts';
export { planeDiagram, planeDiagramOf } from './diagram.ts';
export type { PatternFrame } from './frame.ts';
export { blockCorners, coveringShifts, patternFrame } from './frame.ts';
export {
  GLYPH,
  circlePath,
  commaPath,
  lensPath,
  polygonPath,
  rotationGlyphPath,
  squarePath,
} from './glyphs.ts';
export type { Motif, MotifPath } from './motifs.ts';
export { MOTIFS, motifById } from './motifs.ts';
export { DRAWING_DECIMALS, round } from './precision.ts';
export type {
  Stereogram as StereogramData,
  StereogramAxis,
  StereogramOptions,
  StereogramPoint,
} from './stereogram.ts';
export { stereogramOf } from './stereogram.ts';
export type { StereogramMirror } from './stereographic.ts';
export {
  PROBE_DIRECTION,
  canonicalNormal,
  mirrorTrace,
  primitiveCirclePath,
  stereographic,
} from './stereographic.ts';
export type { PatternCopy } from './transforms.ts';
export {
  basisTransform,
  cellBasis,
  copyTransform,
  patternCopies,
  patternLattice,
  tileShifts,
} from './transforms.ts';
