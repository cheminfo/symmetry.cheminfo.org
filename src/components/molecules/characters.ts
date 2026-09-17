/**
 * Setting a character table in type.
 *
 * A table is exact, so the irrational characters are stored as what they are —
 * 2 cos 72°, the golden ratio — and only the printing rounds them. Three
 * decimals is what a textbook prints and is enough to recognise 0.618 as φ − 1.
 */

/** A symbol split for typesetting: `B1g` is B, then 1g below. */
export interface SymbolParts {
  /** `A`, `B`, `E`, `T`, `G`, `H`. */
  readonly letter: string;
  /** What is set below: `1g`, `u`, `2`, or nothing. */
  readonly subscript: string;
  /** The primes that stay on the line: `′`, `″`. */
  readonly primes: string;
}

/** How far a character may be from a whole number and still print as one. */
const WHOLE = 1e-6;

/** The marks that stay on the line rather than dropping to the subscript. */
const PRIME_MARKS = new Set(['′', '″', "'"]);

/** The exponents a basis function is ever written with. */
const POWERS = new Map([
  ['2', '²'],
  ['3', '³'],
  ['4', '⁴'],
]);

/** What a power can stand on: a variable, or a bracketed group. */
const CARRIES_A_POWER = /[a-z)]/i;

/**
 * One character, as a table prints it.
 *
 * @param value - The character, real or the real part of a combined pair.
 * @returns `1`, `−1`, `0`, `1.618`, with a typographic minus.
 */
export function formatCharacter(value: number): string {
  const whole = Math.round(value);
  if (Math.abs(value - whole) < WHOLE) {
    return minus(String(whole === 0 ? 0 : whole));
  }
  const rounded = value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return minus(rounded);
}

/**
 * A basis function, as a table prints it: `x2+y2` is x² + y².
 *
 * A digit is a power only where a power can stand — straight after a variable
 * or a closing bracket. Everywhere else it is a coefficient and stays on the
 * line, which is the difference between T_d's `2z²−x²−y²` and a nonsense
 * leading superscript.
 *
 * @param text - The function as the catalogue writes it.
 * @returns The same function with its powers raised.
 */
export function formatFunction(text: string): string {
  let out = '';
  let previous = '';
  for (const character of text) {
    const power = POWERS.get(character);
    if (character === '-') {
      out += '−';
    } else if (power !== undefined && CARRIES_A_POWER.test(previous)) {
      out += power;
    } else {
      out += character;
    }
    previous = character;
  }
  return out;
}

/**
 * A Mulliken or Schoenflies symbol, split into what is set where. Both are
 * written the same way — one capital, then everything else below it — so
 * `A1′`, `T2g` and `D3h` all go through this.
 *
 * @param symbol - `A1`, `B1g`, `Eu`, `T2g`, `A1′`, `C2v`, `D∞h`.
 * @returns The letter, its subscript and any primes.
 */
export function symbolParts(symbol: string): SymbolParts {
  const letter = symbol.slice(0, 1);
  const rest = symbol.slice(1);
  let subscript = '';
  let primes = '';
  for (const character of rest) {
    if (PRIME_MARKS.has(character)) {
      primes += character;
      continue;
    }
    subscript += character;
  }
  return { letter, subscript, primes };
}

/** A leading hyphen becomes the minus sign a table is set with. */
function minus(text: string): string {
  return text.startsWith('-') ? `−${text.slice(1)}` : text;
}
