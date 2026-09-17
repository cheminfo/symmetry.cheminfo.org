import { matrixDeterminant } from './integerMatrix.ts';
import type { CrystalOperation, Dimension } from './types.ts';
import { AXIS_NAMES, TWELFTHS_PER_CELL } from './types.ts';

/** How far a decimal translation may sit from a twelfth and still be snapped to it. */
const DECIMAL_TOLERANCE = 5e-3;

/**
 * Parse one coordinate triplet — `x,y,z`, `-x+1/2,-y,z+1/2`, `-x+y+2/3,-x+1/3,z+1/3`
 * — into an exact operation.
 *
 * Accepts what the International Tables print and what a CIF may carry: any
 * ordering of the terms (`1/2-x` as well as `-x+1/2`), a leading `+`, upper or
 * lower case, decimal translations (`0.5+x`, `0.33333+y`), a translation of a
 * whole cell, and whitespace anywhere. A two-dimensional operation is `x,y`.
 *
 * @param xyz - The triplet, with or without surrounding whitespace.
 * @param dimension - 2 for a plane group, 3 for a space group.
 * @throws When the triplet has the wrong number of components, carries a
 *   variable coefficient outside {−1, 0, +1}, names an axis the dimension does
 *   not have, has a translation that is not a multiple of 1/12, or is singular.
 */
export function parseOperation<D extends Dimension>(
  xyz: string,
  dimension: D,
): CrystalOperation<D> {
  const components = xyz.split(',');
  if (components.length !== dimension) {
    throw new SyntaxError(
      `expected ${dimension} components in "${xyz.trim()}", received ${components.length}`,
    );
  }
  const rotation: number[][] = [];
  const translation: number[] = [];
  for (let index = 0; index < dimension; index++) {
    const component = parseComponent(components[index] ?? '', dimension, xyz);
    rotation.push(component.row);
    translation.push(component.translation);
  }
  const determinant = matrixDeterminant(rotation);
  if (determinant !== 1 && determinant !== -1) {
    throw new RangeError(
      `"${xyz.trim()}" is not a symmetry operation: its determinant is ${determinant}, not ±1`,
    );
  }
  return { dimension, rotation, translation };
}

/** One component of the triplet: a row of the matrix and one translation. */
function parseComponent(
  source: string,
  dimension: Dimension,
  xyz: string,
): { row: number[]; translation: number } {
  const text = source.replaceAll(/\s+/g, '').toLowerCase();
  if (text.length === 0) {
    throw new SyntaxError(`empty component in "${xyz.trim()}"`);
  }
  const row = new Array<number>(dimension).fill(0);
  let twelfths = 0;
  let cursor = 0;
  while (cursor < text.length) {
    let sign = 1;
    const character = text[cursor];
    if (character === '+') {
      cursor += 1;
    } else if (character === '-') {
      sign = -1;
      cursor += 1;
    } else if (cursor > 0) {
      throw new SyntaxError(
        `missing a sign before "${text.slice(cursor)}" in "${xyz.trim()}"`,
      );
    }
    const number = readNumber(text, cursor, xyz);
    cursor = number.cursor;
    if (text[cursor] === '*') cursor += 1;
    const axis = AXIS_NAMES.indexOf(
      (text[cursor] ?? '') as (typeof AXIS_NAMES)[number],
    );
    if (axis === -1) {
      if (number.value === null) {
        throw new SyntaxError(
          `"${text}" of "${xyz.trim()}" has a term with nothing in it`,
        );
      }
      twelfths += sign * toTwelfths(number.value, xyz);
      continue;
    }
    if (axis >= dimension) {
      throw new SyntaxError(
        `"${xyz.trim()}" names the axis ${AXIS_NAMES[axis]} in ${dimension}D`,
      );
    }
    const coefficient = number.value ?? 1;
    if (coefficient !== 1) {
      throw new RangeError(
        `"${xyz.trim()}" carries the coefficient ${sign * coefficient} on ${AXIS_NAMES[axis]}`,
      );
    }
    const current = row[axis] ?? 0;
    const updated = current + sign;
    if (Math.abs(updated) > 1) {
      throw new RangeError(
        `"${xyz.trim()}" carries the coefficient ${updated} on ${AXIS_NAMES[axis]}`,
      );
    }
    row[axis] = updated;
    cursor += 1;
  }
  return {
    row,
    translation:
      ((twelfths % TWELFTHS_PER_CELL) + TWELFTHS_PER_CELL) % TWELFTHS_PER_CELL,
  };
}

/** A fraction, a decimal or an integer at `cursor`, or `null` when none is there. */
function readNumber(
  text: string,
  cursor: number,
  xyz: string,
): { value: number | null; cursor: number } {
  let end = cursor;
  while (end < text.length && (isDigit(text[end]) || text[end] === '.')) {
    end += 1;
  }
  if (end === cursor) return { value: null, cursor };
  const numerator = Number(text.slice(cursor, end));
  if (!Number.isFinite(numerator)) {
    throw new SyntaxError(
      `"${text.slice(cursor, end)}" is not a number, in "${xyz.trim()}"`,
    );
  }
  if (text[end] !== '/') return { value: numerator, cursor: end };
  let denominatorEnd = end + 1;
  while (denominatorEnd < text.length && isDigit(text[denominatorEnd])) {
    denominatorEnd += 1;
  }
  const denominator = Number(text.slice(end + 1, denominatorEnd));
  if (denominatorEnd === end + 1 || denominator === 0) {
    throw new SyntaxError(
      `"${text}" of "${xyz.trim()}" has an unusable denominator`,
    );
  }
  return { value: numerator / denominator, cursor: denominatorEnd };
}

/** A translation in twelfths, snapping `0.33333` to 4 and refusing `0.4`. */
function toTwelfths(value: number, xyz: string): number {
  const scaled = value * TWELFTHS_PER_CELL;
  const twelfths = Math.round(scaled);
  if (Math.abs(scaled - twelfths) > DECIMAL_TOLERANCE) {
    throw new RangeError(
      `the translation ${value} of "${xyz.trim()}" is not a multiple of 1/12`,
    );
  }
  return twelfths;
}

function isDigit(character: string | undefined): boolean {
  return character !== undefined && character >= '0' && character <= '9';
}
