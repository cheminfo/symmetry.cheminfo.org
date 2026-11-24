/**
 * A two-dimensional crystal: a lattice, the motif each of its points carries,
 * how far it extends, and how much noise is laid over it.
 *
 * The lattice is spanned by **a**, along the image's x axis, and **b**, at the
 * angle γ from it, counter-clockwise as the eye reads it. Its reciprocal
 * lattice is spanned by **a\*** and **b\***, with **a\*** · **a** = 1 and
 * **a\*** · **b** = 0: **a\*** is perpendicular to **b**, not parallel to
 * **a**, and its length is 1 / (a sin γ). Both are given here in the
 * coordinates of the screen, so the arrows drawn over the image and over its
 * transform are the vectors the arithmetic uses.
 */

import { createRandomArray } from 'ml-spectra-processing';

import { FIELD_SIZE } from './fourier.ts';
import type { Point } from './raster.ts';
import { blankField, fillDisk, fillPolygon, placePoints } from './raster.ts';
import { LETTER_F } from './shapes.ts';

/** What each lattice point carries. */
export const LATTICE_BASES = ['dot', 'pair', 'centred', 'f', 'glide'] as const;

/** One of {@link LATTICE_BASES}. */
export type LatticeBasis = (typeof LATTICE_BASES)[number];

/** How each motif is named where the page offers it. */
export const BASIS_LABELS: Record<LatticeBasis, string> = {
  dot: 'One dot',
  pair: 'Two dots',
  centred: 'Centred cell',
  f: 'Letter F',
  glide: 'F and its glide image',
};

/** A crystal, as the generator builds it. */
export interface LatticeSettings {
  /** Length of **a**, in pixels. */
  a: number;
  /** Length of **b**, in pixels. */
  b: number;
  /** Angle between **a** and **b**, in degrees. */
  gamma: number;
  /** What each lattice point carries. */
  basis: LatticeBasis;
  /** Diameter of the crystal, as a percentage of the field's side. */
  crystal: number;
  /** Standard deviation of the noise laid over it, as a percentage of a dot. */
  noise: number;
}

/** The bounds each setting is read inside, from a box or from a link. */
export const LATTICE_RANGES = {
  a: { min: 6, max: 64 },
  b: { min: 6, max: 64 },
  gamma: { min: 30, max: 150 },
  crystal: { min: 10, max: 100 },
  noise: { min: 0, max: 200 },
} as const;

/** The square lattice the page opens on. */
export const DEFAULT_LATTICE: LatticeSettings = {
  a: 16,
  b: 16,
  gamma: 90,
  basis: 'dot',
  crystal: 90,
  noise: 0,
};

/** The two vectors spanning a lattice, in pixels, on screen. */
export interface LatticeVectors {
  /** **a**. */
  a: Point;
  /** **b**. */
  b: Point;
}

/** The seed of the noise, so the same link always shows the same speckle. */
const NOISE_SEED = 20_260_917;

/**
 * **a** and **b**, on screen.
 * @param settings - The crystal.
 * @returns The two vectors, in pixels.
 */
export function latticeVectors(settings: LatticeSettings): LatticeVectors {
  const gamma = (settings.gamma * Math.PI) / 180;
  return {
    a: { x: settings.a, y: 0 },
    // Counter-clockwise for the eye is towards negative y on screen.
    b: { x: settings.b * Math.cos(gamma), y: -settings.b * Math.sin(gamma) },
  };
}

/**
 * **a\*** and **b\***, in cycles per pixel, on screen.
 * @param vectors - **a** and **b**.
 * @returns The reciprocal vectors.
 */
export function reciprocalVectors(vectors: LatticeVectors): LatticeVectors {
  const { a, b } = vectors;
  const determinant = a.x * b.y - a.y * b.x;
  // The rows of the inverse of the matrix whose columns are a and b.
  return {
    a: { x: b.y / determinant, y: -b.x / determinant },
    b: { x: -a.y / determinant, y: a.x / determinant },
  };
}

/**
 * The indices of a point of the transform, read against the lattice.
 * @param vectors - **a** and **b**.
 * @param u - Column offset of the point from the centre of the transform.
 * @param v - Row offset of the point from the centre.
 * @returns `h` and `k`, which are whole numbers on a reciprocal lattice point.
 */
