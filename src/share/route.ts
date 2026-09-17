/**
 * The two directions between the view state and the address.
 *
 * A link is the whole configuration of what is on screen: the page, the entry
 * it has open, what each workbench is showing, which layers it is drawn with,
 * whether it is framed, and the parts a course page asked to leave out. Both
 * functions are plain state code — no React — so the round trip is unit-tested
 * without a DOM.
 */

import { batch } from '@preact/signals-react';

import { structureById } from '../data/structures/index.ts';
import type { DisplayFlagKey } from '../state/index.ts';
import {
  DISPLAY_FLAGS,
  animateOperation,
  isCatalogueTab,
  selectMolecule,
  selectMotif,
  selectPlaneGroup,
  selectSetting,
  selectSpaceGroup,
  selectStructure,
  setActiveExercise,
  setActiveTab,
  setCatalogueItem,
  setDisplayFlag,
  setEmbedded,
  setHiddenParts,
  setSupercell,
  setTiles,
  setTutorialStep,
  state,
} from '../state/index.ts';
import type { TabId } from '../state/tabs.ts';
import type { Route } from '../utils/router.ts';

import { EMBED_PARAM, parseEmbed } from './embed.ts';
import {
  FLAGS_PARAM,
  defaultFlagsValue,
  parseFlags,
  serializeFlags,
} from './flags.ts';
import { parseHidden, serializeHidden } from './hidden.ts';
import type { ShareParamSet } from './params.ts';
import { SHARE_PARAMS, readShareParams } from './params.ts';
import { HIDE_PARAM } from './parts.ts';

/** The query name of the space group, so the two readers cannot disagree. */
const SPACE_GROUP_PARAM = 'spaceGroup';

/**
 * Where the state says the visitor is, as a route.
 *
 * Reads signals, so it is meant to be called inside an `effect`: every leaf it
 * touches is a leaf that must rewrite the address when it changes. A setting
 * already at its default is left out, so a plain visit keeps a plain address.
 * @returns The route mirroring the current state.
 */
export function currentRoute(): Route {
  const tab = state.view.activeTab.value;
  const query: Record<string, string> = {};
  if (tab === 'molecules') writeMolecules(query);
  if (tab === 'crystals') writeCrystals(query);
  if (tab === 'plane') writePlane(query);
  if (tab === 'space-groups') writeNumber(query, 'setting', settingIndex());
  if (drawsLayers(tab)) writeFlags(query);
  if (state.view.embedded.value) query[EMBED_PARAM] = '1';
  const hidden = serializeHidden(state.view.hidden.value);
  if (hidden !== '') query[HIDE_PARAM] = hidden;
  return { tab, id: idOf(tab), query };
}

/**
 * Move the state to a route: the address on load, and every back or forward
 * after it.
 *
 * Everything the address carries has already been clamped or cut by the share
 * codecs, and an id naming nothing is handed to the page rather than obeyed
 * here — a link from a slide of last year must land on the page it names, not
 * on an empty one.
 * @param route - Route to apply.
 */
export function applyRoute(route: Route): void {
  const params = readShareParams(route.query);
  batch(() => {
    setEmbedded(parseEmbed(route.query));
    setHiddenParts(parseHidden(route.query[HIDE_PARAM]));
    applyFlags(route.query[FLAGS_PARAM]);
    setActiveTab(route.tab);
    applyPage(route, params);
  });
}

