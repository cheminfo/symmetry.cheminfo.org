import { pointGroupById } from '../pointGroups.ts';

/** A complex character, for the groups whose `E` is a conjugate pair. */
export interface Complex {
  readonly re: number;
  readonly im: number;
}

/** One character: real for most tables, complex for one half of a separable pair. */
export type Character = number | Complex;

/** One row of a character table. */
export interface Irrep {
  /** The Mulliken symbol as printed: `A1`, `A1′`, `B1g`, `Eu`, `T2g`, `Hg`. */
  readonly mulliken: string;
  /** 1 to 5. Equals the character of the identity class, except for a pair half. */
  readonly dimension: number;
  /** One character per class, in the order of {@link CharacterTable.classes}. */
  readonly characters: readonly Character[];
  /**
   * `1` or `2` for the two halves of a separably-degenerate complex pair — the
   * `E` of C₃, C₄, C₅, C₆, C₃h, C₄h, C₆h, S₄, S₆, S₈, T and Tₕ. The pair is the
   * stored truth and is what the orthogonality tests run on; the single real row
   * a table prints is their sum, and is display only.
   */
  readonly pairHalf?: 1 | 2;
  /** Linear and rotational basis functions: `['z']`, `['x','y']`, `['Rz']`. */
  readonly linear: readonly string[];
  /** Quadratic basis functions: `['x2+y2','z2']`, `['xz','yz']`. */
  readonly quadratic: readonly string[];
}

/** A character table, with one irrep per conjugacy class. */
export interface CharacterTable {
  /** The `PointGroup.id` it belongs to. */
  readonly group: string;
  /** Class headers, in the same order and spelling as the catalogue's. */
  readonly classes: readonly string[];
  readonly classSizes: readonly number[];
  readonly irreps: readonly Irrep[];
  /** Said on the page when this table is one of several conventions. */
  readonly conventionNote?: string;
}

/** `exp(2πik/n)`, the character of a cyclic group. */
export function omega(k: number, n: number): Complex {
  const angle = (2 * Math.PI * k) / n;
  return { re: Math.cos(angle), im: Math.sin(angle) };
}

/** Whether a character is one of a complex pair. */
export function isComplex(character: Character): character is Complex {
  return typeof character !== 'number';
}

/** The real part of a character. */
export function realPart(character: Character): number {
  return typeof character === 'number' ? character : character.re;
}

/** The imaginary part of a character, zero for a real one. */
export function imaginaryPart(character: Character): number {
  return typeof character === 'number' ? 0 : character.im;
}

/**
 * A table from its rows, taking the class headers from the point-group
 * catalogue so the two can never drift apart.
 *
 * A row is `mulliken|characters|linear|quadratic`, with a trailing `+` or `−` on
 * the symbol marking the two halves of a complex pair.
 */
export function characterTable(
  group: string,
  rows: readonly string[],
  conventionNote?: string,
): CharacterTable {
  const classes = pointGroupById(group).classes;
  const irreps = rows.map((row) => parseIrrep(row, classes.length, group));
  return {
    group,
    classes: classes.map((entry) => entry.label),
    classSizes: classes.map((entry) => entry.size),
    irreps,
    conventionNote,
  };
}

/** One row of a table. @throws When it does not carry one character per class. */
export function parseIrrep(
  row: string,
  classCount: number,
  group: string,
): Irrep {
  const [symbol, characters, linear, quadratic] = row.split('|');
  if (symbol === undefined || characters === undefined) {
    throw new SyntaxError(
      `an irrep row needs a symbol and its characters: ${row}`,
    );
  }
  const values = characters.split(' ').map(parseCharacter);
  if (values.length !== classCount) {
    throw new SyntaxError(
      `${group} ${symbol} has ${values.length} characters for ${classCount} classes`,
    );
  }
  const half = symbol.endsWith('+') ? 1 : symbol.endsWith('-') ? 2 : undefined;
  const first = values[0] as Character;
  return {
    mulliken: half === undefined ? symbol : symbol.slice(0, -1),
    dimension: half === undefined ? realPart(first) : 1,
    characters: values,
    ...(half === undefined ? {} : { pairHalf: half }),
    linear: splitFunctions(linear),
    quadratic: splitFunctions(quadratic),
  };
}

/**
 * One character.
 *
 * `w1/3` is `exp(2πi/3)`; `a` and `b` are `2cos72°` and `2cos144°`; `p` and `q`
 * are the golden ratio φ and `1 − φ`. They are written as symbols rather than as
 * decimals because a character table is exact, and 0.618034 is not.
 */
export function parseCharacter(token: string): Character {
  const negative = token.startsWith('-');
  const body = negative ? token.slice(1) : token;
  const sign = negative ? -1 : 1;
  if (body.startsWith('w')) {
    const [k, n] = body.slice(1).split('/');
    const root = omega(Number(k), Number(n));
    return { re: sign * root.re, im: sign * root.im };
  }
  const named = NAMED_CHARACTERS.get(body);
  if (named !== undefined) return sign * named;
  const value = Number(token);
  if (Number.isNaN(value)) {
    throw new SyntaxError(`${token} is not a character`);
  }
  return value;
}

/** The irrational characters, by the letter the printed tables give them. */
const NAMED_CHARACTERS = new Map<string, number>([
  ['a', 2 * Math.cos((72 * Math.PI) / 180)],
  ['b', 2 * Math.cos((144 * Math.PI) / 180)],
  ['p', (1 + Math.sqrt(5)) / 2],
  ['q', (1 - Math.sqrt(5)) / 2],
  ['r2', Math.SQRT2],
]);

/** `x y Rz` as three basis functions; an empty field as none. */
function splitFunctions(field: string | undefined): readonly string[] {
  if (field === undefined || field === '') return [];
  return field.split(' ');
}
