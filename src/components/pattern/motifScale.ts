/**
 * How large the motif is drawn.
 *
 * A wallpaper fills the plane; a pattern with white space between its copies
 * reads as confetti and teaches nothing. But a group of order twelve has a
 * fundamental domain a twelfth of the cell, so a motif sized for p1 buries its
 * own copies there. The size is therefore derived, not chosen — and derived
 * from the region the motif was **drawn in**, because a shipped motif is
 * authored inside a quarter of the cell while one a student draws covers the
 * whole pad.
 */

import type { Motif } from '../plane/index.ts';

/**
 * The factor the `<defs>` group is scaled by.
 *
 * The target is an edge of `√(2/n)` of the cell — an area of `2/n`, so two
 * copies' worth, which is what makes neighbouring copies meet rather than
 * merely approach. A group of order one or two would want more than a whole
 * cell, and that is where it stops.
 * @param operations - How many coset representatives the group has.
 * @param motif - The shape being repeated.
 * @returns The scale factor, at least {@link MIN_SCALE}.
 */
export function patternMotifScale(operations: number, motif: Motif): number {
  const target = Math.min(1, Math.sqrt(2 / Math.max(1, operations)));
  return Math.max(MIN_SCALE, target / motifDomainEdge(motif));
}

/**
 * The longer edge of the region a motif was drawn in, in cell units.
 * @param motif - The shape being repeated.
 * @returns Its extent; 1 when the motif declares no region.
 */
export function motifDomainEdge(motif: Motif): number {
  const domain = motif.domain;
  if (domain === undefined || domain.length === 0) return 1;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of domain) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const edge = Math.max(maxX - minX, maxY - minY);
  return edge > 0 ? edge : 1;
}

/** Below this the motif is a speck, whatever the arithmetic says. */
const MIN_SCALE = 0.25;
