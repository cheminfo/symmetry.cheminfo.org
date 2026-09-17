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
export { clearStoredBucket, persistBucket } from './persist.ts';
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
export type { NumberRange } from './ranges.ts';
export {
  SETTING_RANGE,
  SPACE_GROUP_RANGE,
  SUPERCELL_RANGE,
  TILES_RANGE,
  clampToRange,
} from './ranges.ts';
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
export { DEFAULT_PLANE_GROUP } from './view.ts';
export {
  animateOperation,
  focusCrystalElement,
  selectMolecule,
  selectMotif,
  selectPlaneGroup,
  selectSetting,
  selectSpaceGroup,
  selectStructure,
  setActiveExercise,
  setActiveTab,
  setCatalogueItem,
  setEmbedded,
  setHiddenParts,
  setSupercell,
  setTiles,
  setTutorialStep,
} from './view.ts';
