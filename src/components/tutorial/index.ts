/**
 * The guided tour's pieces: the prose of a step, its live view, its panel, and
 * the layers it opens with.
 *
 * The character table, the flowchart and the chip bar are the workbench's, from
 * `../molecules`: a step must show a student exactly what the tool will.
 * `SymmetryGlossary` is the Exercises page's too — a glossary mounted twice
 * would define a term two ways.
 */

import './tutorial.css';

export type { GroupProductTableProps } from './GroupProductTable.tsx';
export { GroupProductTable } from './GroupProductTable.tsx';
export type { PlaneStageProps } from './PlaneStage.tsx';
export { PlaneStage } from './PlaneStage.tsx';
export type { PositionsPanelProps } from './PositionsPanel.tsx';
export { PositionsPanel } from './PositionsPanel.tsx';
export type { StepPanelProps } from './StepPanel.tsx';
export { StepPanel } from './StepPanel.tsx';
export type { StepStageProps } from './StepStage.tsx';
export { StepStage } from './StepStage.tsx';
export type { StepTextProps } from './StepText.tsx';
export { StepText } from './StepText.tsx';
export type { SymmetryGlossaryProps } from './SymmetryGlossary.tsx';
export { SymmetryGlossary } from './SymmetryGlossary.tsx';
export type {
  CrystalSceneOptions,
  CrystalSceneResult,
} from './crystalScene.ts';
export { PROBE_POINT, crystalScene, defaultCell } from './crystalScene.ts';
export type { MoleculeElementOptions } from './moleculeElements.ts';
export { moleculeElements, structureRadius } from './moleculeElements.ts';
export type {
  MoleculeSceneOptions,
  MoleculeSceneResult,
} from './moleculeScene.ts';
export { moleculeScene, viewerOperation } from './moleculeScene.ts';
export {
  MODE_TAB,
  applyStepLayers,
  layersOfMode,
  openObject,
  openStepInWorkbench,
  resolveStepIndex,
  useStepLayers,
} from './stepState.ts';
