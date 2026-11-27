/**
 * The asymmetric unit becomes the cell.
 *
 * Every atom the space group generates comes from `orbit()`, which walks the
 * coset list in exact integer arithmetic, so a special position is deduplicated
 * rather than drawn four times on top of itself. Each atom remembers the site it
 * came from and the operation that put it there, which is what lets the page say
 * *this chlorine is the one the c glide made*.
 */

import type {
  AsymmetricSite,
  CrystalOperation,
  Dimension,
  ExpandedAtom,
} from 'react-cheminfo/crystal';
import { WRITTEN_SITE_TOLERANCE } from 'react-cheminfo/crystal';

import { siteSymmetry } from '../symmetry/core/index.ts';

export type { AsymmetricSite, ExpandedAtom } from 'react-cheminfo/crystal';
export {
  WRITTEN_SITE_TOLERANCE,
  expandSite,
  expandStructure,
} from 'react-cheminfo/crystal';

/** What one line of the asymmetric unit turns out to be. */
export interface SiteReport {
  readonly label: string;
  readonly element: string;
  readonly position: readonly [number, number, number];
  /** How many copies the cell holds — the orbit length, which is exact. */
  readonly multiplicity: number;
  /** Hermann-Mauguin name of the operations that fix it; `1` when nothing does. */
  readonly siteSymmetry: string;
  /** Whether nothing but the identity fixes it. */
  readonly general: boolean;
  readonly occupancy: number;
}

/**
 * What each line of the asymmetric unit is: how many copies of it the cell
 * holds, and the point group of the operations that leave it alone.
 *
 * This is what the site says instead of a Wyckoff letter — `multiplicity 4,
 * site symmetry m-3m` rather than `4a`. Both are derived from the operations,
 * so neither can contradict the group on screen.
 *
 * @param sites - The asymmetric unit.
 * @param operations - The full coset list.
 * @param tolerance - Fractional distance below which two images are one atom,
 *   as {@link expandStructure} takes it.
 *   @default WRITTEN_SITE_TOLERANCE
 */
export function describeSites(
  sites: readonly AsymmetricSite[],
  operations: ReadonlyArray<CrystalOperation<Dimension>>,
  tolerance = WRITTEN_SITE_TOLERANCE,
): SiteReport[] {
  const reports: SiteReport[] = [];
  for (const site of sites) {
    const position: [number, number, number] = [site.x, site.y, site.z];
    const symmetry = siteSymmetry(position, operations, tolerance);
    reports.push({
      label: site.label,
      element: site.element,
      position,
      multiplicity: symmetry.multiplicity,
      siteSymmetry: symmetry.symbol,
      general: symmetry.general,
      occupancy: site.occupancy ?? 1,
    });
  }
  return reports;
}

/**
 * How many atoms of each element one cell holds, counting occupancy.
 *
 * @param atoms - What {@link expandStructure} returned.
 * @returns Element symbol to count, in order of first appearance.
 */
export function cellComposition(
  atoms: readonly ExpandedAtom[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const atom of atoms) {
    counts.set(atom.element, (counts.get(atom.element) ?? 0) + atom.occupancy);
  }
  return counts;
}
