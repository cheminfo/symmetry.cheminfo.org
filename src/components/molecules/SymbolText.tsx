/**
 * A Mulliken or Schoenflies symbol, set with its subscript.
 *
 * `C2v` is C with `2v` below it, and `A1′` keeps its prime on the line. Writing
 * them as plain text instead reads as a variable name, which is what a student
 * copying one into an exercise then types.
 */

import type { ReactElement } from 'react';

import { symbolParts } from './characters.ts';

/** Props of {@link SymbolText}. */
export interface SymbolTextProps {
  /** `C2v`, `D∞h`, `A1′`, `T2g`. */
  readonly symbol: string;
  /** A class for the outer span. @default undefined */
  readonly className?: string;
}

/**
 * One symbol.
 * @param props - See {@link SymbolTextProps}.
 * @returns The letter, with the rest of the symbol set below it.
 */
export function SymbolText(props: SymbolTextProps): ReactElement {
  const parts = symbolParts(props.symbol);
  return (
    <span className={props.className}>
      {parts.letter}
      {parts.subscript !== '' && <sub>{parts.subscript}</sub>}
      {parts.primes}
    </span>
  );
}
