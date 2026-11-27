import { TWELFTHS_PER_CELL } from 'react-cheminfo/crystal';

/**
 * A count of twelfths reduced into [0, 12).
 * @param twelfths - A translation, in twelfths of a cell.
 * @returns The same translation, within one cell.
 */
export function wrapTwelfths(twelfths: number): number {
  return (
    ((twelfths % TWELFTHS_PER_CELL) + TWELFTHS_PER_CELL) % TWELFTHS_PER_CELL
  );
}

/** Variable names of a fractional coordinate, in order. */
export const AXIS_NAMES = ['x', 'y', 'z'] as const;
