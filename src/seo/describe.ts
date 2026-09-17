/**
 * Composing the sentence a page is indexed under.
 *
 * A description is worth writing only if a search result shows it whole: under
 * about 110 characters a result pads it with whatever text the crawler found on
 * the page, and over about 160 it is cut off mid-clause. Every page of a
 * catalogue is described from its own entry — its symbol, its order, its
 * lattice — so the window has to be reached with whatever that entry has to
 * say, which is what {@link describe} does.
 */

/** The shortest description a search result shows on its own, in characters. */
export const DESCRIPTION_MIN = 110;

/** The longest it shows before cutting the sentence off. */
export const DESCRIPTION_MAX = 160;

/**
 * What a description is grown to when the entry has more to say. It sits above
 * {@link DESCRIPTION_MIN} because 110 characters is the floor, not the goal: a
 * clause that fits is a clause the reader gets.
 */
export const DESCRIPTION_TARGET = 132;

/**
 * A description grown from what the entry itself says, until a search result
 * has a whole sentence to show.
 *
 * Each entry of `extras` is one choice, written longest first: at most one of
 * its clauses is used, and it is the first that still fits. Growing stops once
 * the text passes {@link DESCRIPTION_TARGET}, so what a group has least to say
 * about is what gets left off — a cubic group never reaches its Laue class, and
 * a triclinic one always does.
 * @param base - What every entry of this kind says, and says first.
 * @param extras - Clauses to grow it with, most worth reading first.
 * @returns The description, between {@link DESCRIPTION_MIN} and
 * {@link DESCRIPTION_MAX} characters.
 * @throws {RangeError} When no arrangement lands in the window. That is a prose
 * defect and it is refused here, where it is written, rather than shipped to a
 * crawler that will silently truncate it.
 */
export function describe(
  base: string,
  extras: ReadonlyArray<readonly string[]> = [],
): string {
  let text = base.trim();
  for (const choice of extras) {
    if (text.length >= DESCRIPTION_TARGET) break;
    for (const clause of choice) {
      const grown = `${text} ${clause}`;
      if (grown.length <= DESCRIPTION_MAX) {
        text = grown;
        break;
      }
    }
  }
  if (text.length < DESCRIPTION_MIN || text.length > DESCRIPTION_MAX) {
    throw new RangeError(
      `a page description is ${DESCRIPTION_MIN} to ${DESCRIPTION_MAX} characters; this one is ${text.length}: ${text}`,
    );
  }
  return text;
}

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
