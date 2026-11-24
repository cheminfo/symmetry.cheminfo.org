/**
 * What is done to a transform before it is turned back into an image: part of
 * it kept and the rest set to zero, or its phases replaced.
 *
 * The page uses these to answer two questions a student asks of a diffraction
 * pattern: which part of the image does this part of the transform carry, and
 * what would the image be without the phases nobody measures.
 */

import type { Spectrum } from './fourier.ts';
import { FIELD_CENTRE, FIELD_SIZE } from './fourier.ts';

/** Which part of the transform is kept. */
export const MASK_KINDS = ['all', 'low', 'high', 'spots'] as const;

/** One of {@link MASK_KINDS}. */
export type MaskKind = (typeof MASK_KINDS)[number];

/** A point of the transform, as offsets from its centre. */
export interface Spot {
  /** Columns to the right of the centre. */
  u: number;
  /** Rows below the centre. */
  v: number;
}

/** What is kept of the transform. */
export interface Mask {
  /** Everything, a disk about the centre, all but that disk, or a few spots. */
  kind: MaskKind;
  /** Radius of the disk, in pixels of the transform. */
  radius: number;
  /** The spots kept, each with its Friedel mate. */
  spots: readonly Spot[];
}

/** How far around a kept spot the transform is kept, in pixels. */
export const SPOT_RADIUS = 3;

/** The most spots a mask keeps, so a link cannot ask for thousands. */
export const MAX_SPOTS = 24;

/** What is done to the phases. */
export const PHASE_MODES = ['measured', 'zero', 'unit', 'swap'] as const;

/** One of {@link PHASE_MODES}. */
export type PhaseMode = (typeof PHASE_MODES)[number];

/**
 * Whether a point of the transform is kept.
 * @param mask - What is kept.
 * @param u - Column offset from the centre.
 * @param v - Row offset from the centre.
 * @returns True when the point survives.
 */
export function isKept(mask: Mask, u: number, v: number): boolean {
  if (mask.kind === 'all') return true;
  const squared = u * u + v * v;
  const radius = mask.radius * mask.radius;
  if (mask.kind === 'low') return squared <= radius;
  if (mask.kind === 'high') return squared > radius;
  const reach = SPOT_RADIUS * SPOT_RADIUS;
  for (const spot of mask.spots) {
    // The mate at −g is kept with g: without it the image rebuilt would not be
    // real, and the fringes a spot carries would come back as half of them.
    const du = u - spot.u;
    const dv = v - spot.v;
    if (du * du + dv * dv <= reach) return true;
    const mu = u + spot.u;
    const mv = v + spot.v;
    if (mu * mu + mv * mv <= reach) return true;
  }
  return false;
}

/**
 * The transform with everything the mask drops set to zero.
 * @param spectrum - The transform.
 * @param mask - What is kept.
 * @returns A new transform; the one given is left alone.
 */
export function applyMask(spectrum: Spectrum, mask: Mask): Spectrum {
  const re = new Array<Float64Array>(FIELD_SIZE);
  const im = new Array<Float64Array>(FIELD_SIZE);
  for (let row = 0; row < FIELD_SIZE; row++) {
    const sourceRe = spectrum.re[row] ?? new Float64Array(FIELD_SIZE);
    const sourceIm = spectrum.im[row] ?? new Float64Array(FIELD_SIZE);
    const keptRe = new Float64Array(FIELD_SIZE);
    const keptIm = new Float64Array(FIELD_SIZE);
    const v = row - FIELD_CENTRE;
    for (let column = 0; column < FIELD_SIZE; column++) {
      if (!isKept(mask, column - FIELD_CENTRE, v)) continue;
      keptRe[column] = sourceRe[column] ?? 0;
      keptIm[column] = sourceIm[column] ?? 0;
    }
    re[row] = keptRe;
    im[row] = keptIm;
  }
  return { re, im };
}

/**
 * How many coefficients a mask keeps.
 * @param mask - What is kept.
 * @returns The count, out of {@link FIELD_SIZE} squared.
 */
export function keptCount(mask: Mask): number {
  if (mask.kind === 'all') return FIELD_SIZE * FIELD_SIZE;
  let count = 0;
  for (let v = -FIELD_CENTRE; v < FIELD_CENTRE; v++) {
    for (let u = -FIELD_CENTRE; u < FIELD_CENTRE; u++) {
      if (isKept(mask, u, v)) count++;
    }
  }
  return count;
}

