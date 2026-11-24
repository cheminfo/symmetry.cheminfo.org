/**
 * The reciprocal-space workbench: what is in real space, what is kept of its
 * transform, and what the image rebuilt from that part looks like.
 *
 * The choices are `view` leaves, mirrored into the address by
 * `src/share/reciprocalParams.ts`. The images are derived from them with
 * `computed`, each step keyed on its own inputs: changing the mask transforms
 * nothing again, it only rebuilds.
 */

import { computed, signal } from '@preact/signals-react';
import { clampSplit } from 'react-cheminfo/core';

import type { SpectrumView, Zoom } from '../reciprocal/display.ts';
import { CONTRAST_RANGE } from '../reciprocal/display.ts';
import {
  DEFAULT_EXAMPLE_ID,
  exampleById,
  exampleImage,
} from '../reciprocal/examples.ts';
import type { MaskKind, PhaseMode, Spot } from '../reciprocal/filter.ts';
import { applyMask, applyPhase, toggleSpot } from '../reciprocal/filter.ts';
import {
  fourierTransform,
  inverseFourierTransform,
} from '../reciprocal/fourier.ts';
import type { LatticeSettings } from '../reciprocal/lattice.ts';
import { DEFAULT_LATTICE, latticeImage } from '../reciprocal/lattice.ts';
import { blankField } from '../reciprocal/raster.ts';
import type { Region } from '../reciprocal/region.ts';
import { cutToRegion } from '../reciprocal/region.ts';

import { data } from './data.ts';

/** What real space holds. */
export type ReciprocalSource =
  | {
      /** One of the examples, as it ships. */
      kind: 'example';
      /** Its id. */
      id: string;
    }
  | {
      /** A crystal from the lattice generator. */
      kind: 'lattice';
      /** How it is built. */
      lattice: LatticeSettings;
      /** The example it was changed from, if any. */
      from: string | null;
    }
  | {
      /** A picture somebody opened. */
      kind: 'photo';
      /** Its file name. */
      name: string;
    };

/** A picture somebody opened, read into an image. */
export interface ReciprocalPhoto {
  /** Its file name. */
  name: string;
  /** Its pixels, from `readPhoto`. */
  image: Float64Array;
}

/** The disk a low- or high-pass mask opens on, in pixels of the transform. */
export const DEFAULT_MASK_RADIUS = 16;

/** The bounds of that radius. */
export const MASK_RADIUS_RANGE = { min: 1, max: 128 } as const;

/** The example lending its phases when the page opens on that experiment. */
export const DEFAULT_PHASE_FROM = 'arrow';

/** The workbench's `view` leaves. Plain object, never reassigned. */
export const reciprocalView = {
  source: signal<ReciprocalSource>({ kind: 'example', id: DEFAULT_EXAMPLE_ID }),
  /** The part of the image transformed, or `null` for all of it. */
  region: signal<Region | null>(null),
  mask: signal<MaskKind>('all'),
  radius: signal(DEFAULT_MASK_RADIUS),
  spots: signal<readonly Spot[]>([]),
  phase: signal<PhaseMode>('measured'),
  /** The example whose phases `swap` takes. */
  phaseFrom: signal(DEFAULT_PHASE_FROM),
  show: signal<SpectrumView>('amplitude'),
  /** Decades of amplitude the transform shows. */
  contrast: signal<number>(CONTRAST_RANGE.initial),
  /** How many times the middle of the transform is enlarged. */
  zoom: signal<Zoom>('1'),
  /** Share of the row the image takes beside the two others, or `null`. */
  split: signal<number | null>(null),
  /** Share the transform takes beside the rebuilt image, or `null`. */
  split2: signal<number | null>(null),
};

const view = reciprocalView;

/** The picture somebody opened, kept for the session only. */
const reciprocalPhoto = data.reciprocalPhoto;

/** The whole image in real space, before any region is cut out of it. */
export const sourceImage = computed(() => imageOf(view.source.value));

/** The image the transform is taken of: the region alone, when there is one. */
export const transformedImage = computed(() =>
  cutToRegion(sourceImage.value, view.region.value),
);

/** Its transform, origin at the centre. */
export const spectrum = computed(() =>
  fourierTransform(transformedImage.value),
);

/** The transform lending its phases, while that experiment is on. */
const lender = computed(() => {
  if (view.phase.value !== 'swap') return undefined;
  const example = exampleById(view.phaseFrom.value);
  return example === undefined
    ? undefined
    : fourierTransform(exampleImage(example));
});

/** The image rebuilt from what is kept of the transform. */
export const rebuiltImage = computed(() => {
  const changed = applyPhase(spectrum.value, view.phase.value, lender.value);
  const kept = applyMask(changed, {
    kind: view.mask.value,
    radius: view.radius.value,
    spots: view.spots.value,
  });
  return inverseFourierTransform(kept);
});

/**
 * The crystal the lattice generator is showing, if it is showing one.
 * @returns Its settings, or `null` for a drawing or a picture.
 */
export function shownLattice(): LatticeSettings | null {
  const source = view.source.value;
  if (source.kind === 'lattice') return source.lattice;
  if (source.kind === 'example') {
    return exampleById(source.id)?.lattice ?? null;
  }
  return null;
}

/**
 * Show one of the examples. The region and the spots belong to the picture
 * they were chosen on, so both are dropped.
 * @param id - Example id; one the page does not ship opens the default.
 */
