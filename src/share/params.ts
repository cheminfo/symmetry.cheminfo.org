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
  EXAMPLE_PARAM,
  enumParam,
  integerParam,
  numberParam,
  stringParam,
} from 'react-cheminfo/core';

import {
  CONTRAST_RANGE,
  SPECTRUM_VIEWS,
  ZOOMS,
} from '../reciprocal/display.ts';
import { DEFAULT_EXAMPLE_ID } from '../reciprocal/examples.ts';
import { MASK_KINDS, MAX_SPOTS, PHASE_MODES } from '../reciprocal/filter.ts';
import {
  DEFAULT_LATTICE,
  LATTICE_BASES,
  LATTICE_RANGES,
} from '../reciprocal/lattice.ts';
import {
  SETTING_RANGE,
  SPACE_GROUP_RANGE,
  SUPERCELL_RANGE,
  TILES_RANGE,
} from '../state/ranges.ts';
import {
  DEFAULT_MASK_RADIUS,
  DEFAULT_PHASE_FROM,
  MASK_RADIUS_RANGE,
} from '../state/reciprocal.ts';
import {
  DEFAULT_PLANE_GROUP,
  VIEWER_BONDS,
  VIEWER_PACKINGS,
} from '../state/view.ts';

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
  /**
   * A CIF for the viewer to fetch and draw, by its address: how a database
   * page such as crystals.cheminfo.org opens one of its entries here.
   */
  cif: stringParam({ maxLength: 2048 }),
  /** Whether the viewer draws whole molecules or the atoms its cell cuts. */
  packing: enumParam(VIEWER_PACKINGS, 'molecules'),
  /** Which bonds the viewer draws: `all`, `noMetal` or `none`. */
  bonds: enumParam(VIEWER_BONDS, 'all'),
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
  /** Which picture the reciprocal-space workbench opens on. */
  [EXAMPLE_PARAM]: stringParam({
    default: DEFAULT_EXAMPLE_ID,
    maxLength: MAX_ID_LENGTH,
  }),
  /** Length of **a** of a crystal from the lattice generator, in pixels. */
  a: numberParam({
    ...LATTICE_RANGES.a,
    default: DEFAULT_LATTICE.a,
    decimals: 1,
  }),
  /** Length of **b**, in pixels. */
  b: numberParam({
    ...LATTICE_RANGES.b,
    default: DEFAULT_LATTICE.b,
    decimals: 1,
  }),
  /** The angle between them, in degrees. */
  gamma: numberParam({
    ...LATTICE_RANGES.gamma,
    default: DEFAULT_LATTICE.gamma,
    decimals: 1,
  }),
  /** What each lattice point carries. */
  basis: enumParam(LATTICE_BASES, DEFAULT_LATTICE.basis),
  /** The crystal's diameter, as a percentage of the image. */
  crystal: integerParam({
    ...LATTICE_RANGES.crystal,
    default: DEFAULT_LATTICE.crystal,
  }),
  /** The noise laid over it, as a percentage of a dot. */
  noise: integerParam({
    ...LATTICE_RANGES.noise,
    default: DEFAULT_LATTICE.noise,
  }),
  /** The part of the image transformed: `x,y,width,height`, in pixels. */
  region: stringParam({ maxLength: 32 }),
  /** What is kept of the transform. */
  mask: enumParam(MASK_KINDS, 'all'),
  /** The radius of a low- or high-pass disk, in pixels of the transform. */
  radius: integerParam({ ...MASK_RADIUS_RANGE, default: DEFAULT_MASK_RADIUS }),
  /** The spots kept: `u,v,u,v`, offsets from the centre of the transform. */
  spots: stringParam({ maxLength: MAX_SPOTS * 10 }),
  /** What is done to the phases before rebuilding. */
  phase: enumParam(PHASE_MODES, 'measured'),
  /** The example lending its phases. */
  phaseFrom: stringParam({
    default: DEFAULT_PHASE_FROM,
    maxLength: MAX_ID_LENGTH,
  }),
  /** Whether the transform is painted as amplitude or as phase. */
  show: enumParam(SPECTRUM_VIEWS, 'amplitude'),
  /** How many times the middle of the transform is enlarged: 1, 2 or 4. */
  zoom: enumParam(ZOOMS, '1'),
  /** Decades of amplitude the transform shows. */
  contrast: integerParam({
    min: CONTRAST_RANGE.min,
    max: CONTRAST_RANGE.max,
    default: CONTRAST_RANGE.initial,
  }),
};

/** The parameters naming a crystal of the lattice generator. */
export const LATTICE_PARAMS = [
  'a',
  'b',
  'gamma',
  'basis',
  'crystal',
  'noise',
] as const;

/**
 * The parameters naming the picture the reciprocal-space workbench opens on.
 * The Share dialog's "Opens on" writes them, so its own draft must not.
 */
export const OPENED_ON_PARAMS = [EXAMPLE_PARAM, ...LATTICE_PARAMS] as const;

/** The codecs of {@link SHARE_PARAMS}. */
export type ShareParams = typeof SHARE_PARAMS;

/** Every setting at the value the link carries, or at its default. */
export type ShareParamSet = ShareParamValues<ShareParams>;
