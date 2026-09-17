import type { FriezeGroup } from '../symmetry/planeGroups.ts';

/**
 * The seven frieze groups: the strip axis is **a**, the period is 1, and **b**
 * runs across the strip and carries no translation at all.
 *
 * The symbol has three slots after the `p`: a half-turn or not, then the
 * reflection whose mirror line crosses the strip, then the reflection or glide
 * in the strip axis itself. Read it in that order and every one of the seven
 * reads off its own picture.
 */
export const FRIEZE_GROUPS: readonly FriezeGroup[] = [
  {
    number: 1,
    id: 'p1',
    full: 'p111',
    orbifold: '∞∞',
    conway: 'hop',
    pointGroup: '1',
    operationsPerPeriod: 1,
    generators: '',
    generalPositions: 'x,y',
    fundamentalDomain: 'The whole period: 0 ≤ x < 1, any y.',
    example: 'A line of identical footprints, all from the same foot.',
  },
  {
    number: 2,
    id: 'p11g',
    full: 'p11g',
    orbifold: '∞×',
    conway: 'step',
    pointGroup: 'm',
    operationsPerPeriod: 2,
    generators: 'x+1/2,-y',
    generalPositions: 'x,y; x+1/2,-y',
    fundamentalDomain: 'Half the period: 0 ≤ x < 1/2, any y.',
    example: 'A walking trail: each print flipped, and half a pace on.',
  },
  {
    number: 3,
    id: 'p1m1',
    full: 'p1m1',
    orbifold: '*∞∞',
    conway: 'sidle',
    pointGroup: 'm',
    operationsPerPeriod: 2,
    generators: '-x,y',
    generalPositions: 'x,y; -x,y',
    fundamentalDomain: 'Half the period: 0 ≤ x ≤ 1/2, any y.',
    example: 'Motifs back to back, then front to front, along the row.',
  },
  {
    number: 4,
    id: 'p11m',
    full: 'p11m',
    orbifold: '∞*',
    conway: 'jump',
    pointGroup: 'm',
    operationsPerPeriod: 2,
    generators: 'x,-y',
    generalPositions: 'x,y; x,-y',
    fundamentalDomain: 'Half the strip: 0 ≤ x < 1, y ≥ 0.',
    example: 'A row of letters and their reflection, as in still water.',
  },
  {
    number: 5,
    id: 'p2',
    full: 'p112',
    orbifold: '22∞',
    conway: 'spinning hop',
    pointGroup: '2',
    operationsPerPeriod: 2,
    generators: '-x,-y',
    generalPositions: 'x,y; -x,-y',
    fundamentalDomain: 'Half the strip: 0 ≤ x < 1, y ≥ 0.',
    example: 'The motif alternately upright and upside down, no mirror.',
  },
  {
    number: 6,
    id: 'p2mg',
    full: 'p2mg',
    orbifold: '2*∞',
    conway: 'spinning sidle',
    pointGroup: '2mm',
    operationsPerPeriod: 4,
    generators: '-x,y; x+1/2,-y',
    generalPositions: 'x,y; -x,y; x+1/2,-y; -x+1/2,-y',
    fundamentalDomain: 'A quarter: 0 ≤ x ≤ 1/2, y ≥ 0.',
    example: 'Mirrors across the strip, and a glide along it between them.',
  },
  {
    number: 7,
    id: 'p2mm',
    full: 'p2mm',
    orbifold: '*22∞',
    conway: 'spinning jump',
    pointGroup: '2mm',
    operationsPerPeriod: 4,
    generators: '-x,y; x,-y',
    generalPositions: 'x,y; -x,y; x,-y; -x,-y',
    fundamentalDomain: 'A quarter: 0 ≤ x ≤ 1/2, y ≥ 0.',
    example: 'Both mirrors: every half-turn centre is a mirror crossing.',
  },
];

/**
 * Why the orbifold is the id to trust when a symbol is copied out of a book.
 *
 * Older literature and the layer-group tradition write the two reflection slots
 * the other way round, so a frieze symbol taken from an old paper has to be read
 * against a picture rather than believed. Those alternative symbols are
 * deliberately not carried here: the seven groups, their generators, their
 * orbifolds and Conway's names are what could be checked.
 */
export const FRIEZE_SYMBOL_NOTE =
  'A frieze symbol from an older paper may write its two reflection slots in the ' +
  'opposite order, so read it against the picture. The orbifold never moves.';

/**
 * Which wallpaper group each frieze group is the strip of — the bridge a
 * tutorial crosses when it goes from one translation direction to two.
 */
export const FRIEZE_TO_WALLPAPER: Readonly<Record<string, string>> = {
  p1: 'p1',
  p11g: 'pg',
  p1m1: 'pm',
  p11m: 'pm',
  p2: 'p2',
  p2mg: 'pmg',
  p2mm: 'pmm',
};
