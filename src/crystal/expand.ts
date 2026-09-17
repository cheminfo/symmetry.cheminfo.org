/**
 * The asymmetric unit becomes the cell.
 *
 * Every atom the space group generates comes from `orbit()`, which walks the
 * coset list in exact integer arithmetic, so a special position is deduplicated
 * rather than drawn four times on top of itself. Each atom remembers the site it
 * came from and the operation that put it there, which is what lets the page say
 * *this chlorine is the one the c glide made*.
 */

import type { CrystalOperation, Dimension } from '../symmetry/core/index.ts';
import { orbit, siteSymmetry } from '../symmetry/core/index.ts';

/** One line of the asymmetric unit, as a CIF or the atom table gives it. */
export interface AsymmetricSite {
  /** `Na1` — the label the file uses, unique within the structure. */
  readonly label: string;
  /** Chemical symbol, `Na`. */
  readonly element: string;
  /** Fractional coordinate along **a**. */
  readonly x: number;
  /** Fractional coordinate along **b**. */
  readonly y: number;
  /** Fractional coordinate along **c**. */
  readonly z: number;
  /**
   * How much of the site this atom occupies.
   * @default 1
   */
  readonly occupancy?: number;
}

/** One atom of the filled cell, and where it came from. */
export interface ExpandedAtom {
  /** The label of the site it came from. */
  readonly label: string;
  readonly element: string;
  /** Fractional position, wrapped into [0, 1). */
  readonly position: readonly [number, number, number];
  /** Index into the asymmetric unit it was generated from. */
  readonly siteIndex: number;
  /** Index into the operation list of the operation that generated it. */
  readonly operationIndex: number;
  readonly occupancy: number;
}

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
 * Every atom of one cell, in fractional coordinates.
 *
 * @param sites - The asymmetric unit, in the order the file lists it.
 * @param operations - The full coset list of the setting, centring included.
 * @param tolerance - Fractional distance below which two images are one atom.
 *   @default 1e-4
 * @returns The atoms, grouped by the site they came from, each carrying the
 *   index of the operation that generated it.
 */
export function expandStructure(
  sites: readonly AsymmetricSite[],
  operations: ReadonlyArray<CrystalOperation<Dimension>>,
  tolerance?: number,
): ExpandedAtom[] {
  const atoms: ExpandedAtom[] = [];
  for (let index = 0; index < sites.length; index++) {
    const site = sites[index];
    if (site === undefined) continue;
    atoms.push(...expandSite(site, index, operations, tolerance));
  }
  return atoms;
}

/**
 * The orbit of one site.
 *
 * @param site - The line of the asymmetric unit.
 * @param siteIndex - Where it sits in that list, carried onto every atom.
 * @param operations - The full coset list.
 * @param tolerance - As {@link expandStructure}.
 *   @default 1e-4
 * @returns One atom per distinct image, the site's own position first.
 */
export function expandSite(
  site: AsymmetricSite,
  siteIndex: number,
  operations: ReadonlyArray<CrystalOperation<Dimension>>,
  tolerance?: number,
): ExpandedAtom[] {
  const images = orbit([site.x, site.y, site.z], operations, tolerance);
  const atoms: ExpandedAtom[] = [];
  for (const image of images) {
    atoms.push({
      label: site.label,
      element: site.element,
      position: [
        image.position[0] ?? 0,
        image.position[1] ?? 0,
        image.position[2] ?? 0,
      ],
      siteIndex,
      operationIndex: image.operationIndex,
      occupancy: site.occupancy ?? 1,
    });
  }
  return atoms;
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
 * @param tolerance - As {@link expandStructure}.
 *   @default 1e-4
 */
export function describeSites(
  sites: readonly AsymmetricSite[],
  operations: ReadonlyArray<CrystalOperation<Dimension>>,
  tolerance?: number,
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
