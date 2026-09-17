import { SPACE_GROUP_ROWS } from './spaceGroupRows.ts';

/** The seven crystal systems, named by the point group rather than the lattice. */
export type CrystalSystem =
  | 'triclinic'
  | 'monoclinic'
  | 'orthorhombic'
  | 'tetragonal'
  | 'trigonal'
  | 'hexagonal'
  | 'cubic';

/** The Bravais letter a Hermann–Mauguin symbol opens with. */
export type Centring = 'P' | 'A' | 'B' | 'C' | 'I' | 'F' | 'R';

/**
 * One setting of one space group: a choice of axes, origin and cell for the
 * same group, so the same crystal is described by the same operations written
 * in a different basis.
 *
 * A space group is addressed by its **number**, and a setting by
 * `number/variant`; no Hermann–Mauguin string is ever an identity, because the
 * spellings in the wild are not stable. `variant` is dense from 0 within a
 * number, and variant 0 is the setting the site opens by default.
 */
export interface SpaceGroupSetting {
  /** International Tables number, 1 to 230. */
  readonly number: number;
  /** Index of this setting within its number, dense from 0. */
  readonly variant: number;
  /** The standard short symbol of the number: `P 21/c`, `F m -3 m`. */
  readonly hmShort: string;
  /** The International Tables full symbol of the number: `P 1 21/c 1`. */
  readonly hmFull: string;
  /** This setting's own symbol: `P 1 1 21/a`. Equal to `hmFull` above number 74. */
  readonly hmSetting: string;
  /** The pre-2002 spelling of `hmShort` — `C c c a` for `C c c e`. Five numbers have one. */
  readonly hmLegacy: string | null;
  /** The Hall symbol, the one string that pins a setting. Absent above number 74. */
  readonly hall: string | null;
  readonly crystalSystem: CrystalSystem;
  readonly centring: Centring;
  /** Which axes an `R` group is written on. `null` for every other group. */
  readonly axes: 'hexagonal' | 'rhombohedral' | null;
  /** Which of the two origins this setting takes, when the group offers a choice. */
  readonly originChoice: 1 | 2 | null;
  /** The axis a monoclinic setting is built on. `null` for every other system. */
  readonly uniqueAxis: 'a' | 'b' | 'c' | null;
  /** The crystal class, in Hermann–Mauguin: `2/m`, `-42m`, `m-3m`. One of 32. */
  readonly crystalClass: string;
  /** The Laue class, the symmetry the diffraction pattern shows. One of 11. */
  readonly laueClass: string;
  /** Whether `-x,-y,-z` is an operation of the group. */
  readonly centrosymmetric: boolean;
  /** Whether every operation is proper, so one enantiomer can crystallise in it. */
  readonly sohncke: boolean;
  /** Whether some origin makes the group the semidirect product of point group and lattice. */
  readonly symmorphic: boolean;
  /** How many operations the cell carries — the multiplicity of a general position. */
  readonly multiplicity: number;
  /** The coset list as canonical triplets, centring expanded: `-x,y+1/2,-z+1/2`. */
  readonly operations: readonly string[];
}

/**
 * The 521 settings of the 230 space groups, in source order: ascending number,
 * then ascending variant.
 *
 * Every field but the symbols and the Hall symbol is derived from the operation
 * list rather than transcribed — see `src/symmetry/spaceGroupDerivation.ts`,
 * whose tests reproduce the International Tables counts of 92 centrosymmetric,
 * 65 Sohncke and 73 symmorphic groups.
 */
export const SPACE_GROUP_SETTINGS: readonly SpaceGroupSetting[] =
  SPACE_GROUP_ROWS.map(decodeRow);

/** The settings of one space group number, variant 0 first. */
export const SPACE_GROUP_SETTINGS_BY_NUMBER: ReadonlyMap<
  number,
  readonly SpaceGroupSetting[]
> = groupByNumber(SPACE_GROUP_SETTINGS);

function decodeRow(row: string): SpaceGroupSetting {
  const field = row.split('|');
  const flags = field[14] ?? '';
  const operations = (field[15] ?? '').split(';');
  return {
    number: Number(field[0]),
    variant: Number(field[1]),
    hmShort: field[2] ?? '',
    hmFull: field[3] ?? '',
    hmSetting: field[4] ?? '',
    hmLegacy: field[5] === '' ? null : (field[5] ?? null),
    hall: field[6] === '' ? null : (field[6] ?? null),
    crystalSystem: field[7] as CrystalSystem,
    centring: field[8] as Centring,
    axes:
      field[9] === 'hexagonal' || field[9] === 'rhombohedral' ? field[9] : null,
    originChoice: field[10] === '1' ? 1 : field[10] === '2' ? 2 : null,
    uniqueAxis: decodeAxis(field[11]),
    crystalClass: field[12] ?? '',
    laueClass: field[13] ?? '',
    centrosymmetric: flags.startsWith('1'),
    sohncke: flags[1] === '1',
    symmorphic: flags[2] === '1',
    multiplicity: operations.length,
    operations,
  };
}

function decodeAxis(field: string | undefined): 'a' | 'b' | 'c' | null {
  if (field === 'a') return 'a';
  if (field === 'b') return 'b';
  if (field === 'c') return 'c';
  return null;
}

function groupByNumber(
  settings: readonly SpaceGroupSetting[],
): ReadonlyMap<number, readonly SpaceGroupSetting[]> {
  const byNumber = new Map<number, SpaceGroupSetting[]>();
  for (const setting of settings) {
    const list = byNumber.get(setting.number);
    if (list === undefined) byNumber.set(setting.number, [setting]);
    else list.push(setting);
  }
  return byNumber;
}
