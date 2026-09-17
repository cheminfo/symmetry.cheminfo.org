/**
 * The crystal workbench: the library, the cell being built, and the reading of
 * it.
 *
 * Nothing here imports molstar — the canvas is reached through `ViewerPanel`,
 * which is behind a lazy boundary — so the pages that show no cell pay nothing
 * for the 3D.
 */

export type { AtomTableProps } from './AtomTable.tsx';
export { AtomTable } from './AtomTable.tsx';
export type { CellEditorProps } from './CellEditor.tsx';
export { CellEditor } from './CellEditor.tsx';
export type { CellReadoutProps } from './CellReadout.tsx';
export { CellReadout } from './CellReadout.tsx';
export type { CifPanelProps } from './CifPanel.tsx';
export { CifPanel } from './CifPanel.tsx';
export {
  CRYSTAL_LAYERS,
  KIND_ORDER,
  elementBadge,
  elementLabel,
  elementTally,
  sceneCaption,
  settingLabel,
} from './crystalLabels.ts';
export type { SceneCaption } from './crystalLabels.ts';
export type { CrystalAnalysis, CrystalLayers } from './crystalScene.ts';
export {
  LABEL_LIMIT,
  analyseCrystal,
  crystalAtoms,
  crystalDrawings,
  crystalElementStyle,
  drawnElementPoint,
} from './crystalScene.ts';
export type { CrystalViewProps } from './CrystalView.tsx';
export { CrystalView } from './CrystalView.tsx';
export type { GroupPickerProps } from './GroupPicker.tsx';
export { GroupPicker } from './GroupPicker.tsx';
export type {
  ElementsPanelProps,
  PositionsPanelProps,
} from './PositionsPanel.tsx';
export { ElementsPanel, PositionsPanel } from './PositionsPanel.tsx';
export type { StructurePickerProps } from './StructurePicker.tsx';
export { StructurePicker } from './StructurePicker.tsx';
export type { CrystalWorkbench } from './useCrystalDraft.ts';
export {
  DEFAULT_STRUCTURE_ID,
  settingOf,
  useCrystalDraft,
} from './useCrystalDraft.ts';
