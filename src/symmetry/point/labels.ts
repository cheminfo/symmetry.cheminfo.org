import type { PointGroup } from '../../data/pointGroups.ts';
import { primitiveDirection } from '../core/integerMatrix.ts';
import type { PointOperation } from '../operations.ts';
import { relabelOperation } from '../operations.ts';

import type { Vec3 } from './vec3.ts';
import { dotProduct, sameAxis } from './vec3.ts';

/** Two axes count as perpendicular below this `|û · v̂|`. */
const PERPENDICULAR = 1e-3;

/** How far a component of a unit axis may sit from a whole direction index. */
const INDEX_TOLERANCE = 1e-3;

/** The largest multiple tried when looking for whole direction indices. */
const INDEX_LIMIT = 8;

/** What a class of two or three is numbered with, the first of them bare. */
const PRIMES = ['', '′', '″'];

const Z_AXIS: Vec3 = [0, 0, 1];

/**
 * The same operations, with every mirror named for where it sits: σ_h is
 * perpendicular to the principal axis, σ_v holds it and a perpendicular `C₂`,
 * σ_d holds it and bisects two of them.
 *
 * With no principal axis — the cubic and icosahedral groups — a plane keeps the
 * bare `σ`, because which of theirs is called σ_h is a property of the setting
 * and not of the operation. For the same reason every vertical plane of a `D_nh`
 * with even n comes back as σ_v: its planes all hold a perpendicular `C₂`, and
 * which half is called σ_d follows from which axes are called `C₂′` — a choice
 * of setting that also swaps `B₁` and `B₂` in the character table. The class
 * labels of the catalogue carry that convention; an operation cannot.
 */
export function labelOperations(
  operations: readonly PointOperation[],
  principal: Vec3 | null,
): readonly PointOperation[] {
  if (principal === null) return operations;
  const perpendicular: Vec3[] = [];
  for (const operation of operations) {
    if (operation.kind !== 'Cn' || operation.order !== 2) continue;
    const axis = operation.axis as Vec3;
    if (Math.abs(dotProduct(axis, principal)) < PERPENDICULAR) {
      perpendicular.push(axis);
    }
  }
  const out: PointOperation[] = [];
  for (const operation of operations) {
    if (operation.kind !== 'sigma') {
      out.push(operation);
      continue;
    }
    const normal = operation.axis as Vec3;
    if (sameAxis(normal, principal)) {
      out.push(relabelOperation(operation, 'σh'));
      continue;
    }
    const holdsC2 = perpendicular.some(
      (axis) => Math.abs(dotProduct(axis, normal)) < PERPENDICULAR,
    );
    out.push(
      relabelOperation(
        operation,
        perpendicular.length === 0 || holdsC2 ? 'σv' : 'σd',
      ),
    );
  }
  return out;
}

/** **z**, unless the group has no single principal axis. */
export function principalAxisOf(group: PointGroup): Vec3 | null {
  return group.family === 'cubic' ||
    group.family === 'icosahedral' ||
    group.id === 'C1' ||
    group.id === 'Ci'
    ? null
    : Z_AXIS;
}

/**
 * Every operation of a set, named the way a chemist writes it on a page, and
 * all distinct.
 *
 * A label that occurs once is the name. A label a group repeats is told apart
 * by **where** the operation acts, and there the naming follows the textbook
 * rather than the arithmetic:
 *
 * - along a coordinate axis or in a coordinate plane, by its letters —
 *   `σv(xz)`, `C2(y)`;
 * - along any other rational direction, by its direction indices —
 *   `C2(110)`, `σ(11̄0)`, which is how a cubic group's axes have always been
 *   written;
 * - and where no direction index exists, because the axes lie at 30° or 36° to
 *   the cell, the class is **numbered** — two or three of them with primes,
 *   `σv`, `σv′`, `σv″`, and more of them `σd(1)` … `σd(6)`.
 *
 * Never by its Cartesian components: `σd(⊥[0.259 0.966 0])` is exact, teaches
 * nothing and is not what the reader has to type back.
 *
 * The prime is written as a power — `σv^′` — because that is where
 * `operationLabelParts` puts what is set above the symbol, which is where a
 * prime goes.
 * @param operations - The operations, in the order they are printed.
 * @returns One name per operation, all distinct.
 */
export function operationDisplayNames(
  operations: readonly PointOperation[],
): readonly string[] {
  const places: Array<string | null> = [];
  const counts = new Map<string, number>();
  for (const operation of operations) {
    places.push(operationPlace(operation));
    counts.set(operation.label, (counts.get(operation.label) ?? 0) + 1);
  }
  const used = new Map<string, number>();
  const names: string[] = [];
  for (let index = 0; index < operations.length; index++) {
    const operation = operations[index] as PointOperation;
    const label = operation.label;
    const total = counts.get(label) ?? 1;
    if (total < 2) {
      names.push(label);
      continue;
    }
    const seen = used.get(label) ?? 0;
    used.set(label, seen + 1);
    switch (schemeFor(operations, places, label, total)) {
      case 'place': {
        names.push(`${label}(${places[index] as string})`);
        break;
      }
      case 'prime': {
        names.push(seen === 0 ? label : `${label}^${PRIMES[seen] as string}`);
        break;
      }
      case 'index': {
        names.push(`${label}(${seen + 1})`);
        break;
      }
      // no default
    }
  }
  return names;
}

