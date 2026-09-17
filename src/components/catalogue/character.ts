/**
 * Printing a character.
 *
 * Its own file so `CharacterTableView.tsx` exports a component and nothing
 * else, which is what keeps fast refresh working on it.
 */

/** How close to a whole number a character has to be to be printed as one. */
const WHOLE = 1e-9;

/**
 * One character, printed.
 *
 * The irrational ones — 2cos 72°, the golden ratio — are real numbers and are
 * shown to three decimals; everything else is whole and is printed whole, so a
 * table of ones and zeros does not read as `1.000`.
 * @param value - The character.
 * @returns What the cell shows.
 */
export function formatCharacter(value: number): string {
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < WHOLE) return String(rounded);
  return value.toFixed(3);
}
