/**
 * One unique name per operation of a molecule, and how to set it in type.
 *
 * A label is not a name: C₂ᵥ has two operations labelled `σv`, and a link that
 * says `?operation=σv` would be ambiguous. So a repeated label carries the
 * plane it reflects in or the axis it turns about — `σv(xz)`, `C2(y)` — which
 * is the spelling `groupOperationNames` gives the same operations in the
 * standard orientation, and the spelling a tutorial step names one by.
 */

import type { PointOperation } from '../../symmetry/operations.ts';
import { operationSituation } from '../../symmetry/point/labels.ts';

/** A name split for typesetting: `S4^3` is S, then 4, then 3 above. */
export interface OperationLabelParts {
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
  const counts = new Map<string, number>();
  for (const operation of operations) {
    counts.set(operation.label, (counts.get(operation.label) ?? 0) + 1);
  }
  const names: string[] = [];
  const taken = new Set<string>();
  for (const operation of operations) {
    const base =
      (counts.get(operation.label) ?? 0) > 1
        ? `${operation.label}(${operationSituation(operation)})`
        : operation.label;
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
 * @param name - One of {@link operationNames}.
 * @returns The symbol, its subscript, its power and where it acts.
 */
export function operationLabelParts(name: string): OperationLabelParts {
  const open = name.indexOf('(');
  const situation =
    open === -1 ? '' : name.slice(open + 1, name.indexOf(')', open));
  const label = open === -1 ? name : name.slice(0, open);
  const [base = '', power = ''] = label.split('^');
  return {
    symbol: base.slice(0, 1),
    subscript: base.slice(1),
    superscript: power,
    situation,
  };
}
