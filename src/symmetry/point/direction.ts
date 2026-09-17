/**
 * How a direction is written on a page.
 *
 * An axis is a unit vector in the code and never one on screen: a chemist reads
 * `z`, `110` or `11̄0`, and `[0.707 0.707 0]` is exact, teaches nothing and is
 * not what anybody has to type back.
 */

import { primitiveDirection } from '../core/integerMatrix.ts';

import type { Vec3 } from './vec3.ts';

/** How far a component of a unit axis may sit from a whole direction index. */
const INDEX_TOLERANCE = 1e-3;

/** The largest multiple tried when looking for whole direction indices. */
const INDEX_LIMIT = 8;

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

/**
 * The direction indices of an axis: `[0.707 0.707 0]` is the `110` direction.
 *
 * `null` when no small whole multiple of the axis is whole — the two-folds of a
 * hexagonal group lie at 30° to the cell and have no Cartesian indices.
 * @param axis - A unit axis, or a plane normal.
 * @returns The indices, with a bar over a negative one, or `null`.
 */
export function directionIndices(axis: Vec3): string | null {
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

/** A component with no trailing zeroes, and no `-0`. */
function trim(value: number): string {
  return String(value === 0 ? 0 : Math.round(value * 1000) / 1000);
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
