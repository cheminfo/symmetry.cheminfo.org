/**
 * The seven systems and the fourteen lattices.
 *
 * The number of space groups in each system is **counted from the catalogue**,
 * not typed in: it is a number a reader will check, and a printed sheet that
 * disagrees with the tool it came from is worse than no sheet.
 */

import { SPACE_GROUP_SETTINGS } from '../../symmetry/spaceGroups.ts';

import type { SymmetrySection } from './types.ts';
import { row } from './types.ts';

/** The cell constraints and point groups of each system, authored. */
const SYSTEMS: ReadonlyArray<{
  id: string;
  name: string;
  cell: string;
  pointGroups: string;
  lattices: string;
}> = [
  {
    id: 'triclinic',
    name: 'Triclinic',
    cell: 'a≠b≠c, α≠β≠γ',
    pointGroups: '1, -1',
    lattices: 'P',
  },
  {
    id: 'monoclinic',
    name: 'Monoclinic',
    cell: 'a≠b≠c, α=γ=90°≠β',
    pointGroups: '2, m, 2/m',
    lattices: 'P, C',
  },
  {
    id: 'orthorhombic',
    name: 'Orthorhombic',
    cell: 'a≠b≠c, all 90°',
    pointGroups: '222, mm2, mmm',
    lattices: 'P, C, I, F',
  },
  {
    id: 'tetragonal',
    name: 'Tetragonal',
    cell: 'a=b≠c, all 90°',
    pointGroups: '4, -4, 4/m, 422, 4mm, -42m, 4/mmm',
    lattices: 'P, I',
  },
  {
    id: 'trigonal',
    name: 'Trigonal',
    cell: 'a=b≠c, γ=120°',
    pointGroups: '3, -3, 32, 3m, -3m',
    lattices: 'P, R',
  },
  {
    id: 'hexagonal',
    name: 'Hexagonal',
    cell: 'a=b≠c, γ=120°',
    pointGroups: '6, -6, 6/m, 622, 6mm, -6m2, 6/mmm',
    lattices: 'P',
  },
  {
    id: 'cubic',
    name: 'Cubic',
    cell: 'a=b=c, all 90°',
    pointGroups: '23, m-3, 432, -43m, m-3m',
    lattices: 'P, I, F',
  },
];

/** How many of the 230 belong to each system, counted from the catalogue. */
export function spaceGroupsPerSystem(): ReadonlyMap<string, number> {
  const numbers = new Map<string, Set<number>>();
  for (const setting of SPACE_GROUP_SETTINGS) {
    const seen = numbers.get(setting.crystalSystem) ?? new Set<number>();
    seen.add(setting.number);
    numbers.set(setting.crystalSystem, seen);
  }
  const counts = new Map<string, number>();
  for (const [system, seen] of numbers) counts.set(system, seen.size);
  return counts;
}

/** Seven systems, with their counts read off the 230. */
export const SYSTEM_SECTION: SymmetrySection = {
  id: 'crystal-systems',
  title: 'Seven systems, 32 point groups',
  level: 'advanced',
  rows: SYSTEMS.map((system) =>
    row(
      system.name,
      `${system.cell}. Point groups ${system.pointGroups}. Lattices ${system.lattices}. ${spaceGroupsPerSystem().get(system.id) ?? 0} space groups.`,
    ),
  ),
};

/** The fourteen, and why there are not more. */
export const BRAVAIS_SECTION: SymmetrySection = {
  id: 'bravais',
  title: 'The 14 Bravais lattices',
  level: 'advanced',
  rows: [
    row('Triclinic', 'P only. 1 lattice.'),
    row('Monoclinic', 'P, C. 2 lattices.'),
    row(
      'Orthorhombic',
      'P, C, I, F. 4 lattices — the only system with all four.',
    ),
    row(
      'Tetragonal',
      'P, I. 2 lattices. C-tetragonal is a smaller P cell turned 45°.',
    ),
    row('Trigonal / rhombohedral', 'R. 1 lattice.'),
    row('Hexagonal', 'P. 1 lattice.'),
    row(
      'Cubic',
      'P, I, F. 3 lattices. C-cubic would break the threefold axes.',
    ),
    row('Total', '1 + 2 + 4 + 2 + 1 + 1 + 3 = 14.'),
  ],
};
