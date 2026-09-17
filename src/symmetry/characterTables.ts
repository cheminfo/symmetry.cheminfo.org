import type {
  Character,
  CharacterTable,
  Complex,
  Irrep,
} from '../data/characterTables.ts';
import {
  characterTableOf,
  imaginaryPart,
  realPart,
} from '../data/characterTables.ts';

export type {
  Character,
  CharacterTable,
  Complex,
  Irrep,
} from '../data/characterTables.ts';
export { characterTableOf } from '../data/characterTables.ts';

/** One row of a table as a textbook prints it: a complex pair, summed. */
export interface DisplayRow {
  readonly mulliken: string;
  readonly dimension: number;
  /** Always real: the sum of a pair is `2cos(2πmk/n)`. */
  readonly characters: readonly number[];
  /** `true` when this row is a pair written as one, so the page can say so. */
  readonly combined: boolean;
  readonly linear: readonly string[];
  readonly quadratic: readonly string[];
}

/** |G|, the sum of the class sizes. */
export function groupOrderOf(table: CharacterTable): number {
  let order = 0;
  for (const size of table.classSizes) order += size;
  return order;
}

/**
 * The rows a page prints: the two halves of a separably-degenerate pair added
 * into the one real row a textbook shows.
 *
 * **This is display, and nothing else.** A combined row is the sum of two
 * irreps, so it is not an irrep: it has no place in an orthogonality relation
 * and would make a table hold fewer rows than classes. Every calculation uses
 * `table.irreps`.
 */
export function displayRows(table: CharacterTable): readonly DisplayRow[] {
  const rows: DisplayRow[] = [];
  for (let i = 0; i < table.irreps.length; i++) {
    const irrep = table.irreps[i] as Irrep;
    const partner = table.irreps[i + 1];
    if (irrep.pairHalf !== 1 || partner?.pairHalf !== 2) {
      rows.push({
        mulliken: irrep.mulliken,
        dimension: irrep.dimension,
        characters: irrep.characters.map(realPart),
        combined: false,
        linear: irrep.linear,
        quadratic: irrep.quadratic,
      });
      continue;
    }
    const characters: number[] = [];
    for (let c = 0; c < irrep.characters.length; c++) {
      characters.push(
        realPart(irrep.characters[c] as Character) +
          realPart(partner.characters[c] as Character),
      );
    }
    rows.push({
      mulliken: irrep.mulliken,
      dimension: 2,
      characters,
      combined: true,
      linear: [...irrep.linear, ...partner.linear],
      quadratic: [...irrep.quadratic, ...partner.quadratic],
    });
    i++;
  }
  return rows;
}

/**
 * `(1/|G|) Σ_c g_c χ_i(c) χ_j(c)*` — 1 when the two irreps are the same one and
 * 0 otherwise. The conjugation is what makes it hold for a complex pair.
 */
export function firstOrthogonality(
  table: CharacterTable,
  i: number,
  j: number,
): Complex {
  const left = (table.irreps[i] as Irrep).characters;
  const right = (table.irreps[j] as Irrep).characters;
  let re = 0;
  let im = 0;
  for (let c = 0; c < table.classSizes.length; c++) {
    const size = table.classSizes[c] as number;
    const product = multiplyCharacters(
      left[c] as Character,
      conjugateCharacter(right[c] as Character),
    );
    re += size * product.re;
    im += size * product.im;
  }
  const order = groupOrderOf(table);
  return { re: re / order, im: im / order };
}

/**
 * `Σ_i χ_i(c) χ_i(c′)*` — `|G| / g_c` when the two classes are the same one and
 * 0 otherwise.
 */
export function secondOrthogonality(
  table: CharacterTable,
  c: number,
  d: number,
): Complex {
  let re = 0;
  let im = 0;
  for (const irrep of table.irreps) {
    const product = multiplyCharacters(
      irrep.characters[c] as Character,
      conjugateCharacter(irrep.characters[d] as Character),
    );
    re += product.re;
    im += product.im;
  }
  return { re, im };
}

/**
 * How many times each irrep occurs in a reducible representation:
 * `n_i = (1/|G|) Σ_c g_c χ_Γ(c) χ_i(c)*`.
 *
 * The counts come back in the order of `table.irreps`, so the two halves of a
 * complex pair each get their own, and a physically doubly-degenerate mode shows
 * as one in each half.
 *
 * @throws When the representation does not have one character per class.
 */
export function reduceRepresentation(
  table: CharacterTable,
  characters: readonly number[],
): readonly number[] {
  if (characters.length !== table.classes.length) {
    throw new RangeError(
      `a representation of ${table.group} needs ${table.classes.length} characters`,
    );
  }
  const order = groupOrderOf(table);
  const counts: number[] = [];
  for (const irrep of table.irreps) {
    let re = 0;
    for (let c = 0; c < characters.length; c++) {
      const conjugate = conjugateCharacter(irrep.characters[c] as Character);
      const size = table.classSizes[c] as number;
      re += size * (characters[c] as number) * conjugate.re;
    }
    counts.push(re / order);
  }
  return counts;
}

/** The table of a group. @throws When the site ships none for it. */
export function requireCharacterTable(group: string): CharacterTable {
  const table = characterTableOf(group);
  if (table === undefined) {
    throw new RangeError(`no character table for ${group}`);
  }
  return table;
}

/** χ*, as a complex number. */
export function conjugateCharacter(character: Character): Complex {
  return { re: realPart(character), im: -imaginaryPart(character) };
}

/** The product of two characters. */
export function multiplyCharacters(a: Character, b: Character): Complex {
  const ar = realPart(a);
  const ai = imaginaryPart(a);
  const br = realPart(b);
  const bi = imaginaryPart(b);
  return { re: ar * br - ai * bi, im: ar * bi + ai * br };
}
