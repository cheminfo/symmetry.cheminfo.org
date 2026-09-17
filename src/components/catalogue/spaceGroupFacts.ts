/**
 * What a space-group page states about one setting: the cell its system
 * allows, the symbols it is written with, and the three properties a
 * crystallographer reads first.
 *
 * Every value but the cell constraints is read off the setting, and the setting
 * itself is derived from its operation list rather than transcribed.
 */

import type {
  CrystalSystem,
  SpaceGroupSetting,
} from '../../data/spaceGroups.ts';
import { count } from '../../seo/describe.ts';

import type { EntryFact, SettingChoice } from './types.ts';

/**
 * The short symbol as the International Tables print it and as a student types
 * it: `Pnma`, not the `P n m a` a CIF writes. It is also the spelling the
 * page's own title carries, so the two agree.
 * @param symbol - A Hermann-Mauguin symbol, spaced.
 * @returns The same symbol with the spaces closed up.
 */
export function compactSymbol(symbol: string): string {
  return symbol.replaceAll(' ', '');
}

/**
 * The cell each system allows, in the conventional axes.
 *
 * A `≠` means the symmetry forces nothing, not that the two differ: a
 * monoclinic cell with a = b is monoclinic all the same.
 */
export const CELL_CONSTRAINTS: Record<CrystalSystem, string> = {
  triclinic: 'a ≠ b ≠ c, α ≠ β ≠ γ',
  monoclinic: 'a ≠ b ≠ c, two angles 90°',
  orthorhombic: 'a ≠ b ≠ c, α = β = γ = 90°',
  tetragonal: 'a = b ≠ c, α = β = γ = 90°',
  trigonal: 'a = b ≠ c, α = β = 90°, γ = 120°',
  hexagonal: 'a = b ≠ c, α = β = 90°, γ = 120°',
  cubic: 'a = b = c, α = β = γ = 90°',
};

/** What a Bravais letter means, spelled out. */
const CENTRING_NAMES: Record<string, string> = {
  P: 'primitive',
  A: 'centred on the bc face',
  B: 'centred on the ac face',
  C: 'centred on the ab face',
  I: 'body centred',
  F: 'centred on every face',
  R: 'rhombohedral',
};

/**
 * The cell of one setting: an R group on rhombohedral axes has its own.
 * @param setting - The setting the page is written in.
 * @returns The constraints the symmetry puts on the cell.
 */
export function cellConstraint(setting: SpaceGroupSetting): string {
  if (setting.axes === 'rhombohedral') return 'a = b = c, α = β = γ ≠ 90°';
  return CELL_CONSTRAINTS[setting.crystalSystem];
}

/**
 * The line under the symbol.
 * @param setting - The setting the page is written in.
 * @returns One sentence naming the group and counting its positions.
 */
export function subtitleOf(setting: SpaceGroupSetting): string {
  return `Number ${setting.number} of 230 — ${setting.crystalSystem}, ${setting.centring} lattice, crystal class ${setting.crystalClass}, ${count(setting.multiplicity, 'general position')}.`;
}

/**
 * The definition rows of one setting.
 * @param setting - The setting the page is written in.
 * @returns One row per property, symbols first, then the lattice, then what a
 *   crystallographer checks before choosing it.
 */
export function factsOf(setting: SpaceGroupSetting): readonly EntryFact[] {
  return [
    ...symbolFacts(setting),
    {
      label: 'Hall symbol',
      value: setting.hall ?? 'not published for this setting',
      mono: setting.hall !== null,
    },
    { label: 'Crystal system', value: setting.crystalSystem },
    { label: 'Cell', value: cellConstraint(setting), mono: true },
    { label: 'Centring', value: centringName(setting.centring) },
    ...settingFacts(setting),
    { label: 'Crystal class', value: setting.crystalClass, mono: true },
    { label: 'Laue class', value: setting.laueClass, mono: true },
    { label: 'General positions', value: String(setting.multiplicity) },
    {
      label: 'Inversion',
      value: setting.centrosymmetric
        ? 'centrosymmetric — it holds -x,-y,-z'
        : 'no inversion centre',
    },
    {
      label: 'Chirality',
      value: setting.sohncke
        ? 'Sohncke — every operation is proper, so one enantiomer can crystallise in it'
        : 'not Sohncke — it holds an improper operation',
    },
    {
      label: 'Symmorphic',
      value: setting.symmorphic
        ? 'symmorphic — some origin makes it the point group plus the lattice'
        : 'not symmorphic — it holds a glide plane or a screw axis',
    },
  ];
}

/** The spellings: the number's own, this setting's, and the pre-2002 one. */
function symbolFacts(setting: SpaceGroupSetting): readonly EntryFact[] {
  return [
    { label: 'Number', value: String(setting.number) },
    // Spaced, because the spaces are where the symbol splits by axis direction,
    // which is what the symbol says. The heading above carries the compact form.
    { label: 'Short symbol', value: setting.hmShort, mono: true },
    ...(setting.hmFull === setting.hmShort
      ? []
      : [{ label: 'Full symbol', value: setting.hmFull, mono: true }]),
    ...(setting.hmSetting === setting.hmFull
      ? []
      : [{ label: 'This setting', value: setting.hmSetting, mono: true }]),
    ...(setting.hmLegacy === null
      ? []
      : [{ label: 'Pre-2002 spelling', value: setting.hmLegacy, mono: true }]),
  ];
}

/** The axes, origin and unique-axis choices this setting takes. */
function settingFacts(setting: SpaceGroupSetting): readonly EntryFact[] {
  return [
    ...(setting.uniqueAxis === null
      ? []
      : [{ label: 'Unique axis', value: setting.uniqueAxis, mono: true }]),
    ...(setting.axes === null
      ? []
      : [{ label: 'Axes', value: `${setting.axes} axes` }]),
    ...(setting.originChoice === null
      ? []
      : [{ label: 'Origin', value: `choice ${setting.originChoice}` }]),
  ];
}

/**
 * What a Bravais letter means, spelled out.
 * @param centring - The letter a Hermann-Mauguin symbol opens with.
 * @returns The letter and its meaning.
 */
export function centringName(centring: string): string {
  return `${centring} — ${CENTRING_NAMES[centring] ?? 'centred'}`;
}

/**
 * One setting as the picker offers it.
 * @param setting - One of a number's settings.
 * @returns Its symbol, and what distinguishes it from its siblings.
 */
export function settingChoice(setting: SpaceGroupSetting): SettingChoice {
  const notes: string[] = [];
  if (setting.uniqueAxis !== null) {
    notes.push(`unique axis ${setting.uniqueAxis}`);
  }
  if (setting.axes !== null) notes.push(`${setting.axes} axes`);
  if (setting.originChoice !== null) {
    notes.push(`origin choice ${setting.originChoice}`);
  }
  return {
    index: setting.variant,
    label: setting.hmSetting,
    detail:
      notes.length === 0 ? `setting ${setting.variant + 1}` : notes.join(', '),
  };
}
