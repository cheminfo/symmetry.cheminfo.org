/**
 * The shapes the pattern workbench repeats.
 *
 * Every one of them is **asymmetric**: a motif that carries a mirror of its own
 * gives the drawing a larger symmetry group than the plane group it was tiled
 * with, and the student then cannot tell p1 from pm. Coordinates are fractional
 * cell coordinates, y-up, so a motif drawn once fits every one of the five
 * plane lattices.
 */

/** One filled shape of a motif. */
export interface MotifPath {
  /** Path data, in fractional cell coordinates. */
  readonly d: string;
  /** Drawn in the site's second colour rather than its first. @default false */
  readonly accent?: boolean;
}

/** A drawing the plane group repeats. */
export interface Motif {
  /** What `?motif=` carries. */
  readonly id: string;
  /** What the picker reads. */
  readonly name: string;
  /** One line saying what it is for. */
  readonly description: string;
  readonly paths: readonly MotifPath[];
  /** The region it was drawn in, as fractional corners, for the outline toggle. */
  readonly domain?: ReadonlyArray<readonly [number, number]>;
}

/** The motifs the site ships, in the order the picker shows them. */
export const MOTIFS: readonly Motif[] = [
  {
    id: 'comma',
    name: 'Comma',
    description:
      'The mark the International Tables use for a point with a handedness.',
    paths: [
      {
        d: 'M 0.12,0.26 C 0.12,0.16 0.28,0.16 0.28,0.26 C 0.28,0.36 0.20,0.44 0.13,0.48 C 0.20,0.40 0.22,0.32 0.15,0.29 Z',
      },
      { d: 'M 0.17,0.20 L 0.24,0.20 L 0.24,0.24 L 0.17,0.24 Z', accent: true },
    ],
    domain: [
      [0, 0],
      [0.5, 0],
      [0.5, 0.5],
      [0, 0.5],
    ],
  },
  {
    id: 'flag',
    name: 'Flag',
    description: 'A pole with a pennant on one side: no symmetry of its own.',
    paths: [
      { d: 'M 0.08,0.06 L 0.12,0.06 L 0.12,0.46 L 0.08,0.46 Z' },
      { d: 'M 0.12,0.44 L 0.40,0.36 L 0.12,0.28 Z', accent: true },
    ],
    domain: [
      [0, 0],
      [0.5, 0],
      [0.5, 0.5],
      [0, 0.5],
    ],
  },
  {
    id: 'step',
    name: 'Step',
    description: 'An L, which turns into something different every way up.',
    paths: [
      {
        d: 'M 0.07,0.07 L 0.42,0.07 L 0.42,0.19 L 0.19,0.19 L 0.19,0.44 L 0.07,0.44 Z',
      },
      {
        d: 'M 0.24,0.24 L 0.38,0.24 L 0.38,0.34 L 0.24,0.34 Z',
        accent: true,
      },
    ],
    domain: [
      [0, 0],
      [0.5, 0],
      [0.5, 0.5],
      [0, 0.5],
    ],
  },
  {
    id: 'wedge',
    name: 'Wedge',
    description: 'A narrow triangle, which reads as an arrow at any size.',
    paths: [
      { d: 'M 0.06,0.10 L 0.40,0.20 L 0.14,0.42 Z' },
      { d: 'M 0.12,0.17 L 0.22,0.20 L 0.15,0.26 Z', accent: true },
    ],
    domain: [
      [0, 0],
      [0.5, 0],
      [0.5, 0.5],
      [0, 0.5],
    ],
  },
];

/** The motif a link names, or the first one when it names nothing the site has. */
export function motifById(id: string | null | undefined): Motif {
  const found = MOTIFS.find((motif) => motif.id === id);
  return found ?? (MOTIFS[0] as Motif);
}
