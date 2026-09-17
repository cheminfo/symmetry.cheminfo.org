/**
 * The molecule workbench: the library, the structure, and the reading of it.
 *
 * Nothing here imports molstar — the canvas is reached through `ViewerPanel`,
 * which is behind a lazy boundary — so a page that only wants the operations or
 * the character table pays nothing for the 3D.
 *
 * `CharacterTable`, `FlowchartPanel` and `LayerChips` are the tutorial's and the
 * exercises' too. A table printed twice would be two ideas of what a class
 * header is called, and the same group would read differently on two pages.
 */

export type { FlowStep, MoleculeAnalysis, MoleculeFlow } from './assignment.ts';
export {
  DEFAULT_TOLERANCE,
  analyseMolecule,
  flowSteps,
  moleculeFlow,
} from './assignment.ts';
export type {
  CharacterTableProps,
  NoCharacterTableProps,
} from './CharacterTable.tsx';
export { CharacterTable, NoCharacterTable } from './CharacterTable.tsx';
export type { CharacterCell } from './characterCells.ts';
export { byClass } from './characterCells.ts';
export type { SymbolParts } from './characters.ts';
export { formatCharacter, formatFunction, symbolParts } from './characters.ts';
export type { ElementLayers } from './elements.ts';
export { atomicExtent, linearElements, moleculeElements } from './elements.ts';
export { questionEvidence, symbol } from './evidence.ts';
export type { FlowchartPanelProps } from './FlowchartPanel.tsx';
export { FlowchartPanel } from './FlowchartPanel.tsx';
export type { GroupSummaryProps } from './GroupSummary.tsx';
export { GroupSummary } from './GroupSummary.tsx';
export type { LayerChipsProps } from './LayerChips.tsx';
export { LayerChips } from './LayerChips.tsx';
export type { LibrarySection } from './library.ts';
export {
  DEFAULT_MOLECULE_ID,
  librarySections,
  resolveMolecule,
} from './library.ts';
export type { MoleculePickerProps } from './MoleculePicker.tsx';
export { MoleculePicker } from './MoleculePicker.tsx';
export type { MoleculeViewProps } from './MoleculeView.tsx';
export { MoleculeView } from './MoleculeView.tsx';
export type { ClassMember, OperationClass } from './operationClasses.ts';
export { operationClasses } from './operationClasses.ts';
export type { OperationLabelProps } from './OperationLabel.tsx';
export { OperationLabel } from './OperationLabel.tsx';
export type { OperationLabelParts } from './operationNames.ts';
export {
  indexOfName,
  operationLabelParts,
  operationNames,
} from './operationNames.ts';
export type { OperationListProps } from './OperationList.tsx';
export { OperationList } from './OperationList.tsx';
export { orbitDrawings, orbitOf } from './orbit.ts';
export type { ProseProps } from './Prose.tsx';
export { Prose } from './Prose.tsx';
export type { SymbolTextProps } from './SymbolText.tsx';
export { SymbolText } from './SymbolText.tsx';
export { operationDescription, viewerOperationOf } from './viewerOperation.ts';
