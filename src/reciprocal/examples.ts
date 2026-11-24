/**
 * The pictures the page comes with: openings of the kind a laser is shone
 * through, drawings chosen for their symmetry, and crystals.
 *
 * Each one carries the one thing to look at in its transform, written as the
 * observation rather than the theory: a student who reads it then looks at
 * the screen and sees it there.
 */

import { FIELD_SIZE } from './fourier.ts';
import type { LatticeSettings } from './lattice.ts';
import { DEFAULT_LATTICE, latticeImage } from './lattice.ts';
import {
  blankField,
  fillDisk,
  fillPolygon,
  fillRectangle,
  rotatePoints,
} from './raster.ts';
import { ARROW, BLADE, LETTER_F } from './shapes.ts';

/** The three rows the picker shows. */
export const EXAMPLE_GROUPS = ['Openings', 'Symmetry', 'Crystals'] as const;

/** One of {@link EXAMPLE_GROUPS}. */
export type ExampleGroup = (typeof EXAMPLE_GROUPS)[number];

/** A picture the page comes with. */
export interface ReciprocalExample {
  /** What `?example=` names it by. */
  id: string;
  /** What its chip reads. */
  name: string;
  /** The row it is listed in. */
  group: ExampleGroup;
  /** What to look at in its transform. */
  note: string;
  /** The crystal, for a picture the lattice generator draws. */
  lattice?: LatticeSettings;
  /** The drawing, for any other picture. */
  draw?: () => Float64Array;
}

/** Every example, in the order the picker lists them. */
export const RECIPROCAL_EXAMPLES: readonly ReciprocalExample[] = [
  {
    id: 'small-hole',
    name: 'Small hole',
    group: 'Openings',
    note: 'A hole 6 px across spreads into rings that fill the transform. What is small in real space is large in reciprocal space.',
    draw: () => drawn((field) => fillDisk(field, ORIGIN, 3)),
  },
  {
    id: 'large-hole',
    name: 'Large hole',
    group: 'Openings',
    note: 'A hole 40 px across gives rings about seven times tighter than the small hole’s.',
    draw: () => drawn((field) => fillDisk(field, ORIGIN, 20)),
  },
  {
    id: 'slit',
    name: 'Slit',
    group: 'Openings',
    note: 'A tall, narrow slit spreads into a streak across it: thin along x in the image, long along x in the transform.',
    draw: () => drawn((field) => fillRectangle(field, ORIGIN, 4, 128)),
  },
  {
    id: 'two-slits',
    name: 'Two slits',
    group: 'Openings',
    note: 'Two slits 24 px apart cut the streak into fringes 256 / 24 ≈ 11 px apart: Young’s experiment.',
    draw: () =>
      drawn((field) => {
        fillRectangle(field, { x: -12, y: 0 }, 3, 128);
        fillRectangle(field, { x: 12, y: 0 }, 3, 128);
      }),
  },
  {
    id: 'square',
    name: 'Square',
    group: 'Openings',
    note: 'A square gives a cross: each edge sends a streak at right angles to itself.',
    draw: () => drawn((field) => fillRectangle(field, ORIGIN, 32, 32)),
  },
  {
    id: 'stripes',
    name: 'Stripes',
    group: 'Openings',
    note: 'Bars 8 px wide every 16 px put spots at 16, 48 and 80 px from the centre. The even orders are missing: equal bars and gaps cancel them.',
    draw: drawStripes,
  },
  {
    id: 'letter-f',
    name: 'Letter F',
    group: 'Symmetry',
    note: 'The F has no symmetry, yet the amplitude has a centre of symmetry: |F(u, v)| = |F(−u, −v)| for every real image. This is Friedel’s law.',
    draw: () => drawn((field) => fillPolygon(field, LETTER_F)),
  },
  {
    id: 'arrow',
    name: 'Arrow',
    group: 'Symmetry',
    note: 'The arrow has one vertical mirror. The amplitude keeps it and gains a horizontal one, from Friedel’s law.',
    draw: () => drawn((field) => fillPolygon(field, ARROW)),
  },
  {
    id: 'three-blades',
    name: 'Three blades',
    group: 'Symmetry',
    note: 'A three-fold axis and no mirror. Friedel’s law adds a two-fold axis, so the amplitude is six-fold.',
    draw: () => drawPropeller(3),
  },
  {
    id: 'four-blades',
    name: 'Four blades',
    group: 'Symmetry',
    note: 'A four-fold axis and no mirror. The amplitude is four-fold too, and has no mirror either.',
    draw: () => drawPropeller(4),
  },
  {
    id: 'square-lattice',
    name: 'Square',
    group: 'Crystals',
    note: 'Dots every 16 px give spots every 256 / 16 = 16 px: a square lattice has a square reciprocal lattice.',
    lattice: DEFAULT_LATTICE,
  },
  {
    id: 'rectangular-lattice',
    name: 'Rectangular',
    group: 'Crystals',
    note: 'a is twice b, so a* is half b*: the long side of the cell is the short side of the reciprocal cell.',
    lattice: { ...DEFAULT_LATTICE, a: 24, b: 12 },
  },
  {
    id: 'oblique-lattice',
    name: 'Oblique',
    group: 'Crystals',
    note: 'With γ = 70°, a* and b* meet at 110°. a* is perpendicular to b, not parallel to a.',
    lattice: { ...DEFAULT_LATTICE, a: 20, b: 16, gamma: 70 },
  },
  {
    id: 'hexagonal-lattice',
    name: 'Hexagonal',
    group: 'Crystals',
    note: 'A hexagonal lattice has a hexagonal reciprocal lattice, turned by 30°.',
    lattice: { ...DEFAULT_LATTICE, a: 18, b: 18, gamma: 120 },
  },
  {
    id: 'centred-lattice',
    name: 'Centred',
    group: 'Crystals',
    note: 'A second dot in the middle of each cell removes every spot with h + k odd. Zoom in: half the spots of the square lattice are gone.',
    lattice: { ...DEFAULT_LATTICE, a: 24, b: 24, basis: 'centred' },
  },
  {
    id: 'lattice-of-f',
    name: 'Lattice of F',
    group: 'Crystals',
    note: 'Each point carries an F. The spots stay on the reciprocal lattice; how bright each is follows the transform of one F.',
    lattice: { ...DEFAULT_LATTICE, a: 32, b: 32, basis: 'f' },
  },
  {
    id: 'glide',
    name: 'Glide line',
    group: 'Crystals',
    note: 'Each F is mirrored and moved by half of b. Zoom in on the transform: along b*, every spot with k odd is missing. A glide leaves systematic absences.',
    lattice: { ...DEFAULT_LATTICE, a: 32, b: 32, basis: 'glide' },
  },
  {
    id: 'small-crystal',
    name: 'Small crystal',
    group: 'Crystals',
    note: 'A crystal a few cells across gives broad spots: the smaller the crystal, the wider each spot.',
    lattice: { ...DEFAULT_LATTICE, crystal: 22 },
  },
  {
    id: 'noisy-lattice',
    name: 'Noisy',
    group: 'Crystals',
    note: 'Noise hides the dots. Pick a few spots of the transform and the rebuilt image shows the lattice without the noise.',
    lattice: { ...DEFAULT_LATTICE, a: 12, b: 12, crystal: 100, noise: 100 },
  },
];

