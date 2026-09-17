/**
 * The precision every drawn coordinate is written at.
 *
 * An SVG these components produce is exported and diffed, and a test pins the
 * transform strings, so a coordinate must not depend on the last bit of a
 * cosine. Six decimals is finer than any screen and coarser than every rounding
 * error the conjugation `M W M⁻¹` introduces.
 */

/** Decimals kept in a coordinate, a matrix entry or a path. */
export const DRAWING_DECIMALS = 6;

/**
 * A coordinate at drawing precision, with `-0` folded onto `0`.
 *
 * @param value - Any finite number.
 * @returns The same number rounded, never `-0`, so `String()` is reproducible.
 */
export function round(value: number): number {
  const factor = 10 ** DRAWING_DECIMALS;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}
