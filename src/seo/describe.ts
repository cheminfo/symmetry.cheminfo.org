/**
 * The words a page is indexed under are counted: `1 class`, `12 classes`, `an
 * oblique lattice`. The sentence itself is grown into the window a search
 * result shows whole by `fitDescription` from `react-cheminfo/core`, which also
 * owns the limits of that window.
 */

/**
 * The count and the word it counts, so the sentence around it reads: `1 class`,
 * `12 classes`, `192 general positions`.
 * @param value - How many.
 * @param singular - The word for one of them.
 * @param plural - The word for several.
 * @default `${singular}s`
 */
export function count(
  value: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

/** `a square lattice`, `an oblique lattice`. */
export function withArticle(noun: string): string {
  return `${/^[aeiou]/i.test(noun) ? 'an' : 'a'} ${noun}`;
}