/**
 * The brightest point near where the pointer landed, so a click a pixel off a
 * spot still picks the spot.
 * @param spectrum - The transform.
 * @param spot - Where the pointer landed.
 * @param reach - How far to look, in pixels each way.
 * @returns The brightest point within reach.
 */
export function snapToPeak(spectrum: Spectrum, spot: Spot, reach = 4): Spot {
  // The centre outshines everything, so it is only picked when aimed at.
  const nearCentre = Math.hypot(spot.u, spot.v) <= 2;
  if (nearCentre) return { u: 0, v: 0 };
  let best = spot;
  let bestValue = -1;
  for (let dv = -reach; dv <= reach; dv++) {
    for (let du = -reach; du <= reach; du++) {
      const u = spot.u + du;
      const v = spot.v + dv;
      if (u === 0 && v === 0) continue;
      const re = spectrum.re[v + FIELD_CENTRE]?.[u + FIELD_CENTRE];
      const im = spectrum.im[v + FIELD_CENTRE]?.[u + FIELD_CENTRE];
      if (re === undefined || im === undefined) continue;
      const value = re * re + im * im;
      if (value > bestValue) {
        bestValue = value;
        best = { u, v };
      }
    }
  }
  return best;
}

/**
 * Add a spot to the ones kept, or take it out when it, or its mate, is
 * already there.
 * @param spots - The spots kept.
 * @param spot - The spot clicked.
 * @returns The new list, never longer than {@link MAX_SPOTS}.
 */
export function toggleSpot(spots: readonly Spot[], spot: Spot): Spot[] {
  const kept = spots.filter(
    (other) => !sameSpot(other, spot) && !sameSpot(other, mate(spot)),
  );
  if (kept.length < spots.length) return kept;
  return [...spots, spot].slice(-MAX_SPOTS);
}

/**
 * The transform with its phases replaced.
 * @param spectrum - The transform whose amplitudes are kept.
 * @param mode - What the phases become: as measured, all zero, every
 * amplitude set to 1 instead, or the phases of another image.
 * @param other - The transform lending its phases, for `swap`.
 * @returns A new transform, or the one given when nothing changes.
 */
export function applyPhase(
  spectrum: Spectrum,
  mode: PhaseMode,
  other?: Spectrum,
): Spectrum {
  if (mode === 'measured' || (mode === 'swap' && other === undefined)) {
    return spectrum;
  }
  const re = new Array<Float64Array>(FIELD_SIZE);
  const im = new Array<Float64Array>(FIELD_SIZE);
  for (let row = 0; row < FIELD_SIZE; row++) {
    const sourceRe = spectrum.re[row] ?? new Float64Array(FIELD_SIZE);
    const sourceIm = spectrum.im[row] ?? new Float64Array(FIELD_SIZE);
    const lenderRe = other?.re[row];
    const lenderIm = other?.im[row];
    const nextRe = new Float64Array(FIELD_SIZE);
    const nextIm = new Float64Array(FIELD_SIZE);
    for (let column = 0; column < FIELD_SIZE; column++) {
      const x = sourceRe[column] ?? 0;
      const y = sourceIm[column] ?? 0;
      const amplitude = Math.hypot(x, y);
      if (mode === 'zero') {
        nextRe[column] = amplitude;
        continue;
      }
      // `unit` keeps this transform's phase; `swap` takes the other one's.
      const phaseRe = mode === 'unit' ? x : (lenderRe?.[column] ?? 0);
      const phaseIm = mode === 'unit' ? y : (lenderIm?.[column] ?? 0);
      const length = Math.hypot(phaseRe, phaseIm);
      if (length === 0) continue;
      const scale = (mode === 'unit' ? 1 : amplitude) / length;
      nextRe[column] = phaseRe * scale;
      nextIm[column] = phaseIm * scale;
    }
    re[row] = nextRe;
    im[row] = nextIm;
  }
  return { re, im };
}

function mate(spot: Spot): Spot {
  return { u: -spot.u, v: -spot.v };
}

function sameSpot(a: Spot, b: Spot): boolean {
  return a.u === b.u && a.v === b.v;
}
