/**
 * The reciprocal-space workbench, to and from the address.
 *
 * The picture is either one of the examples, named by `?example=`, or a
 * crystal from the lattice generator, named by its six settings — `a`, `b`,
 * `gamma`, `basis`, `crystal` and `noise`. Any one of those six in a link means
 * the generator, with the others at their defaults, so a hand-edited
 * `?a=20` is already a crystal. A picture somebody opened lives in no address.
 */

import { EXAMPLE_PARAM, SPLIT_PARAM, splitParam } from 'react-cheminfo/core';

import type { LatticeSettings } from '../reciprocal/lattice.ts';
import { formatRegion, parseRegion } from '../reciprocal/region.ts';
import { formatSpots, parseSpots } from '../reciprocal/spots.ts';
import {
  changeLattice,
  openReciprocalExample,
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
  state,
} from '../state/index.ts';

import type { ShareParamSet } from './params.ts';
import { LATTICE_PARAMS, SHARE_PARAMS } from './params.ts';

/** The second splitter of the row: the transform beside the rebuilt image. */
export const SPLIT2_PARAM = `${SPLIT_PARAM}2`;

const SPLIT = splitParam();

/**
 * Write what the workbench shows into a query. A setting at its default is
 * left out, so a plain visit keeps a plain address.
 * @param query - Query being built, in place.
 */
export function writeReciprocal(query: Record<string, string>): void {
  const view = state.view.reciprocal;
  const source = view.source.value;
  if (source.kind === 'example') {
    put(query, EXAMPLE_PARAM, SHARE_PARAMS.example.serialize(source.id));
  } else if (source.kind === 'lattice') {
    // The example it was changed from, so the link reopens on its chip; then
    // all six, defaults included: the presence of any one is what says the
    // picture is the generator's.
    if (source.from !== null) query[EXAMPLE_PARAM] = source.from;
    const { lattice } = source;
    query.a = String(round(lattice.a));
    query.b = String(round(lattice.b));
    query.gamma = String(round(lattice.gamma));
    query.basis = lattice.basis;
    query.crystal = String(Math.round(lattice.crystal));
    query.noise = String(Math.round(lattice.noise));
  }
  put(query, 'region', formatRegion(view.region.value) || null);
  put(query, 'mask', SHARE_PARAMS.mask.serialize(view.mask.value));
  const kind = view.mask.value;
  if (kind === 'low' || kind === 'high') {
    put(query, 'radius', SHARE_PARAMS.radius.serialize(view.radius.value));
  }
  if (kind === 'spots') put(query, 'spots', formatSpots(view.spots.value));
  put(query, 'phase', SHARE_PARAMS.phase.serialize(view.phase.value));
  if (view.phase.value === 'swap') {
    put(
      query,
      'phaseFrom',
      SHARE_PARAMS.phaseFrom.serialize(view.phaseFrom.value),
    );
  }
  put(query, 'show', SHARE_PARAMS.show.serialize(view.show.value));
  put(query, 'contrast', SHARE_PARAMS.contrast.serialize(view.contrast.value));
  put(query, 'zoom', SHARE_PARAMS.zoom.serialize(view.zoom.value));
  put(query, SPLIT_PARAM, SPLIT.serialize(view.split.value));
  put(query, SPLIT2_PARAM, SPLIT.serialize(view.split2.value));
}

/**
 * Move the workbench to what a link says.
 * @param query - The decoded query.
 * @param params - The same query through the site's codecs: clamped and cut.
 */
export function applyReciprocal(
  query: Readonly<Record<string, string>>,
  params: ShareParamSet,
): void {
  const namesLattice = LATTICE_PARAMS.some((key) => query[key] !== undefined);
  if (namesLattice) {
    // A link naming both changes that example: what it does not name stays as
    // the example has it. One naming the generator alone changes the default.
    openReciprocalExample(params.example);
    changeLattice(latticeChange(query, params));
    if (query[EXAMPLE_PARAM] === undefined) forgetOrigin();
  } else if (!keepsPhoto(query)) {
    openReciprocalExample(params.example);
  }
  setReciprocalRegion(parseRegion(params.region));
  setMaskRadius(params.radius);
  setSpots(parseSpots(params.spots));
  setMaskKind(params.mask);
  setPhaseMode(params.phase);
  setPhaseFrom(params.phaseFrom);
  setSpectrumView(params.show);
  setContrast(params.contrast);
  setZoom(params.zoom);
  setReciprocalSplit(SPLIT.parse(query[SPLIT_PARAM] ?? null));
  setReciprocalSplit2(SPLIT.parse(query[SPLIT2_PARAM] ?? null));
}

/**
 * Whether the page goes back to a picture somebody opened: no address names
 * one, so an address naming no picture at all leaves it on screen.
 */
function keepsPhoto(query: Readonly<Record<string, string>>): boolean {
  return (
    query[EXAMPLE_PARAM] === undefined &&
    state.view.reciprocal.source.peek().kind === 'photo'
  );
}

function latticeChange(
  query: Readonly<Record<string, string>>,
  params: ShareParamSet,
): Partial<LatticeSettings> {
  const change: Partial<LatticeSettings> = {};
  if (query.a !== undefined) change.a = params.a;
  if (query.b !== undefined) change.b = params.b;
  if (query.gamma !== undefined) change.gamma = params.gamma;
  if (query.basis !== undefined) change.basis = params.basis;
  if (query.crystal !== undefined) change.crystal = params.crystal;
  if (query.noise !== undefined) change.noise = params.noise;
  return change;
}

function forgetOrigin(): void {
  const source = state.view.reciprocal.source.peek();
  if (source.kind !== 'lattice') return;
  state.view.reciprocal.source.value = { ...source, from: null };
}

function put(
  query: Record<string, string>,
  key: string,
  value: string | null,
): void {
  if (value !== null && value !== '') query[key] = value;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
