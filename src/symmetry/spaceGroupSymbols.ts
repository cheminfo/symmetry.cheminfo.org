import type { SpaceGroupSetting } from '../data/spaceGroups.ts';
import { SPACE_GROUP_SETTINGS } from '../data/spaceGroups.ts';

/**
 * Every setting a query names, the standard setting first.
 *
 * The query is an International Tables number, a Hermann–Mauguin symbol in any
 * spelling the wild produces, or a Hall symbol. Ambiguity is not an error: a
 * bare `Fd-3m` genuinely names two coordinate conventions, and both come back
 * so the page can say so and let the reader pick.
 *
 * ```
 * resolveSpaceGroups('Fm-3m')      // [225/0]
 * resolveSpaceGroups('F m -3 m')   // the same setting
 * resolveSpaceGroups('Fm3m')       // and again, written without the bar
 * resolveSpaceGroups('P2(1)/c')    // the nine settings of 14, P 1 21/c 1 first
 * resolveSpaceGroups('R-3c:R')     // 167/1, the rhombohedral axes
 * resolveSpaceGroups('Ccca')       // 68, under its pre-2002 spelling
 * ```
 *
 * @param query - A number, or a symbol with an optional `:1`, `:2`, `:H` or
 *   `:R` qualifier. A qualifier that matches nothing is ignored rather than
 *   obeyed, so a link written before a spelling changed still opens.
 * @returns The matching settings, or an empty array when nothing matches.
 */
export function resolveSpaceGroups(
  query: string | number,
): readonly SpaceGroupSetting[] {
  if (typeof query === 'number') return settingsOfNumber(query);
  const { symbol, qualifier } = splitQualifier(query.trim());
  const number = /^\d+$/.test(symbol) ? Number(symbol) : null;
  const candidates =
    number === null
      ? (index().get(normalizeSpaceGroupSymbol(symbol)) ?? [])
      : settingsOfNumber(number);
  return applyQualifier(candidates, qualifier);
}

/**
 * The one setting a query names, or `null`. When several match, the first —
 * which is the lowest variant of the lowest number, the setting the site opens
 * by default. Use {@link resolveSpaceGroups} when the ambiguity matters.
 */
export function resolveSpaceGroup(
  query: string | number,
): SpaceGroupSetting | null {
  return resolveSpaceGroups(query)[0] ?? null;
}

/**
 * A Hermann–Mauguin or Hall symbol reduced to the form the index is keyed on:
 * upper case, no spaces, no `_`, no parentheses, `.` read as `/`, and a
 * combining overbar read as a leading minus.
 *
 * It turns `P2(1)/c`, `P2_1/c`, `P 21/c` and `P 63.m m c`'s siblings into one
 * string, which is what lets a CIF written by any program find its group.
 */
export function normalizeSpaceGroupSymbol(symbol: string): string {
  return symbol
    .replaceAll(/(?<digit>\d)[̄̅¯]/gu, '-$<digit>')
    .replaceAll(/[\s_()]/g, '')
    .replaceAll('.', '/')
    .toUpperCase();
}

/** The settings of one International Tables number, variant 0 first. */
function settingsOfNumber(number: number): readonly SpaceGroupSetting[] {
  const found: SpaceGroupSetting[] = [];
  for (const setting of SPACE_GROUP_SETTINGS) {
    if (setting.number === number) found.push(setting);
  }
  return found;
}

/**
 * The trailing setting qualifier, in any of the spellings in use: `R-3c:H`,
 * `R-3cH`, `Fd-3m:2`, `Fd-3m S`.
 *
 * The `S` and `Z` letters of the older literature are recognised and dropped
 * rather than read as an origin: which of the two they name is a convention
 * this repository has no source for, and guessing it would silently move every
 * atom of a diamond-type structure by (1/8, 1/8, 1/8).
 */
function splitQualifier(query: string): {
  symbol: string;
  qualifier: string | null;
} {
  const tagged = /^(?<symbol>.*?)\s*:\s*(?<tag>[12HRhr])$/.exec(query);
  if (tagged !== null) {
    return {
      symbol: tagged.groups?.symbol ?? '',
      qualifier: (tagged.groups?.tag ?? '').toUpperCase(),
    };
  }
  const lettered = /^(?<symbol>.*\S)\s*(?<tag>[SZsz])$/.exec(query);
  if (lettered !== null) {
    return { symbol: lettered.groups?.symbol ?? '', qualifier: null };
  }
  const glued = /^(?<symbol>.*-3.*?)(?<tag>[HRhr])$/.exec(query);
  if (glued !== null) {
    return {
      symbol: glued.groups?.symbol ?? '',
      qualifier: (glued.groups?.tag ?? '').toUpperCase(),
    };
  }
  return { symbol: query, qualifier: null };
}

function applyQualifier(
  candidates: readonly SpaceGroupSetting[],
  qualifier: string | null,
): readonly SpaceGroupSetting[] {
  if (qualifier === null) return candidates;
  const kept = candidates.filter((setting) =>
    qualifier === '1' || qualifier === '2'
      ? setting.originChoice === Number(qualifier)
      : setting.axes === (qualifier === 'H' ? 'hexagonal' : 'rhombohedral'),
  );
  return kept.length === 0 ? candidates : kept;
}

let cached: Map<string, SpaceGroupSetting[]> | null = null;

/**
 * Every spelling of every setting, built once. A key is registered only when it
 * is free, so a Hall symbol never displaces a Hermann–Mauguin one and the
 * bar-less `P1` keeps meaning group 1 rather than `P-1`.
 */
function index(): ReadonlyMap<string, SpaceGroupSetting[]> {
  if (cached !== null) return cached;
  const built = new Map<string, SpaceGroupSetting[]>();
  const add = (key: string, setting: SpaceGroupSetting) => {
    if (key.length === 0) return;
    const list = built.get(key);
    if (list === undefined) built.set(key, [setting]);
    else if (!list.includes(setting)) list.push(setting);
  };
  for (const pass of ['symbols', 'hall', 'barless'] as const) {
    for (const setting of SPACE_GROUP_SETTINGS) {
      if (pass === 'symbols') {
        for (const symbol of [
          setting.hmShort,
          setting.hmFull,
          setting.hmSetting,
          setting.hmLegacy ?? '',
        ]) {
          add(normalizeSpaceGroupSymbol(symbol), setting);
        }
      } else if (pass === 'hall') {
        if (setting.hall !== null) {
          const key = normalizeSpaceGroupSymbol(setting.hall);
          if (!built.has(key)) add(key, setting);
        }
      } else {
        for (const symbol of [
          setting.hmShort,
          setting.hmFull,
          setting.hmSetting,
          setting.hmLegacy ?? '',
        ]) {
          const key = normalizeSpaceGroupSymbol(symbol).replaceAll('-', '');
          if (!built.has(key)) add(key, setting);
        }
      }
    }
  }
  cached = built;
  return built;
}