/** What a bare `/reciprocal` opens on. */
export const DEFAULT_EXAMPLE_ID = 'square-lattice';

/**
 * Find an example by the id a link names.
 * @param id - Candidate id.
 * @returns The example, or `undefined` for an id the page does not ship.
 */
export function exampleById(id: string): ReciprocalExample | undefined {
  return RECIPROCAL_EXAMPLES.find((example) => example.id === id);
}

/**
 * The image an example shows.
 * @param example - The example.
 * @returns Its image, {@link FIELD_SIZE} squared values.
 */
export function exampleImage(example: ReciprocalExample): Float64Array {
  if (example.lattice !== undefined) return latticeImage(example.lattice);
  return example.draw?.() ?? blankField();
}

const ORIGIN = { x: 0, y: 0 };

function drawn(paint: (field: Float64Array) => void): Float64Array {
  const field = blankField();
  paint(field);
  return field;
}

function drawStripes(): Float64Array {
  const field = blankField();
  const period = 16;
  // Whole periods fill the field, so the bars repeat exactly across its edge
  // and every spot is a single pixel.
  for (let left = -FIELD_SIZE / 2; left < FIELD_SIZE / 2; left += period) {
    fillRectangle(
      field,
      { x: left + period / 4 - 0.5, y: 0 },
      period / 2,
      FIELD_SIZE + 2,
    );
  }
  return field;
}

function drawPropeller(blades: number): Float64Array {
  const field = blankField();
  fillDisk(field, ORIGIN, 8);
  for (let blade = 0; blade < blades; blade++) {
    fillPolygon(field, rotatePoints(BLADE, (360 * blade) / blades));
  }
  return field;
}
