/**
 * An operation, set the way a chemist writes it.
 *
 * `C3^2` is C with a 3 below and a 2 above, and a name that had to say where it
 * acts carries that in smaller type after it — so `σv(xz)` reads as one symbol
 * and one address rather than as six characters.
 */

import type { ReactElement } from 'react';

import { operationLabelParts } from './operationNames.ts';

/** Props of {@link OperationLabel}. */
export interface OperationLabelProps {
  /** One of `operationNames`: `C3^2`, `σv(xz)`, `i`. */
  readonly name: string;
  /**
   * Whether the plane or axis it acts in is written after the symbol.
   * @default true
   */
  readonly situation?: boolean;
}

/**
 * One operation's symbol.
 * @param props - See {@link OperationLabelProps}.
 * @returns The symbol, with its order below and its power above.
 */
export function OperationLabel(props: OperationLabelProps): ReactElement {
  const { name, situation = true } = props;
  const parts = operationLabelParts(name);
  return (
    <span>
      {parts.symbol}
      {parts.subscript !== '' && <sub>{parts.subscript}</sub>}
      {parts.superscript !== '' && <sup>{parts.superscript}</sup>}
      {situation && parts.situation !== '' && (
        // The brackets stay: without them `C2(x)` sets as `C2x`, which reads
        // beside `C3^2` as another power rather than as a place.
        <span className="mol-operation__where">{`(${parts.situation})`}</span>
      )}
    </span>
  );
}
