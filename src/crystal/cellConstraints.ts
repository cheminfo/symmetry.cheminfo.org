/**
 * Which of the six cell parameters a setting leaves free, and which it forces.
 *
 * The constraint follows the **setting**, not the crystal system: a monoclinic
 * group on unique axis `c` fixes α and β and frees γ, and the rhombohedral axes
 * of an R group fix nothing at 90° at all. The old site read the system alone,
 * so it silently rewrote 70 of the 105 monoclinic settings into a cell that is
 * not theirs, and forced every trigonal group onto hexagonal axes.
 *
 * Nothing here rewrites what anybody typed. A forced parameter is not an
 * editable field: the page shows it as a derived value and says which setting
 * forces it.
 */

import type { SpaceGroupSetting } from '../data/spaceGroups.ts';
import type { UnitCell } from '../symmetry/core/index.ts';

/** One of the six numbers that describe a cell. */
export type CellParameter = 'a' | 'b' | 'c' | 'alpha' | 'beta' | 'gamma';

/** The six, in the order a form shows them. */
export const CELL_PARAMETERS: readonly CellParameter[] = [
  'a',
  'b',
  'c',
  'alpha',
  'beta',
  'gamma',
];

/** What a setting allows of a cell. */
export interface CellConstraint {
  /** The parameters the student types, in {@link CELL_PARAMETERS} order. */
  readonly free: readonly CellParameter[];
  /** A parameter that copies another: `{ b: 'a' }` reads *b equals a*. */
  readonly equal: Readonly<Partial<Record<CellParameter, CellParameter>>>;
  /** A parameter the setting pins to a number of degrees. */
  readonly fixed: Readonly<Partial<Record<CellParameter, number>>>;
  /** One line saying what forces the rest, for the form to print. */
  readonly why: string;
}

/**
 * The constraint one setting puts on a cell.
 *
 * Every constraint here is checked rather than asserted: a cell obeying it has a
 * metric tensor `G` with `Wᵀ G W = G` for every rotation part of the group, and
 * the test runs that over all 7244 operations of all 521 settings.
 *
 * @param setting - The setting in force, from `src/symmetry/spaceGroups.ts`.
 * @returns Which parameters are free, which copy another and which are pinned.
 */
export function cellConstraint(setting: SpaceGroupSetting): CellConstraint {
  switch (setting.crystalSystem) {
    case 'triclinic': {
      return build({}, {}, 'Triclinic: nothing is forced.');
    }
    case 'monoclinic': {
      return monoclinic(setting.uniqueAxis ?? 'b');
    }
    case 'orthorhombic': {
      return build(
        {},
        RIGHT_ANGLES,
        'Orthorhombic: the three axes are mutually perpendicular.',
      );
    }
    case 'tetragonal': {
      return build(
        { b: 'a' },
        RIGHT_ANGLES,
        'Tetragonal: the 4-fold axis is c, so a and b are one length.',
      );
    }
    case 'cubic': {
      return build(
        { b: 'a', c: 'a' },
        RIGHT_ANGLES,
        'Cubic: the four 3-fold axes make the three edges one length.',
      );
    }
    case 'trigonal':
    case 'hexagonal': {
      return setting.axes === 'rhombohedral'
        ? build(
            { b: 'a', c: 'a', beta: 'alpha', gamma: 'alpha' },
            {},
            'Rhombohedral axes: three equal edges at three equal angles.',
          )
        : build(
            { b: 'a' },
            HEXAGONAL_ANGLES,
            'Hexagonal axes: a and b are one length, at 120° to each other.',
          );
    }
    // no default
  }
}

/**
 * The cell the setting actually describes: every forced parameter recomputed
 * from the free one it follows.
 *
 * @param cell - The cell as it stands, free parameters included.
 * @param constraint - What {@link cellConstraint} returned.
 * @returns A cell obeying the constraint. The free parameters are untouched.
 */
export function applyCellConstraint(
  cell: UnitCell,
  constraint: CellConstraint,
): UnitCell {
  const values: Record<CellParameter, number> = {
    a: cell.a,
    b: cell.b,
    c: cell.c,
    alpha: cell.alpha,
    beta: cell.beta,
    gamma: cell.gamma,
  };
  for (const key of CELL_PARAMETERS) {
    const source = constraint.equal[key];
    if (source !== undefined) values[key] = values[source];
    const fixed = constraint.fixed[key];
    if (fixed !== undefined) values[key] = fixed;
  }
  return values;
}

/**
 * What forces one parameter: the parameter it copies, the number of degrees it
 * is pinned to, or `null` when the student may type it.
 *
 * @param constraint - What {@link cellConstraint} returned.
 * @param key - The parameter asked about.
 */
export function constrainedBy(
  constraint: CellConstraint,
  key: CellParameter,
): CellParameter | number | null {
  return constraint.equal[key] ?? constraint.fixed[key] ?? null;
}

/** How a cell parameter is written on screen. */
export const CELL_PARAMETER_LABELS: Readonly<Record<CellParameter, string>> = {
  a: 'a',
  b: 'b',
  c: 'c',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
};

/** Whether the parameter is an edge, so it is measured in ångström. */
export function isCellEdge(key: CellParameter): boolean {
  return CELL_EDGES.has(key);
}

const CELL_EDGES: ReadonlySet<CellParameter> = new Set(['a', 'b', 'c']);

const RIGHT_ANGLES = { alpha: 90, beta: 90, gamma: 90 };
const HEXAGONAL_ANGLES = { alpha: 90, beta: 90, gamma: 120 };

function monoclinic(unique: 'a' | 'b' | 'c'): CellConstraint {
  const fixed =
    unique === 'b'
      ? { alpha: 90, gamma: 90 }
      : unique === 'c'
        ? { alpha: 90, beta: 90 }
        : { beta: 90, gamma: 90 };
  return build(
    {},
    fixed,
    `Monoclinic on unique axis ${unique}: the other two angles are right angles.`,
  );
}

function build(
  equal: Partial<Record<CellParameter, CellParameter>>,
  fixed: Partial<Record<CellParameter, number>>,
  why: string,
): CellConstraint {
  const free: CellParameter[] = [];
  for (const key of CELL_PARAMETERS) {
    if (equal[key] === undefined && fixed[key] === undefined) free.push(key);
  }
  return { free, equal, fixed, why };
}
