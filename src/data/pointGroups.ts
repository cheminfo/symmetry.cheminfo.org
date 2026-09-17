import { POINT_GROUP_ROWS } from './pointGroups/entries.ts';
import type {
  CrystalSystem,
  PointGroup,
  PointGroupClass,
  PointGroupFamily,
} from './pointGroups/types.ts';

export type {
  CrystalSystem,
  PointGroup,
  PointGroupClass,
  PointGroupFamily,
} from './pointGroups/types.ts';

/** Every point group the site teaches, in the order a chemist meets them. */
export const POINT_GROUPS: readonly PointGroup[] =
  POINT_GROUP_ROWS.map(parsePointGroup);

const BY_ID = new Map(POINT_GROUPS.map((group) => [group.id, group]));
const BY_SLUG = new Map(POINT_GROUPS.map((group) => [group.slug, group]));

/**
 * The group with this Schoenflies id.
 *
 * @throws When no group has it, because every caller takes an id from this file.
 */
export function pointGroupById(id: string): PointGroup {
  const group = BY_ID.get(id);
  if (group === undefined) throw new RangeError(`no point group ${id}`);
  return group;
}

/** The group a URL names, or `undefined` for an address nobody minted. */
export function pointGroupBySlug(slug: string): PointGroup | undefined {
  return BY_SLUG.get(slug.toLowerCase());
}

/** The groups with finitely many operations: every one but `C∞v` and `D∞h`. */
export function finitePointGroups(): readonly PointGroup[] {
  return POINT_GROUPS.filter((group) => Number.isFinite(group.order));
}

/** The 32 classes a lattice allows, which is where the Crystals half joins on. */
export function crystallographicPointGroups(): readonly PointGroup[] {
  return POINT_GROUPS.filter((group) => group.crystallographic);
}

/** The 11 Laue classes: what a diffraction pattern can tell apart. */
export function laueClasses(): readonly string[] {
  const seen = new Set<string>();
  for (const group of POINT_GROUPS) {
    if (group.laueClass !== null) seen.add(group.laueClass);
  }
  return [...seen];
}

/** One row of {@link POINT_GROUP_ROWS}, with everything derivable derived. */
export function parsePointGroup(row: string): PointGroup {
  const fields = row.split('|');
  if (fields.length !== 8) {
    throw new SyntaxError(`a point group row needs eight fields: ${row}`);
  }
  const [
    id = '',
    family = '',
    principal = '',
    classes = '',
    hm = '',
    hmFull = '',
    system = '',
    laue = '',
  ] = fields;
  const parsed = parseClasses(classes);
  let order = 0;
  for (const entry of parsed) order += entry.size;
  return {
    id,
    slug: id.toLowerCase(),
    schoenflies: id.replace('inf', '∞'),
    family: family as PointGroupFamily,
    principalOrder: principal === 'inf' ? Infinity : Number(principal),
    order,
    classes: parsed,
    hermannMauguin: hm === '' ? null : hm,
    hermannMauguinFull: hmFull === '' ? null : hmFull,
    crystalSystem: system === '' ? null : (system as CrystalSystem),
    laueClass: laue === '' ? null : laue,
    chiral: isChiral(parsed),
    polar: isPolar(id, family as PointGroupFamily),
    centrosymmetric: parsed.some((entry) => entry.label === 'i'),
    crystallographic: hm !== '',
  };
}

/** `E 2C3 3σv` as three classes of 1, 2 and 3 operations. */
export function parseClasses(classes: string): readonly PointGroupClass[] {
  const out: PointGroupClass[] = [];
  for (const label of classes.split(' ')) {
    if (label === '') continue;
    out.push({ label, size: classSize(label) });
  }
  return out;
}

/** The multiplicity a class header starts with. `E` is one, `∞σv` is a continuum. */
function classSize(label: string): number {
  if (label.startsWith('∞')) return Infinity;
  const digits = /^\d+/.exec(label);
  return digits === null ? 1 : Number(digits[0]);
}

/**
 * A chiral group holds only proper rotations. Read off the class headers: every
 * one names an `E` or a `Cₙ`, never a `σ`, an `Sₙ` or the inversion.
 */
function isChiral(classes: readonly PointGroupClass[]): boolean {
  for (const entry of classes) {
    const symbol = entry.label.replace(/^[\d∞]+/, '');
    if (!symbol.startsWith('E') && !symbol.startsWith('C')) return false;
  }
  return true;
}

/**
 * A polar group leaves some direction invariant, so the molecule may carry a
 * permanent dipole. Those are exactly `C1`, `Cs`, `Cₙ`, `C_nv` and `C∞v`: a
 * `C_nh` with n ≥ 2 is not polar, because σ_h reverses the only direction `Cₙ`
 * leaves free.
 */
function isPolar(id: string, family: PointGroupFamily): boolean {
  switch (family) {
    case 'nonaxial': {
      return id !== 'Ci';
    }
    case 'Cn':
    case 'Cnv': {
      return true;
    }
    case 'Cnh':
    case 'Dn':
    case 'Dnh':
    case 'Dnd':
    case 'Sn':
    case 'cubic':
    case 'icosahedral': {
      return false;
    }
    case 'linear': {
      return id === 'Cinfv';
    }
    default: {
      return false;
    }
  }
}