export function openReciprocalExample(id: string): void {
  const known = exampleById(id) === undefined ? DEFAULT_EXAMPLE_ID : id;
  view.source.value = { kind: 'example', id: known };
  forgetPicks();
}

/**
 * Change one setting of the lattice generator, starting from the crystal on
 * screen — or from the default one when a drawing or a picture is.
 * @param change - The settings changed.
 */
export function changeLattice(change: Partial<LatticeSettings>): void {
  const source = view.source.peek();
  // Only an example that is itself a crystal is one the crystal came from.
  const from =
    source.kind === 'example'
      ? exampleById(source.id)?.lattice === undefined
        ? null
        : source.id
      : source.kind === 'lattice'
        ? source.from
        : null;
  const base = shownLatticePeek() ?? DEFAULT_LATTICE;
  view.source.value = {
    kind: 'lattice',
    lattice: { ...base, ...change },
    from,
  };
}

/**
 * Show a picture somebody opened.
 * @param photo - The picture, read.
 */
export function openReciprocalPhoto(photo: ReciprocalPhoto): void {
  reciprocalPhoto.value = photo;
  view.source.value = { kind: 'photo', name: photo.name };
  forgetPicks();
}

/**
 * Transform only part of the image, or all of it again.
 * @param region - The part, or `null` for the whole image.
 */
export function setReciprocalRegion(region: Region | null): void {
  view.region.value = region;
}

/**
 * Keep another part of the transform.
 * @param kind - Everything, a disk, all but a disk, or picked spots.
 */
export function setMaskKind(kind: MaskKind): void {
  view.mask.value = kind;
  if (kind === 'spots' && view.spots.peek().length === 0) {
    view.spots.value = [{ u: 0, v: 0 }];
  }
}

/**
 * Size the disk a low- or high-pass mask keeps or drops.
 * @param radius - In pixels of the transform, clamped.
 */
export function setMaskRadius(radius: number): void {
  const { min, max } = MASK_RADIUS_RANGE;
  view.radius.value = Math.min(Math.max(Math.round(radius), min), max);
}

/**
 * Keep a spot, or drop it when it is already kept. From any other mask, the
 * first spot picked keeps the centre with it, so the image rebuilt has its
 * mean grey and the fringes the spot carries sit on it.
 * @param spot - The spot clicked, already snapped to its peak.
 */
export function pickSpot(spot: Spot): void {
  if (view.mask.peek() !== 'spots') {
    view.mask.value = 'spots';
    const origin = { u: 0, v: 0 };
    view.spots.value = spot.u === 0 && spot.v === 0 ? [origin] : [origin, spot];
    return;
  }
  view.spots.value = toggleSpot(view.spots.peek(), spot);
}

/**
 * Replace the spots kept.
 * @param spots - The new list.
 */
export function setSpots(spots: readonly Spot[]): void {
  view.spots.value = spots;
}

/**
 * Do something to the phases before rebuilding.
 * @param mode - As measured, all zero, amplitudes all 1, or another image's.
 */
export function setPhaseMode(mode: PhaseMode): void {
  view.phase.value = mode;
}

/**
 * Take the phases of another example.
 * @param id - Example id.
 */
export function setPhaseFrom(id: string): void {
  view.phaseFrom.value =
    exampleById(id) === undefined ? DEFAULT_PHASE_FROM : id;
}

/**
 * Paint the transform's amplitude or its phase.
 * @param show - Which.
 */
export function setSpectrumView(show: SpectrumView): void {
  view.show.value = show;
}

/**
 * Show more or fewer decades of the transform's amplitude.
 * @param decades - Clamped to the range the page offers.
 */
export function setContrast(decades: number): void {
  const { min, max } = CONTRAST_RANGE;
  view.contrast.value = Math.min(Math.max(Math.round(decades), min), max);
}

/**
 * Enlarge the middle of the transform, where the strong spots are.
 * @param zoom - 1, 2 or 4 times.
 */
export function setZoom(zoom: Zoom): void {
  view.zoom.value = zoom;
}

/**
 * Divide the row between the image and the two others.
 * @param split - Share of the image, or `null` for the default.
 */
export function setReciprocalSplit(split: number | null): void {
  view.split.value = split === null ? null : clampSplit(split);
}

/**
 * Divide the transform from the rebuilt image.
 * @param split - Share of the transform, or `null` for the default.
 */
export function setReciprocalSplit2(split: number | null): void {
  view.split2.value = split === null ? null : clampSplit(split);
}

function imageOf(source: ReciprocalSource): Float64Array {
  if (source.kind === 'lattice') return latticeImage(source.lattice);
  if (source.kind === 'photo') {
    return reciprocalPhoto.value?.image ?? blankField();
  }
  const example = exampleById(source.id) ?? exampleById(DEFAULT_EXAMPLE_ID);
  return example === undefined ? blankField() : exampleImage(example);
}

function shownLatticePeek(): LatticeSettings | null {
  const source = view.source.peek();
  if (source.kind === 'lattice') return source.lattice;
  if (source.kind === 'example') return exampleById(source.id)?.lattice ?? null;
  return null;
}

function forgetPicks(): void {
  view.region.value = null;
  view.spots.value = view.mask.peek() === 'spots' ? [{ u: 0, v: 0 }] : [];
}
