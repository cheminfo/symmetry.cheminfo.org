import type { SpaceGroupSetting } from '../data/spaceGroups.ts';

import { centringTranslations, wrapTwelfths } from './core/index.ts';
import {
  REFLECTION_CLASSES,
  coefficientsIn,
  leavesInvariant,
} from './reflectionClasses.ts';
import type { ReflectionCondition } from './reflectionConditions.ts';
import { conditionOf } from './reflectionConditions.ts';
import { spaceGroupOperations } from './spaceGroupOperations.ts';

export type { ReflectionCondition } from './reflectionConditions.ts';

/** How far the redundancy check counts along each basis vector of a class. */
const PROBE = 6;

/**
 * The systematic absences of a setting, derived from its operations rather than
 * looked up: a reflection is extinct when an operation leaves it where it is
 * and moves the structure by a fraction of a cell, so every rule in the
 * International Tables absence tables falls out of the same list that draws the
 * cell.
 *
 * ```
 * absentReflections(setting)   // P 21/c
 * // h0l: l = 2n   (c ⊥ (010))
 * // 0k0: k = 2n   (2_1 ∥ [010])
 * ```
 *
 * The list is **minimal**: a condition implied by the ones on the whole of
 * `hkl` is not repeated on a zone or a row, where the International Tables
 * restate it. Nothing is lost — {@link isSystematicallyAbsent} reads the
 * operations, not this list.
 *
 * Classes are written with three indices. A hexagonal group's `hhl` is the
 * four-index `hh2h̄l`, and its `h-hl` is `hh̄0l`.
 */
export function absentReflections(
  setting: SpaceGroupSetting,
): readonly ReflectionCondition[] {
  const operations = spaceGroupOperations(setting);
  const centring = centringTranslations(operations);
  const found = new Map<string, ReflectionCondition>();
  for (const operation of operations) {
    const condition = conditionOf(operation, centring);
    if (condition === null) continue;
    const key = `${condition.reflections}|${condition.coefficients.join(',')}|${condition.modulus}`;
    if (!found.has(key)) found.set(key, condition);
  }
  return order(minimise([...found.values()]));
}

/**
 * Whether a reflection is extinct by symmetry alone — true when some operation
 * `(W, w)` has `h · W = h` and `h · w` is not a whole number.
 *
 * It is exact and independent of {@link absentReflections}: `0 0 3` comes back
 * `true` for `P 21/c`, because `00l` lies inside the `h0l` zone of the c glide.
 *
 * @param hkl - The three Miller indices.
 * @param setting - The setting the reflection is measured in.
 */
export function isSystematicallyAbsent(
  hkl: readonly number[],
  setting: SpaceGroupSetting,
): boolean {
  for (const operation of spaceGroupOperations(setting)) {
    if (!leavesInvariant(hkl, operation.rotation)) continue;
    let twelfths = 0;
    for (let index = 0; index < 3; index++) {
      twelfths += (hkl[index] ?? 0) * (operation.translation[index] ?? 0);
    }
    if (wrapTwelfths(twelfths) !== 0) return true;
  }
  return false;
}

/**
 * Drops every condition the others already force, and keeps the plainest of
 * the ones that survive: several operations of a centred group state the same
 * restriction in different words, and `l = 2n` is what a reader wants rather
 * than the `2k - l = 6n` an equally true centring-shifted glide gives.
 *
 * The conditions on the whole of `hkl` are kept as they stand — no centring
 * vector implies another — and each other class is worked through from the
 * plainest condition, then pruned again so a condition a stronger one has
 * since made redundant goes.
 */
function minimise(
  conditions: readonly ReflectionCondition[],
): ReflectionCondition[] {
  const general = conditions.filter(
    (condition) => condition.reflectionClass.basis.length === 3,
  );
  const kept: ReflectionCondition[] = [...general];
  const labels = new Set(
    conditions
      .filter((condition) => condition.reflectionClass.basis.length < 3)
      .map((condition) => condition.reflections),
  );
  for (const label of labels) {
    const own = conditions
      .filter((condition) => condition.reflections === label)
      .toSorted(plainestFirst);
    const selected: ReflectionCondition[] = [];
    for (const candidate of own) {
      if (!implied(candidate, [...general, ...selected])) {
        selected.push(candidate);
      }
    }
    for (let index = 0; index < selected.length; index++) {
      const others = [
        ...general,
        ...selected.slice(0, index),
        ...selected.slice(index + 1),
      ];
      const candidate = selected[index];
      if (candidate !== undefined && implied(candidate, others)) {
        selected.splice(index--, 1);
      }
    }
    kept.push(...selected);
  }
  return kept;
}

/** Smallest period, then fewest terms, then fewest minus signs, then smallest. */
function plainestFirst(a: ReflectionCondition, b: ReflectionCondition): number {
  return (
    a.modulus - b.modulus ||
    count(a, (value) => value !== 0) - count(b, (value) => value !== 0) ||
    count(a, (value) => value < 0) - count(b, (value) => value < 0) ||
    weight(a) - weight(b) ||
    a.condition.localeCompare(b.condition)
  );
}

function count(
  condition: ReflectionCondition,
  matches: (value: number) => boolean,
): number {
  let total = 0;
  for (const value of condition.coefficients) {
    if (matches(value)) total++;
  }
  return total;
}

function weight(condition: ReflectionCondition): number {
  let total = 0;
  for (const value of condition.coefficients) total += Math.abs(value);
  return total;
}

/** Whether every reflection the others allow already satisfies `candidate`. */
function implied(
  candidate: ReflectionCondition,
  others: readonly ReflectionCondition[],
): boolean {
  const basis = candidate.reflectionClass.basis;
  const counts = new Array<number>(basis.length).fill(-PROBE);
  for (;;) {
    const hkl = [0, 0, 0];
    for (let index = 0; index < basis.length; index++) {
      for (let axis = 0; axis < 3; axis++) {
        hkl[axis] =
          (hkl[axis] ?? 0) + (counts[index] ?? 0) * (basis[index]?.[axis] ?? 0);
      }
    }
    let allowed = true;
    for (const other of others) {
      if (!satisfied(other, hkl)) allowed = false;
    }
    if (allowed && !satisfied(candidate, hkl)) return false;
    let axis = basis.length - 1;
    while (axis >= 0 && (counts[axis] ?? 0) === PROBE) {
      counts[axis] = -PROBE;
      axis--;
    }
    if (axis < 0) return true;
    counts[axis] = (counts[axis] ?? 0) + 1;
  }
}

function satisfied(
  condition: ReflectionCondition,
  hkl: readonly number[],
): boolean {
  const coefficients = coefficientsIn(condition.reflectionClass, hkl);
  if (coefficients === null) return true;
  let sum = 0;
  for (let index = 0; index < coefficients.length; index++) {
    sum += (condition.coefficients[index] ?? 0) * (coefficients[index] ?? 0);
  }
  return (
    ((sum % condition.modulus) + condition.modulus) % condition.modulus === 0
  );
}

function order(
  conditions: readonly ReflectionCondition[],
): readonly ReflectionCondition[] {
  const rank = new Map(
    REFLECTION_CLASSES.map((entry, index) => [entry.label, index]),
  );
  return conditions.toSorted(
    (a, b) =>
      (rank.get(a.reflections) ?? 0) - (rank.get(b.reflections) ?? 0) ||
      a.condition.localeCompare(b.condition),
  );
}