function applyPage(route: Route, params: ShareParamSet): void {
  const { tab, id, query } = route;
  if (tab === 'molecules') {
    // The molecule first: changing it drops the operation being animated,
    // which would otherwise wipe the one the link asked for.
    selectMolecule(params.molecule === '' ? null : params.molecule);
    animateOperation(params.operation === '' ? null : params.operation);
    return;
  }
  if (tab === 'crystals') {
    // A link naming a library structure and no group means that structure, in
    // the group its own file names — not the group this page happens to open
    // on. Naming both is how a link asks for the same atoms in another group,
    // so an explicit `spaceGroup` always wins over the entry's.
    const entry =
      query[SPACE_GROUP_PARAM] === undefined
        ? structureById(params.structure)
        : undefined;
    // The group first, for the same reason: it resets the setting index, which
    // only means anything inside one group's own list.
    selectSpaceGroup(entry?.spaceGroupNumber ?? params.spaceGroup);
    selectSetting(entry?.variant ?? params.setting);
    selectStructure(params.structure === '' ? null : params.structure);
    setSupercell(params.supercell);
    return;
  }
  if (tab === 'plane') {
    selectPlaneGroup(params.planeGroup);
    selectMotif(params.motif === '' ? null : params.motif);
    setTiles(params.tiles);
    return;
  }
  if (tab === 'tutorial') {
    setTutorialStep(id);
    return;
  }
  if (tab === 'exercises') {
    setActiveExercise(id);
    return;
  }
  if (isCatalogueTab(tab)) {
    setCatalogueItem(id);
    if (tab === 'space-groups') selectSetting(params.setting);
  }
}

function applyFlags(value: string | undefined): void {
  const flags = parseFlags(value);
  if (flags === null) return;
  for (const meta of DISPLAY_FLAGS) {
    setDisplayFlag(meta.key, flags.has(meta.key));
  }
}

function writeMolecules(query: Record<string, string>): void {
  writeText(query, 'molecule', state.view.molecules.moleculeId.value ?? '');
  writeText(query, 'operation', state.view.molecules.operation.value ?? '');
}

function writeCrystals(query: Record<string, string>): void {
  writeNumber(query, 'spaceGroup', state.view.crystals.spaceGroupNumber.value);
  writeNumber(query, 'setting', settingIndex());
  writeText(query, 'structure', state.view.crystals.structureId.value ?? '');
  writeNumber(query, 'supercell', state.view.crystals.supercell.value);
}

function writePlane(query: Record<string, string>): void {
  writeText(query, 'planeGroup', state.view.plane.groupId.value);
  writeText(query, 'motif', state.view.plane.motifId.value ?? '');
  writeNumber(query, 'tiles', state.view.plane.tiles.value);
}

/**
 * The layers, written only when they differ from the site's own defaults: a
 * visitor who has changed nothing must not grow a twelve-name query string.
 */
function writeFlags(query: Record<string, string>): void {
  const value = serializeFlags(readFlags());
  if (value !== defaultFlagsValue()) query[FLAGS_PARAM] = value;
}

/** Every layer, read in one place so the `effect` tracks all twelve. */
function readFlags(): Record<DisplayFlagKey, boolean> {
  const flags: Partial<Record<DisplayFlagKey, boolean>> = {};
  for (const meta of DISPLAY_FLAGS) {
    flags[meta.key] = state.preferences.flags[meta.key].value;
  }
  return flags as Record<DisplayFlagKey, boolean>;
}

function settingIndex(): number {
  return state.view.crystals.settingIndex.value;
}

function drawsLayers(tab: TabId): boolean {
  return tab !== 'exercises' && tab !== 'cheatsheet' && tab !== 'about';
}

/** The second path segment of a page, for the pages that address an entry. */
function idOf(tab: TabId): string | null {
  if (tab === 'tutorial') return state.view.tutorial.stepId.value;
  if (tab === 'exercises') return state.view.exercises.activeId.value;
  if (isCatalogueTab(tab)) return state.view.catalogue.itemId.value;
  return null;
}

/** A setting whose value is text. */
type TextParam =
  'molecule' | 'operation' | 'structure' | 'planeGroup' | 'motif';

/** A setting whose value is a whole number. */
type NumberParam = 'spaceGroup' | 'setting' | 'supercell' | 'tiles';

function writeText(
  query: Record<string, string>,
  key: TextParam,
  value: string,
): void {
  const raw = SHARE_PARAMS[key].serialize(value);
  if (raw !== null) query[key] = raw;
}

function writeNumber(
  query: Record<string, string>,
  key: NumberParam,
  value: number,
): void {
  const raw = SHARE_PARAMS[key].serialize(value);
  if (raw !== null) query[key] = raw;
}
