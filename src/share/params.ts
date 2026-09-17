/**
 * The tool's own settings a link carries, and the bounds it is read inside.
 *
 * A shared link is untrusted input, so every one of these is clamped or cut:
 * `?supercell=40` asks for sixty-four thousand cells of a 192-operation group
 * and the page never comes back, and `?motif=` followed by a megabyte of text
 * is a link nobody wrote by hand. A value already at its default is deleted
 * rather than written, so an unconfigured link stays a plain link.
 */

import type { ShareParamValues } from 'react-cheminfo/core';
import {
  integerParam,
  parseShareConfig,
  stringParam,
} from 'react-cheminfo/core';

import {
  SETTING_RANGE,
  SPACE_GROUP_RANGE,
  SUPERCELL_RANGE,
  TILES_RANGE,
} from '../state/ranges.ts';
import { DEFAULT_PLANE_GROUP } from '../state/view.ts';

import { toSearch } from './query.ts';

/** The longest id a link may name, in characters. */
const MAX_ID_LENGTH = 64;

/** Every setting a link can pin, keyed by the name it takes in the query. */
export const SHARE_PARAMS = {
  /** Which library molecule the molecule workbench is showing. */
  molecule: stringParam({ maxLength: MAX_ID_LENGTH }),
  /**
   * Which operation is being animated, by the label a chemist writes. The
   * longest the library produces is methane's `C3^2([0.577 -0.577 -0.577])`
   * at 27 characters, so a shorter cut would drop a link on the floor.
   */
  operation: stringParam({ maxLength: 32 }),
  /** Which space group the crystal workbench is building, 1 to 230. */
  spaceGroup: integerParam({
    min: SPACE_GROUP_RANGE.minimum,
    max: SPACE_GROUP_RANGE.maximum,
    default: SPACE_GROUP_RANGE.initial,
  }),
  /** Which setting of it, as an index into that group's own list. */
  setting: integerParam({
    min: SETTING_RANGE.minimum,
    max: SETTING_RANGE.maximum,
    default: SETTING_RANGE.initial,
  }),
  /** Which of the structures the site ships fills the cell. */
  structure: stringParam({ maxLength: MAX_ID_LENGTH }),
  /** How many cells are drawn along each axis. */
  supercell: integerParam({
    min: SUPERCELL_RANGE.minimum,
    max: SUPERCELL_RANGE.maximum,
    default: SUPERCELL_RANGE.initial,
  }),
  /** Which wallpaper or frieze group the plane workbench is drawing. */
  planeGroup: stringParam({ default: DEFAULT_PLANE_GROUP, maxLength: 12 }),
  /** Which motif it repeats. */
  motif: stringParam({ maxLength: MAX_ID_LENGTH }),
  /** How many cells it repeats along each direction. */
  tiles: integerParam({
    min: TILES_RANGE.minimum,
    max: TILES_RANGE.maximum,
    default: TILES_RANGE.initial,
  }),
};

/** The codecs of {@link SHARE_PARAMS}. */
export type ShareParams = typeof SHARE_PARAMS;

/** Every setting at the value the link carries, or at its default. */
export type ShareParamSet = ShareParamValues<ShareParams>;

/**
 * Read every setting a link carries.
 * @param query - Decoded query of the address.
 * @returns The settings, each clamped or cut to what the tool can serve.
 */
export function readShareParams(
  query: Readonly<Record<string, string>>,
): ShareParamSet {
  return parseShareConfig(toSearch(query), {
    parts: [],
    params: SHARE_PARAMS,
  }).params;
}
