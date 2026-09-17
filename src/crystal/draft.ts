/**
 * The structure on the workbench, as the student is editing it.
 *
 * A cell, a list of sites in fractional coordinates, and nothing derived: the
 * orbit, the multiplicities, the elements and the drawing are all functions of
 * this plus the setting in force, and are computed where they are drawn. The
 * setting itself is not here — it lives in the view state, because the address
 * carries it — so there is one answer to *which group is this* rather than two.
 *
 * Every draft's cell obeys the constraint of the setting in force
 * ({@link cellConstraint}): the forced parameters are derived, never typed, so
 * they cannot contradict the group.
 */

import type { SpaceGroupSetting } from '../data/spaceGroups.ts';
import type { UnitCell } from '../symmetry/core/index.ts';

import type { CellParameter } from './cellConstraints.ts';
import { applyCellConstraint, cellConstraint } from './cellConstraints.ts';
import type {
  CrystalSite,
  CrystalSource,
  CrystalStructure,
} from './cif/index.ts';

/** What the workbench holds and the atom table edits. */
export interface CrystalDraft {
  /** What to call it on screen, and the `data_` block of the file it writes. */
  readonly name: string;
  /** `_chemical_formula_sum` as the file gave it; `''` when it gave none. */
  readonly formula: string;
  readonly cell: UnitCell;
  /** The asymmetric unit, in the order the table shows it. */
  readonly sites: readonly CrystalSite[];
  /** Where the coordinates came from, carried through to the file written out. */
  readonly source: CrystalSource;
}

/**
 * The cell an empty workbench starts from, before a setting constrains it.
 *
 * No two of the six agree, so every constraint is visible the moment it takes
 * hold: a tetragonal setting makes `b` follow `a`, and a monoclinic one on
 * unique axis `c` leaves `γ` at 95° while pinning the other two.
 */
export const DEFAULT_CELL: UnitCell = {
  a: 5,
  b: 6,
  c: 7,
  alpha: 70,
  beta: 100,
  gamma: 95,
};

/**
 * An empty cell in one setting: one atom at the origin, so the workbench opens
 * on something the symmetry has work to do on.
 *
 * @param setting - The setting in force.
 */
export function emptyDraft(setting: SpaceGroupSetting): CrystalDraft {
  return {
    name: 'New structure',
    formula: '',
    cell: applyCellConstraint(DEFAULT_CELL, cellConstraint(setting)),
    sites: [site('C1', 'C', 0, 0, 0)],
    source: {},
  };
}

/**
 * The workbench draft of a structure read from a file.
 *
 * @param structure - What `readCif` returned.
 * @param setting - The setting the file was resolved to.
 * @param name - What to call it; the file's own block name when absent.
 */
export function draftOf(
  structure: CrystalStructure,
  setting: SpaceGroupSetting,
  name?: string,
): CrystalDraft {
  return {
    name: name ?? structure.name,
    formula: structure.formula,
    cell: applyCellConstraint(structure.cell, cellConstraint(setting)),
    sites: structure.sites,
    source: structure.source,
  };
}

/**
 * The draft as a structure a CIF can be written from.
 *
 * Both the symbol and the whole coset list go in, so a file this site writes is
 * unambiguous whatever reads it next — including a reader that knows nothing of
 * origin choices and would otherwise put every diamond atom an eighth of a cell
 * away.
 *
 * @param draft - The structure on the workbench.
 * @param setting - The setting in force.
 */
export function draftStructure(
  draft: CrystalDraft,
  setting: SpaceGroupSetting,
): CrystalStructure {
  return {
    name: draft.name,
    formula: draft.formula,
    cell: draft.cell,
    spaceGroup: {
      number: setting.number,
      hm: setting.hmSetting,
      hall: setting.hall,
    },
    symopsXyz: setting.operations,
    sites: draft.sites,
    source: draft.source,
  };
}

/**
 * The draft rewritten for another setting: only the parameters that setting
 * forces move, and the atoms do not.
 *
 * Moving the atoms would be a change of basis, which is a different operation
 * and is not what picking another group off the list means.
 *
 * @param draft - The structure on the workbench.
 * @param setting - The setting now in force.
 */
export function reconstrain(
  draft: CrystalDraft,
  setting: SpaceGroupSetting,
): CrystalDraft {
  const cell = applyCellConstraint(draft.cell, cellConstraint(setting));
  return { ...draft, cell };
}

/**
 * One cell parameter typed, and every parameter that follows it re-derived.
 *
 * @param draft - The structure on the workbench.
 * @param setting - The setting in force.
 * @param key - The parameter typed into.
 * @param value - What was typed. A value that is not a positive number is
 *   refused and the draft comes back unchanged, so a half-typed field never
 *   empties the cell.
 */
export function withCellParameter(
  draft: CrystalDraft,
  setting: SpaceGroupSetting,
  key: CellParameter,
  value: number,
): CrystalDraft {
  if (!Number.isFinite(value) || value <= 0) return draft;
  const cell = applyCellConstraint(
    { ...draft.cell, [key]: value },
    cellConstraint(setting),
  );
  return { ...draft, cell };
}

/**
 * One site changed.
 *
 * @param draft - The structure on the workbench.
 * @param index - Which line of the asymmetric unit.
 * @param patch - The fields that changed.
 */
export function withSite(
  draft: CrystalDraft,
  index: number,
  patch: Partial<CrystalSite>,
): CrystalDraft {
  const current = draft.sites[index];
  if (current === undefined) return draft;
  const sites = [...draft.sites];
  sites[index] = { ...current, ...patch };
  return { ...draft, sites };
}

/**
 * A site added at the end, labelled so it cannot collide with one already there.
 *
 * @param draft - The structure on the workbench.
 * @param element - Chemical symbol of the atom added.
 *   @default 'C'
 */
export function withSiteAdded(
  draft: CrystalDraft,
  element = 'C',
): CrystalDraft {
  const label = nextSiteLabel(draft.sites, element);
  return { ...draft, sites: [...draft.sites, site(label, element, 0, 0, 0)] };
}

/**
 * One site removed. The last one cannot be: a cell with no atoms in it draws
 * nothing, and the student then has no row to type into.
 *
 * @param draft - The structure on the workbench.
 * @param index - Which line of the asymmetric unit.
 */
export function withSiteRemoved(
  draft: CrystalDraft,
  index: number,
): CrystalDraft {
  if (draft.sites.length <= 1 || draft.sites[index] === undefined) return draft;
  return { ...draft, sites: draft.sites.filter((_, at) => at !== index) };
}

/**
 * The first `<element><n>` no site is using.
 *
 * @param sites - The asymmetric unit as it stands.
 * @param element - Chemical symbol of the atom being added.
 */
export function nextSiteLabel(
  sites: readonly CrystalSite[],
  element: string,
): string {
  const taken = new Set(sites.map((entry) => entry.label));
  for (let index = 1; ; index++) {
    const label = `${element}${index}`;
    if (!taken.has(label)) return label;
  }
}

function site(
  label: string,
  element: string,
  x: number,
  y: number,
  z: number,
): CrystalSite {
  return { label, element, x, y, z, occupancy: 1, uiso: null };
}