export function millerIndices(
  vectors: LatticeVectors,
  u: number,
  v: number,
): { h: number; k: number } {
  // g = h a* + k b*, and a* · a = 1, b* · a = 0: so h = g · a, k = g · b.
  return {
    h: (u * vectors.a.x + v * vectors.a.y) / FIELD_SIZE,
    k: (u * vectors.b.x + v * vectors.b.y) / FIELD_SIZE,
  };
}

/**
 * Paint the crystal.
 * @param settings - The crystal.
 * @returns The image, {@link FIELD_SIZE} squared values.
 */
export function latticeImage(settings: LatticeSettings): Float64Array {
  const field = blankField();
  const vectors = latticeVectors(settings);
  const radius = (settings.crystal / 100) * (FIELD_SIZE / 2);
  const shortest = Math.min(settings.a, settings.b);
  // Far enough to cover the crystal whatever the angle: a sin γ is the
  // smallest step a row of the lattice can take across it.
  const sine = Math.max(Math.sin((settings.gamma * Math.PI) / 180), 0.2);
  const reach = Math.ceil(radius / (shortest * sine)) + 1;
  for (let i = -reach; i <= reach; i++) {
    for (let j = -reach; j <= reach; j++) {
      const point = {
        x: i * vectors.a.x + j * vectors.b.x,
        y: i * vectors.a.y + j * vectors.b.y,
      };
      const distance = Math.hypot(point.x, point.y);
      if (distance > radius) continue;
      paintBasis(
        field,
        settings.basis,
        vectors,
        point,
        shortest,
        edgeFade(distance, radius),
      );
    }
  }
  if (settings.noise > 0) addNoise(field, settings.noise / 100);
  return field;
}

function paintBasis(
  field: Float64Array,
  basis: LatticeBasis,
  vectors: LatticeVectors,
  origin: Point,
  shortest: number,
  brightness: number,
): void {
  // Every atom of a cell takes the cell's brightness, so a centring or a glide
  // still cancels its spots exactly at the faded edge of the crystal.
  const dot = Math.min(Math.max(shortest * 0.14, 1.2), 4);
  if (basis === 'dot') {
    fillDisk(field, origin, dot, brightness);
    return;
  }
  if (basis === 'pair') {
    fillDisk(field, origin, dot, brightness);
    fillDisk(field, at(vectors, origin, 0.35, 0.3), dot * 0.7, brightness);
    return;
  }
  if (basis === 'centred') {
    fillDisk(field, origin, dot, brightness);
    fillDisk(field, at(vectors, origin, 0.5, 0.5), dot, brightness);
    return;
  }
  // The letter takes close to half the shortest side, so its glide image,
  // half of b away, never touches it.
  const scale = shortest / 2.2 / LETTER_HEIGHT;
  fillPolygon(field, placePoints(LETTER_F, origin, false, scale), brightness);
  if (basis === 'glide') {
    // The glide line runs along b: mirrored across it, then moved half of b.
    fillPolygon(
      field,
      placePoints(LETTER_F, at(vectors, origin, 0, 0.5), true, scale),
      brightness,
    );
  }
}

/**
 * How bright a cell is drawn at a distance from the centre of the crystal: in
 * full over its inner part, then fading to nothing at its edge. A crystal cut
 * off sharply rings in its transform, a faint texture between the spots that
 * hides the spots a student is looking for; a faded edge leaves them clean.
 */
function edgeFade(distance: number, radius: number): number {
  const inner = radius * (1 - FADED_EDGE);
  if (distance <= inner) return 1;
  return (
    0.5 + 0.5 * Math.cos((Math.PI * (distance - inner)) / (radius - inner))
  );
}

/** The outer share of the crystal's radius over which it fades. */
const FADED_EDGE = 0.35;

/** Height of {@link LETTER_F} in its own units. */
const LETTER_HEIGHT = 60;

function at(
  vectors: LatticeVectors,
  origin: Point,
  x: number,
  y: number,
): Point {
  return {
    x: origin.x + x * vectors.a.x + y * vectors.b.x,
    y: origin.y + x * vectors.a.y + y * vectors.b.y,
  };
}

function addNoise(field: Float64Array, standardDeviation: number): void {
  const noise = createRandomArray({
    length: field.length,
    seed: NOISE_SEED,
    distribution: 'normal',
    standardDeviation,
  });
  for (let i = 0; i < field.length; i++) {
    field[i] = (field[i] ?? 0) + (noise[i] ?? 0);
  }
}
