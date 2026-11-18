/**
 * Whole molecules instead of atoms cut at the cell walls.
 *
 * The expanded cell holds every atom wrapped into [0, 1), so a molecule lying
 * across a face is drawn in pieces at opposite ends of the box. Here the cell
 * is read as the periodic graph it is: two atoms are bonded, possibly across a
 * face, by the rule handed in — the viewer hands the one it draws bonds with,
 * so what is completed here is exactly what it joins. Each molecule is then moved, whole, to the
 * cell its centre falls in, and appears once per cell.
 *
 * A component that reaches its own translate is not a molecule but a network
 * — rock salt, quartz, a metal — and has no whole to complete: its atoms stay
 * where the cell put them.
 */

import type { Lattice } from '../symmetry/core/index.ts';
import { fractionalToCartesian } from '../symmetry/core/index.ts';

/**
 * The longest bond between two elements, in ångström; 0 for a pair never
 * bonded.
 */
export type BondLimit = (a: string, b: string) => number;

/** One atom to draw, in fractional coordinates. */
export interface PackedAtom {
  readonly element: string;
  readonly position: readonly [number, number, number];
}

/** What {@link packMolecules} found. */
export interface PackingResult {
  /** The atoms, each molecule whole and once per cell. */
  readonly atoms: readonly PackedAtom[];
  /**
   * How many molecules one cell holds: sets of two atoms or more bonded to
   * nothing outside themselves. A lone ion is not counted.
   */
  readonly molecules: number;
  /** Whether some atoms belong to a network extending through the crystal. */
  readonly extended: boolean;
}

/**
 * The most atoms per cell the bonds are searched over. The search compares
 * every pair across 27 cells, so a cell beyond this is drawn as it is rather
 * than holding the page for seconds.
 */
export const MAX_PACKED_ATOMS = 2000;

/** Slack on a centroid sitting on a cell face, so it lands in one cell only. */
const CENTRE_TOLERANCE = 1e-6;

/** Atoms closer than this are one atom written twice, never a bond. */
const SAME_PLACE = 1e-4;

/**
 * Complete the molecules of one cell.
 * @param atoms - Every atom of one cell, fractional, wrapped into [0, 1).
 * @param lattice - The cell they sit in.
 * @param bondLimit - When two atoms are bonded.
 * @returns The atoms, molecules whole; the input unchanged when it holds more
 * than {@link MAX_PACKED_ATOMS}.
 */
export function packMolecules(
  atoms: readonly PackedAtom[],
  lattice: Lattice,
  bondLimit: BondLimit,
): PackingResult {
  const count = atoms.length;
  if (count === 0 || count > MAX_PACKED_ATOMS) {
    return { atoms, molecules: 0, extended: false };
  }
  const bonds = periodicBonds(atoms, lattice, bondLimit);
  const component = new Int32Array(count).fill(-1);
  const shifts = new Int32Array(count * 3);
  const packed: PackedAtom[] = [];
  let molecules = 0;
  let extended = false;

  for (let start = 0; start < count; start++) {
    if (component[start] !== -1) continue;
    const members = walkComponent(start, bonds, component, shifts);
    if (members.periodic) {
      extended = true;
      for (const index of members.atoms) {
        packed.push(atoms[index] as PackedAtom);
      }
      continue;
    }
    if (members.atoms.length > 1) molecules++;
    pushMolecule(packed, atoms, members.atoms, shifts);
  }
  return { atoms: packed, molecules, extended };
}

/** Atom `to` sits bonded to atom `from`, in the cell `shift` away. */
interface PeriodicBond {
  readonly to: number;
  readonly shift: readonly [number, number, number];
}

/** One connected set of atoms, and whether it reaches its own translate. */
interface Component {
  readonly atoms: number[];
  readonly periodic: boolean;
}

/**
 * The bonds of one cell, each from an atom of the cell to an atom of it or of
 * one of the 26 cells around it.
 */
