/**
 * What a cell really contains once the space group has finished with it.
 *
 * A `place-atom` answer is one line of input; what it is marked on is the whole
 * structure that input generates — every orbit, the composition that follows,
 * and the closest approach anywhere in the cell.
 */

import type {
  CellParameters,
  PlacedAtom,
  StructureConstraint,
} from '../../data/exercises/types.ts';
import {
  createLattice,
  minimumImageDistance,
  orbit,
  siteSymmetry,
} from '../core/index.ts';
import { spaceGroup, spaceGroupOperations } from '../spaceGroups.ts';

/** One atom of the generated structure. */
export interface GeneratedAtom {
  readonly element: string;
  readonly position: readonly number[];
}

/** What one line of input became. */
export interface GeneratedSite {
  readonly element: string;
  /** How many copies the cell holds. */
  readonly multiplicity: number;
  /** The Hermann–Mauguin name of the operations that fix it. */
  readonly siteSymmetry: string;
  readonly atoms: readonly GeneratedAtom[];
}

/** Every atom the space group makes from the input, grouped by input line. */
export function generateStructure(
  spaceGroupNumber: number,
  variant: number,
  atoms: readonly PlacedAtom[],
): readonly GeneratedSite[] {
  const operations = spaceGroupOperations(
    spaceGroup(spaceGroupNumber, variant),
  );
  const sites: GeneratedSite[] = [];
  for (const atom of atoms) {
    const position = [atom.x, atom.y, atom.z];
    const images = orbit(position, operations);
    sites.push({
      element: atom.element,
      multiplicity: images.length,
      siteSymmetry: siteSymmetry(position, operations).symbol,
      atoms: images.map((image) => ({
        element: atom.element,
        position: image.position,
      })),
    });
  }
  return sites;
}

/**
 * Whether the generated structure meets one constraint, and what to say if not.
 * @param constraint - What is asked of the structure.
 * @param sites - What {@link generateStructure} produced.
 * @param cell - The cell, needed for a distance.
 * @returns Whether it holds, and the sentence the student reads either way.
 */
export function checkConstraint(
  constraint: StructureConstraint,
  sites: readonly GeneratedSite[],
  cell: CellParameters,
): { passed: boolean; reason: string; actual: string } {
  switch (constraint.kind) {
    case 'multiplicity': {
      const found = multiplicityOf(sites, constraint.element);
      return verdict(
        found === constraint.count,
        constraint.why,
        `${constraint.element}: ${found === null ? 'absent' : found}, and the question wants ${constraint.count}`,
        found === null ? 'absent' : String(found),
      );
    }
    case 'siteSymmetry': {
      const found = symmetryOf(sites, constraint.element);
      return verdict(
        found === constraint.symbol,
        constraint.why,
        `${constraint.element} sits on a site of symmetry ${found ?? 'nothing'}, not ${constraint.symbol}`,
        found ?? 'absent',
      );
    }
    case 'composition': {
      const counts = compositionOf(sites);
      const written = Object.entries(counts)
        .map(([element, count]) => `${element}${count}`)
        .join('');
      return verdict(
        sameRatios(counts, constraint.ratios),
        constraint.why,
        `the cell holds ${written}, which is not the composition asked for`,
        written,
      );
    }
    case 'minDistance': {
      const closest = closestApproach(sites, cell);
      return verdict(
        closest >= constraint.angstrom,
        constraint.why,
        `two atoms are ${closest.toFixed(2)} Å apart, and nothing may be closer than ${constraint.angstrom} Å`,
        `${closest.toFixed(2)} Å`,
      );
    }
    // no default
  }
}

function verdict(
  passed: boolean,
  why: string,
  failure: string,
  actual: string,
): { passed: boolean; reason: string; actual: string } {
  return { passed, reason: passed ? why : failure, actual };
}

function multiplicityOf(
  sites: readonly GeneratedSite[],
  element: string,
): number | null {
  let total: number | null = null;
  for (const site of sites) {
    if (site.element !== element) continue;
    total = (total ?? 0) + site.multiplicity;
  }
  return total;
}

function symmetryOf(
  sites: readonly GeneratedSite[],
  element: string,
): string | null {
  for (const site of sites) {
    if (site.element === element) return site.siteSymmetry;
  }
  return null;
}

function compositionOf(
  sites: readonly GeneratedSite[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const site of sites) {
    counts[site.element] = (counts[site.element] ?? 0) + site.multiplicity;
  }
  return counts;
}

/** Whether two compositions are the same up to a common factor. */
function sameRatios(
  counts: Record<string, number>,
  wanted: Record<string, number>,
): boolean {
  const elements = Object.keys(wanted);
  if (Object.keys(counts).length !== elements.length) return false;
  let factor: number | null = null;
  for (const element of elements) {
    const found = counts[element];
    const asked = wanted[element] ?? 0;
    if (found === undefined || asked === 0) return false;
    const ratio = found / asked;
    if (factor === null) factor = ratio;
    else if (Math.abs(ratio - factor) > 1e-9) return false;
  }
  return factor !== null;
}

/** The closest any two atoms of the structure come, across the cell edge. */
function closestApproach(
  sites: readonly GeneratedSite[],
  cell: CellParameters,
): number {
  const lattice = createLattice(cell);
  const atoms: GeneratedAtom[] = [];
  for (const site of sites) atoms.push(...site.atoms);
  let closest = Number.POSITIVE_INFINITY;
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const distance = minimumImageDistance(
        lattice,
        (atoms[i] as GeneratedAtom).position,
        (atoms[j] as GeneratedAtom).position,
      );
      if (distance < closest) closest = distance;
    }
  }
  return closest;
}
