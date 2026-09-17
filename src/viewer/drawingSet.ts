/**
 * The set of symmetry elements currently drawn, kept as a list so a page can
 * add and remove one at a time without rebuilding its own bookkeeping.
 *
 * The mesh behind them is rebuilt whole on every change — a handful of rods and
 * squares costs nothing — but the *set* is edited, which is what lets a chip bar
 * turn the mirrors off and leave the axes alone.
 */

import type { SymmetryDrawing } from './types.ts';

/**
 * Add the drawings, replacing any that carry an id already present.
 *
 * @param current - What is drawn now.
 * @param incoming - What to add or replace.
 * @returns The new set: the current order kept, anything genuinely new appended.
 */
export function mergeDrawings(
  current: readonly SymmetryDrawing[],
  incoming: readonly SymmetryDrawing[],
): SymmetryDrawing[] {
  const replacements = new Map<string, SymmetryDrawing>();
  for (const drawing of incoming) replacements.set(drawing.id, drawing);
  const merged: SymmetryDrawing[] = [];
  for (const drawing of current) {
    merged.push(replacements.get(drawing.id) ?? drawing);
    replacements.delete(drawing.id);
  }
  for (const drawing of incoming) {
    const pending = replacements.get(drawing.id);
    if (pending === undefined) continue;
    merged.push(pending);
    replacements.delete(drawing.id);
  }
  return merged;
}

/**
 * Drop the drawings with these ids.
 *
 * @param current - What is drawn now.
 * @param ids - Which to remove; an id that is not drawn is ignored.
 * @returns The rest, in the order they were in.
 */
export function withoutDrawings(
  current: readonly SymmetryDrawing[],
  ids: readonly string[],
): SymmetryDrawing[] {
  const dropped = new Set(ids);
  const kept: SymmetryDrawing[] = [];
  for (const drawing of current) {
    if (!dropped.has(drawing.id)) kept.push(drawing);
  }
  return kept;
}

/**
 * Whether two sets would draw the same thing, so an unchanged render is skipped.
 *
 * @param a - One set.
 * @param b - The other.
 * @returns Whether they hold the same drawings, in the same order.
 */
export function sameDrawings(
  a: readonly SymmetryDrawing[],
  b: readonly SymmetryDrawing[],
): boolean {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) return false;
  }
  return true;
}
