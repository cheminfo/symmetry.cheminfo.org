/**
 * Pairing a row of characters with the classes it is printed under.
 *
 * A cell of a character table is keyed by its class name rather than by its
 * position: a table has exactly one character per class, so the name is unique
 * and survives a row being reordered, while a position does not.
 */

/** One cell: the class it sits under, and the character in it. */
export interface CharacterCell {
  /** The class header, in the table's own spelling. */
  readonly className: string;
  /** The character of this row under that class. */
  readonly character: number;
}

/**
 * A row's characters, each carrying the class it sits under.
 *
 * @param classes - The class headers, in table order.
 * @param characters - One character per class, in the same order.
 * @returns The cells, one per character, in the order they are printed.
 */
export function byClass(
  classes: readonly string[],
  characters: readonly number[],
): CharacterCell[] {
  const cells: CharacterCell[] = [];
  for (let index = 0; index < characters.length; index++) {
    cells.push({
      className: classes[index] ?? `column ${index + 1}`,
      character: characters[index] as number,
    });
  }
  return cells;
}
