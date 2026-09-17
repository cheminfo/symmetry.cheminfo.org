/**
 * Ephemeral cross-component UI state: which page is open, what each workbench
 * is showing, where the student is in the tutorial, which exercise is open.
 *
 * Session-only. The page and everything in this file are mirrored into the
 * address by `src/share/route.ts`, and exercise *progress* lives in
 * `preferences` because it is the student's work, not a transient mode.
 */

import { signal } from '@preact/signals-react';

import type { SharePartId } from '../share/parts.ts';

import {
  SETTING_RANGE,
  SPACE_GROUP_RANGE,
  SUPERCELL_RANGE,
  TILES_RANGE,
  clampToRange,
} from './ranges.ts';
import type { TabId } from './tabs.ts';
import { DEFAULT_TAB } from './tabs.ts';

/** The plane group the pattern workbench opens on: four-fold, with mirrors. */
export const DEFAULT_PLANE_GROUP = 'p4m';

/** The `view` bucket: plain object, signal leaves, never reassigned. */
export const view = {
  activeTab: signal<TabId>(DEFAULT_TAB),
  tutorial: {
    /** `id` of the step on screen, or `null` for the first one. */
    stepId: signal<string | null>(null),
  },
  exercises: {
    /** `id` of the exercise the Exercises page has open. */
    activeId: signal<string | null>(null),
  },
  catalogue: {
    /**
     * The entry an open catalogue is showing — a point-group slug, a space
     * group number, a wallpaper or frieze id — or `null` for its index.
     */
    itemId: signal<string | null>(null),
  },
  molecules: {
    /** `id` of the library molecule on screen. */
    moleculeId: signal<string | null>(null),
    /** Label of the operation being animated, e.g. `C3^2`, or `null`. */
    operation: signal<string | null>(null),
  },
  crystals: {
    /** International Tables number, 1 to 230. */
    spaceGroupNumber: signal(SPACE_GROUP_RANGE.initial),
    /** Which setting of that group, as an index into its own list. */
    settingIndex: signal(SETTING_RANGE.initial),
    /** `id` of the structure filling the cell, or `null` for an empty one. */
    structureId: signal<string | null>(null),
    /** Cells drawn along each axis. */
    supercell: signal(SUPERCELL_RANGE.initial),
  },
  plane: {
    /** `id` of the wallpaper or frieze group being drawn. */
    groupId: signal(DEFAULT_PLANE_GROUP),
    /** `id` of the motif repeated, or `null` for the default one. */
    motifId: signal<string | null>(null),
    /** Cells repeated along each direction. */
    tiles: signal(TILES_RANGE.initial),
  },
  /**
   * Regions the link asks the page to leave out, from `?hide=`. How the page is
   * being shown, not what the student did, so it is never persisted — an
   * embedded frame states it on every load.
   */
  hidden: signal<readonly SharePartId[]>([]),
  /**
   * Whether the link frames the page, from `?embed`: no header, no bar, no
   * footer. Never persisted, for the same reason as {@link view.hidden}.
   */
  embedded: signal(false),
};

/**
 * Open a page.
 * @param tab - Page to show.
 */
export function setActiveTab(tab: TabId): void {
  view.activeTab.value = tab;
}

/**
 * Open a tutorial step, by the id the address carries.
 * @param id - Step id, or `null` for the first step.
 */
export function setTutorialStep(id: string | null): void {
  view.tutorial.stepId.value = id;
}

/**
 * Open an exercise, or close the current one.
 * @param id - Exercise id, or `null` to show the list alone.
 */
export function setActiveExercise(id: string | null): void {
  view.exercises.activeId.value = id;
}

/**
 * Open one entry of a catalogue, or its index.
 * @param id - The entry, or `null` for the index.
 */
export function setCatalogueItem(id: string | null): void {
  view.catalogue.itemId.value = id;
}

/**
 * Put a molecule on the workbench.
 * @param id - Library molecule id, or `null` for an empty workbench.
 */
export function selectMolecule(id: string | null): void {
  if (view.molecules.moleculeId.value === id) return;
  view.molecules.moleculeId.value = id;
  // Another molecule has other operations, and an animation left running on a
  // label the new structure does not have would move nothing at all.
  view.molecules.operation.value = null;
}

/**
 * Animate one symmetry operation, or stop animating.
 * @param label - How a chemist writes it, e.g. `S4^3`, or `null`.
 */
export function animateOperation(label: string | null): void {
  view.molecules.operation.value = label;
}

/**
 * Build the cell in another space group.
 * @param number - International Tables number, clamped to 1 to 230.
 */
export function selectSpaceGroup(number: number): void {
  const clamped = clampToRange(number, SPACE_GROUP_RANGE);
  if (view.crystals.spaceGroupNumber.value === clamped) return;
  view.crystals.spaceGroupNumber.value = clamped;
  // A setting index only means anything inside one group's own list.
  view.crystals.settingIndex.value = SETTING_RANGE.initial;
}

/**
 * Choose which setting of the current space group is in force.
 * @param index - Index into that group's settings.
 */
export function selectSetting(index: number): void {
  view.crystals.settingIndex.value = clampToRange(index, SETTING_RANGE);
}

/**
 * Fill the cell with one of the structures the site ships.
 * @param id - Structure id, or `null` for an empty cell.
 */
export function selectStructure(id: string | null): void {
  view.crystals.structureId.value = id;
}

/**
 * Draw more of the crystal than one cell.
 * @param cells - Cells along each axis, clamped to what the page can draw.
 */
export function setSupercell(cells: number): void {
  view.crystals.supercell.value = clampToRange(cells, SUPERCELL_RANGE);
}

/**
 * Draw another plane group.
 * @param id - Wallpaper or frieze group id, e.g. `p4g`.
 */
export function selectPlaneGroup(id: string): void {
  view.plane.groupId.value = id;
}

/**
 * Repeat another motif.
 * @param id - Motif id, or `null` for the default one.
 */
export function selectMotif(id: string | null): void {
  view.plane.motifId.value = id;
}

/**
 * Repeat the pattern over more of the page.
 * @param cells - Cells along each direction, clamped to what it can draw.
 */
export function setTiles(cells: number): void {
  view.plane.tiles.value = clampToRange(cells, TILES_RANGE);
}

/**
 * Leave out the parts a shared link named.
 * @param parts - Regions to drop; an empty list shows the whole page.
 */
export function setHiddenParts(parts: readonly SharePartId[]): void {
  view.hidden.value = parts;
}

/**
 * Frame the page without its chrome, or give the chrome back.
 * @param embedded - True to drop the header and the footer.
 */
export function setEmbedded(embedded: boolean): void {
  view.embedded.value = embedded;
}
