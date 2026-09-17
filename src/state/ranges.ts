/**
 * The bounds of every number a link, or a control, can hand the tool.
 *
 * Written once so the share codec that clamps an address and the action that
 * clamps a click cannot drift apart. A shared link is untrusted input: without
 * a ceiling, `?supercell=40` asks for 64000 cells of a 192-operation group and
 * the page never comes back.
 */

/** One bound, as both the share codec and the state action read it. */
export interface NumberRange {
  minimum: number;
  maximum: number;
  /** What the tool shows when nothing asks for anything else. */
  initial: number;
}

/** The 230 space groups, numbered as the International Tables number them. */
export const SPACE_GROUP_RANGE: NumberRange = {
  minimum: 1,
  maximum: 230,
  // Rock salt: the structure a first course meets first, and the group with the
  // most operations, so the cell builder opens on its hardest case.
  initial: 225,
};

/**
 * Which setting of a space group is in force. The 521 settings of the
 * International Tables put at most 18 on one group; the ceiling is loose on
 * purpose, and a number past the end of a group's own list falls back to its
 * first setting where it is read.
 */
export const SETTING_RANGE: NumberRange = {
  minimum: 0,
  maximum: 31,
  initial: 0,
};

/** How many cells are drawn along each axis of the crystal workbench. */
export const SUPERCELL_RANGE: NumberRange = {
  minimum: 1,
  maximum: 4,
  initial: 1,
};

/** How many cells the plane workbench repeats along each direction. */
export const TILES_RANGE: NumberRange = { minimum: 1, maximum: 10, initial: 4 };

/**
 * Bring a number inside a range, rounding it to a whole one.
 * @param value - The number asked for.
 * @param range - The bound it must respect.
 * @returns The nearest whole number the tool can serve.
 */
export function clampToRange(value: number, range: NumberRange): number {
  if (!Number.isFinite(value)) return range.initial;
  return Math.min(range.maximum, Math.max(range.minimum, Math.round(value)));
}
