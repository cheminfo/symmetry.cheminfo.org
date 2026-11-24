/**
 * The one global state of the app: `view`, `data`, `preferences`.
 *
 * Components read leaves directly — `state.preferences.flags.mirrors.value` —
 * after calling `useSignals()`, and call the actions re-exported here. The
 * state is never passed as a prop.
 */

import { data } from './data.ts';
import { preferences } from './preferences.ts';
import { view } from './view.ts';

/** One state, three first-level buckets. Built once, never reassigned. */
export const state = { view, data, preferences };

export type { LoadStatus, SourceBucket } from './data.ts';
export { clearSource, failLoad, setLoaded, startLoad } from './data.ts';
export type { DisplayFlagKey, DisplayFlagMeta } from './displayFlags.ts';
export {
  DISPLAY_FLAGS,
  DISPLAY_FLAG_KEYS,
  isDisplayFlagKey,
} from './displayFlags.ts';
export type {
  ExerciseProgress,
  ExerciseStatus,
  Notation,
} from './preferences.ts';
export {
  clearAllProgress,
  getExerciseProgress,
  resetExercise,
  revealNextHint,
  setDisplayFlag,
  setExerciseStatus,
  setNotation,
  setShowSolution,
  toggleDisplayFlag,
} from './preferences.ts';
export { setViewerSettings, viewerSettings } from './viewerSettings.ts';
export type { NumberRange } from './ranges.ts';
export {
  SETTING_RANGE,
  SPACE_GROUP_RANGE,
  SUPERCELL_RANGE,
  TILES_RANGE,
  clampToRange,
} from './ranges.ts';
export {
  DEFAULT_TUTORIAL_SPLIT,
  DEFAULT_VIEWER_SPLIT,
  TUTORIAL_STACK_BELOW,
  VIEWER_STACK_BELOW,
} from './split.ts';
export type { ReciprocalPhoto, ReciprocalSource } from './reciprocal.ts';
export {
  DEFAULT_MASK_RADIUS,
  DEFAULT_PHASE_FROM,
  MASK_RADIUS_RANGE,
  changeLattice,
  openReciprocalExample,
  openReciprocalPhoto,
  pickSpot,
  rebuiltImage,
  setContrast,
  setMaskKind,
  setMaskRadius,
  setPhaseFrom,
  setPhaseMode,
  setReciprocalRegion,
  setReciprocalSplit2,
  setReciprocalSplit,
  setSpectrumView,
  setSpots,
  setZoom,
  shownLattice,
  sourceImage,
  spectrum,
  transformedImage,
} from './reciprocal.ts';
export type { CatalogueTabId, TabId } from './tabs.ts';
export {
  CATALOGUE_TAB_IDS,
  DEFAULT_TAB,
  NAV_TAB_IDS,
  TAB_IDS,
  TAB_LABELS,
  isCatalogueTab,
  isTabId,
} from './tabs.ts';
export type { ViewerBonds, ViewerPacking } from './view.ts';
export { DEFAULT_PLANE_GROUP, VIEWER_BONDS, VIEWER_PACKINGS } from './view.ts';
export {
  animateOperation,
  focusCrystalElement,
  selectMolecule,
  selectMotif,
  selectPlaneGroup,
  selectSetting,
  selectSpaceGroup,
  selectStructure,
  selectViewerStructure,
  setActiveExercise,
  setActiveTab,
  setCatalogueItem,
  setEmbedded,
  setHiddenParts,
  setSupercell,
  setTiles,
  setTutorialSplit,
  setTutorialStep,
  setViewerBonds,
  setViewerPacking,
  setViewerSplit,
  setViewerSupercell,
} from './view.ts';
