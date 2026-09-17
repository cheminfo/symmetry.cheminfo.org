/**
 * What made one copy of the motif.
 *
 * The pattern answers "how many" on its own; what a student cannot see is
 * *which* element put a given copy where it is. Each coset representative is
 * decomposed once, so pointing at a copy names the operation and the kind of
 * element it is — and the diagram beside the pattern is where that element is
 * drawn.
 */

import type { CrystalOperation } from '../../symmetry/core/index.ts';
import {
  centringTranslations,
  formatOperation,
  symmetryElement,
} from '../../symmetry/core/index.ts';

/** How a copy is described, in the order the coset list holds the operations. */
export function copyLabels(
  operations: ReadonlyArray<CrystalOperation<2>>,
): string[] {
  const centring = centringTranslations(operations);
  const labels: string[] = [];
  for (const operation of operations) {
    const element = symmetryElement(operation, centring);
    labels.push(
      `${formatOperation(operation)} — ${elementWords(element.kind, element.order, element.symbol)}`,
    );
  }
  return labels;
}

/**
 * The whole caption for one copy: what made it, and which cell it landed in.
 * @param label - From {@link copyLabels}.
 * @param shift - The lattice translation, in whole cells.
 * @returns One line, with the cell named only when it is not the first one.
 */
export function copyCaption(
  label: string,
  shift: readonly [number, number],
): string {
  if (shift[0] === 0 && shift[1] === 0) return label;
  return `${label}, in cell (${shift[0]}, ${shift[1]})`;
}

/**
 * What the element is, in words rather than in a symbol a beginner has not met.
 *
 * In two dimensions there is no screw axis, no inversion centre and no
 * rotoinversion — `−I` is the half turn — so those kinds cannot occur here and
 * the symbol carries them if the core ever changes its mind.
 */
function elementWords(kind: string, order: number, symbol: string): string {
  if (kind === 'identity') return 'the motif itself';
  if (kind === 'translation') return `centring translation ${symbol}`;
  if (kind === 'rotation') return `${order}-fold rotation`;
  if (kind === 'mirror') return 'mirror line';
  if (kind === 'glide') return 'glide line';
  return symbol;
}