function periodicBonds(
  atoms: readonly PackedAtom[],
  lattice: Lattice,
  bondLimit: BondLimit,
): PeriodicBond[][] {
  const count = atoms.length;
  const xyz = new Float64Array(count * 3);
  for (let index = 0; index < count; index++) {
    const point = toCartesian(lattice, (atoms[index] as PackedAtom).position);
    xyz[index * 3] = point[0];
    xyz[index * 3 + 1] = point[1];
    xyz[index * 3 + 2] = point[2];
  }
  const limits = new Map<string, number>();
  const cells = neighbourCells(lattice);
  const bonds: PeriodicBond[][] = [];
  for (let index = 0; index < count; index++) bonds.push([]);

  for (let from = 0; from < count; from++) {
    const fromElement = (atoms[from] as PackedAtom).element;
    for (let to = from; to < count; to++) {
      const toElement = (atoms[to] as PackedAtom).element;
      const pair = `${fromElement} ${toElement}`;
      let limit = limits.get(pair);
      if (limit === undefined) {
        limit = bondLimit(fromElement, toElement);
        limits.set(pair, limit);
      }
      if (limit <= 0) continue;
      const limitSquared = limit * limit;
      const dx = (xyz[to * 3] ?? 0) - (xyz[from * 3] ?? 0);
      const dy = (xyz[to * 3 + 1] ?? 0) - (xyz[from * 3 + 1] ?? 0);
      const dz = (xyz[to * 3 + 2] ?? 0) - (xyz[from * 3 + 2] ?? 0);
      for (const cell of cells) {
        if (to === from && cell.home) continue;
        const x = dx + cell.offset[0];
        const y = dy + cell.offset[1];
        const z = dz + cell.offset[2];
        const squared = x * x + y * y + z * z;
        if (squared > limitSquared || squared < SAME_PLACE * SAME_PLACE) {
          continue;
        }
        const [a, b, c] = cell.shift;
        (bonds[from] as PeriodicBond[]).push({ to, shift: [a, b, c] });
        (bonds[to] as PeriodicBond[]).push({ to: from, shift: [-a, -b, -c] });
      }
    }
  }
  return bonds;
}

/** One of the 27 cells around and including the home cell. */
interface NeighbourCell {
  readonly shift: readonly [number, number, number];
  /** The lattice translation, Cartesian ångström. */
  readonly offset: readonly [number, number, number];
  readonly home: boolean;
}

function neighbourCells(lattice: Lattice): NeighbourCell[] {
  const cells: NeighbourCell[] = [];
  for (let a = -1; a <= 1; a++) {
    for (let b = -1; b <= 1; b++) {
      for (let c = -1; c <= 1; c++) {
        cells.push({
          shift: [a, b, c],
          offset: toCartesian(lattice, [a, b, c]),
          home: a === 0 && b === 0 && c === 0,
        });
      }
    }
  }
  return cells;
}

/**
 * Walk the atoms bonded to `start`, noting which cell each one is reached in.
 * Reaching an atom a second time in another cell means the set is bonded to
 * its own translate: a network, not a molecule.
 */
function walkComponent(
  start: number,
  bonds: readonly PeriodicBond[][],
  component: Int32Array,
  shifts: Int32Array,
): Component {
  const members = [start];
  let periodic = false;
  component[start] = start;
  shifts[start * 3] = 0;
  shifts[start * 3 + 1] = 0;
  shifts[start * 3 + 2] = 0;
  // The walk appends as it goes, and an array iterator reads the length on
  // every step, so the atoms reached are walked in turn.
  for (const from of members) {
    for (const bond of bonds[from] as PeriodicBond[]) {
      const a = (shifts[from * 3] ?? 0) + bond.shift[0];
      const b = (shifts[from * 3 + 1] ?? 0) + bond.shift[1];
      const c = (shifts[from * 3 + 2] ?? 0) + bond.shift[2];
      const to = bond.to;
      if (component[to] === start) {
        if (
          shifts[to * 3] !== a ||
          shifts[to * 3 + 1] !== b ||
          shifts[to * 3 + 2] !== c
        ) {
          periodic = true;
        }
        continue;
      }
      component[to] = start;
      shifts[to * 3] = a;
      shifts[to * 3 + 1] = b;
      shifts[to * 3 + 2] = c;
      members.push(to);
    }
  }
  return { atoms: members, periodic };
}

/** Add one molecule, moved whole to the cell its centre falls in. */
function pushMolecule(
  packed: PackedAtom[],
  atoms: readonly PackedAtom[],
  members: readonly number[],
  shifts: Int32Array,
): void {
  const centre = [0, 0, 0];
  for (const index of members) {
    const position = (atoms[index] as PackedAtom).position;
    for (let axis = 0; axis < 3; axis++) {
      centre[axis] =
        (centre[axis] ?? 0) +
        (position[axis] ?? 0) +
        (shifts[index * 3 + axis] ?? 0);
    }
  }
  const move: [number, number, number] = [0, 0, 0];
  for (let axis = 0; axis < 3; axis++) {
    const mean = (centre[axis] ?? 0) / members.length;
    move[axis] = -Math.floor(mean + CENTRE_TOLERANCE);
  }
  for (const index of members) {
    const atom = atoms[index] as PackedAtom;
    const position: [number, number, number] = [0, 0, 0];
    for (let axis = 0; axis < 3; axis++) {
      const shift = shifts[index * 3 + axis] ?? 0;
      position[axis] = (atom.position[axis] ?? 0) + shift + (move[axis] ?? 0);
    }
    packed.push({ element: atom.element, position });
  }
}

function toCartesian(
  lattice: Lattice,
  point: readonly number[],
): [number, number, number] {
  const [x = 0, y = 0, z = 0] = fractionalToCartesian(lattice, point);
  return [x, y, z];
}
