/**
 * One unique name per operation of a molecule, and how to set it in type.
 *
 * A label is not a name: C₂ᵥ has two operations labelled `σv`, and a link that
 * says `?operation=σv` would be ambiguous. So a repeated label carries where it
 * acts — `σv(xz)`, `C3(111)`, `σd(1)` — in the one spelling the catalogue and
 * the workbench share, and the spelling a tutorial step names one by.
 */

import type { PointOperation } from '../../symmetry/operations.ts';
import { operationDisplayNames } from '../../symmetry/point/labels.ts';

/** A name split for typesetting: `S4^3` is S, then 4, then 3 above. */
export interface OperationLabelParts {
  /** How many operations a class header counts: `2` for `2C6`, else nothing. */
  readonly multiplicity: string;
  /** `C`, `S`, `σ`, `E`, `i`. */
  readonly symbol: string;
  /** What is set below: `3`, `v`, `∞`, or nothing. */
  readonly subscript: string;
  /** The power, set above: `2` for `C3^2`, or nothing. */
  readonly superscript: string;
  /** Where it acts, from a name that needed it: `xz`, `y`, or nothing. */
  readonly situation: string;
}

/**
 * Name every operation, in the order they were given.
 *
 * @param operations - The molecule's operations, in its own frame.
 * @returns One name per operation, all distinct.
 */
export function operationNames(
  operations: readonly PointOperation[],
): readonly string[] {
  const displayed = operationDisplayNames(operations);
  const names: string[] = [];
  const taken = new Set<string>();
  for (const base of displayed) {
    // Two axes that round to the same direction would otherwise share a name,
    // and the second would never be reachable from a link.
    let name = base;
    let suffix = 2;
    while (taken.has(name)) name = `${base}#${suffix++}`;
    taken.add(name);
    names.push(name);
  }
  return names;
}

/**
 * Which operation a link or a tutorial step names.
 *
 * @param operations - The molecule's operations.
 * @param name - The name carried by `?operation=`.
 * @returns Its index, or -1 when this molecule has no such operation — a link
 *   written against another molecule must land, not throw.
 */
export function indexOfName(
  operations: readonly PointOperation[],
  name: string,
): number {
  return operationNames(operations).indexOf(name);
}

/**
 * A name, split into what is set where.
 *
 * Also splits a class header, which is a count in front of a name: the `2` of
 * `2C6` stays on the line, where a subscripted one would read as an order.
 *
 * @param name - One of {@link operationNames}, or a class header like `2C6`.
 * @returns The count, the symbol, its subscript, its power and where it acts.
 */
export function operationLabelParts(name: string): OperationLabelParts {
  const open = name.indexOf('(');
  const situation =
    open === -1 ? '' : name.slice(open + 1, name.indexOf(')', open));
  const label = open === -1 ? name : name.slice(0, open);
  const counted = /^(?<count>\d+)(?<rest>\D.*)$/.exec(label);
  const multiplicity = counted?.groups?.count ?? '';
  const [base = '', power = ''] = (counted?.groups?.rest ?? label).split('^');
  return {
    multiplicity,
    symbol: base.slice(0, 1),
    subscript: base.slice(1),
    superscript: power,
    situation,
  };
}