/**
 * Where an operation acts, written the way a chemist writes it.
 *
 * @param operation - Any operation.
 * @returns `xz` or `y` for a coordinate plane or axis, `110` or `11̄0` for any
 *   other rational direction, and `null` for an operation with no axis or one
 *   whose direction has no whole indices.
 */
export function operationPlace(operation: PointOperation): string | null {
  const axis = operation.axis;
  if (axis === null) return null;
  const letter = axisLetter(axis);
  if (!letter.startsWith('[')) {
    if (operation.kind !== 'sigma') return letter;
    if (letter === 'x') return 'yz';
    return letter === 'y' ? 'xz' : 'xy';
  }
  return directionIndices(axis);
}

/**
 * Where an operation acts: the plane it reflects in, or the axis it turns
 * about.
 *
 * It is what tells two operations of one group apart when their labels are the
 * same — C₂ᵥ has two `σv` — so it names the second of them in a link, in an
 * exercise and in the class headers of a listing, all in one spelling.
 * @param operation - Any operation.
 * @returns `xz`, `y`, `⊥[1 1 0]`, or `centre` for one with no axis.
 */
export function operationSituation(operation: PointOperation): string {
  const axis = operation.axis;
  if (axis === null) return 'centre';
  const letter = axisLetter(axis);
  if (operation.kind !== 'sigma') return letter;
  if (letter === 'x') return 'yz';
  if (letter === 'y') return 'xz';
  if (letter === 'z') return 'xy';
  return `⊥${letter}`;
}

/**
 * How an axis is written: `x`, `y` or `z` when it lies along one of them, and
 * otherwise the direction itself.
 * @param axis - A unit axis, or a plane normal.
 * @returns The letter, or `[a b c]`.
 */
export function axisLetter(axis: Vec3): string {
  const rounded: number[] = [];
  for (let index = 0; index < 3; index++) {
    rounded.push(Math.round((axis[index] ?? 0) * 1e6) / 1e6);
  }
  const letters = ['x', 'y', 'z'];
  for (let index = 0; index < 3; index++) {
    const second = rounded[(index + 1) % 3] as number;
    const third = rounded[(index + 2) % 3] as number;
    if (
      Math.abs(rounded[index] as number) === 1 &&
      second === 0 &&
      third === 0
    ) {
      return letters[index] as string;
    }
  }
  return `[${rounded.map(trim).join(' ')}]`;
}

/** A component with no trailing zeroes, and no `-0`. */
function trim(value: number): string {
  return String(value === 0 ? 0 : Math.round(value * 1000) / 1000);
}

/**
 * How a repeated label is told apart: by where each one acts, by a prime, or by
 * a number. The choice is made once per label, so a class is never half named
 * one way and half the other.
 */
function schemeFor(
  operations: readonly PointOperation[],
  places: ReadonlyArray<string | null>,
  label: string,
  total: number,
): 'place' | 'prime' | 'index' {
  const seen = new Set<string>();
  for (let index = 0; index < operations.length; index++) {
    if (operations[index]?.label !== label) continue;
    const place = places[index];
    if (place === null || place === undefined || seen.has(place)) {
      // A prime cannot sit over a power, so `C3^2` is numbered instead.
      return total <= 3 && !label.includes('^') ? 'prime' : 'index';
    }
    seen.add(place);
  }
  return 'place';
}

/**
 * The direction indices of an axis: `[0.707 0.707 0]` is the `110` direction.
 *
 * `null` when no small whole multiple of the axis is whole — the two-folds of a
 * hexagonal group lie at 30° to the cell and have no Cartesian indices.
 */
function directionIndices(axis: Vec3): string | null {
  let smallest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < 3; index++) {
    const size = Math.abs(axis[index] ?? 0);
    if (size > INDEX_TOLERANCE && size < smallest) smallest = size;
  }
  if (!Number.isFinite(smallest)) return null;
  for (let multiple = 1; multiple <= INDEX_LIMIT; multiple++) {
    const whole = wholeMultiple(axis, smallest / multiple);
    if (whole === null) continue;
    const primitive = primitiveDirection(whole);
    if (primitive === null) continue;
    let written = '';
    for (const value of primitive) written += indexDigit(value);
    return written;
  }
  return null;
}

/** The axis divided by `unit`, when every component lands on a whole number. */
function wholeMultiple(axis: Vec3, unit: number): number[] | null {
  const whole: number[] = [];
  for (let index = 0; index < 3; index++) {
    const scaled = (axis[index] ?? 0) / unit;
    const rounded = Math.round(scaled);
    if (Math.abs(scaled - rounded) > INDEX_TOLERANCE / unit) return null;
    whole.push(rounded);
  }
  return whole;
}

/** One index, with a bar over a negative one: `-1` is written `1̄`. */
function indexDigit(value: number): string {
  return value < 0 ? `${-value}̄` : String(value);
}
