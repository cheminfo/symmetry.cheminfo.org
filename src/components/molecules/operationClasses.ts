/**
 * The operations of a molecule, grouped the way a character table heads its
 * columns.
 *
 * Two operations are in the same class when one is the other seen from a
 * different direction — formally, when some operation of the group conjugates
 * one into the other. That is why a table has as many rows as it has columns,
 * and it is the reason `C₃` and `C₃²` share a column while the three `C₂` of
 * benzene split into two.
 *
 * The classes are computed from the molecule's own operations, never read off
 * the catalogue: nine of the library's structures do not sit in the standard
 * orientation, and their axes are where the molecule puts them.
 */

import type { PointOperation } from '../../symmetry/operations.ts';
import { operationSituation } from '../../symmetry/point/labels.ts';
import { conjugacyClasses } from '../../symmetry/pointGroups.ts';

/** One operation, with the name a link addresses it by. */
export interface ClassMember {
  /** One of `operationNames`, unique within the molecule. */
  readonly name: string;
  readonly operation: PointOperation;
}

/** One conjugacy class, as a column header and its operations. */
export interface OperationClass {
  /** What a table prints: `E`, `2C3`, `3σv`, `2S4`. */
  readonly header: string;
  readonly size: number;
  readonly members: readonly ClassMember[];
}

/**
 * How far two matrices may be and still be conjugate.
 *
 * Not machine zero: an operation found at a distance tolerance is off by a few
 * parts in 10⁵, and its conjugates by more.
 */
const CONJUGACY_TOLERANCE = 1e-6;

/** Primes, so two classes that print the same header are told apart. */
const PRIMES = ['', '′', '″', '‴'];

/**
 * Group the operations into classes, in the order a table prints them.
 *
 * The headers are derived from these coordinates, not read off the catalogue,
 * so they can differ from the column a textbook heads: a molecule off the
 * standard orientation puts its planes where its own atoms are, and this site
 * would rather name the plane it drew than the plane a book assumed.
 *
 * @param operations - The molecule's operations, in its own frame.
 * @param names - One name per operation, from `operationNames`.
 * @returns The classes: the identity, the proper rotations by falling order,
 *   the inversion, the improper rotations, then the planes.
 */
export function operationClasses(
  operations: readonly PointOperation[],
  names: readonly string[],
): readonly OperationClass[] {
  const grouped = conjugacyClasses(operations, CONJUGACY_TOLERANCE);
  const classes: OperationClass[] = [];
  for (const group of grouped) {
    const sorted = group.toSorted(compareOperations);
    const representative = sorted[0] as PointOperation;
    const size = sorted.length;
    const members = sorted.map((operation) => ({
      name: names[operations.indexOf(operation)] ?? operation.label,
      operation,
    }));
    classes.push({
      // A class of one is headed by its operation's own name, so the lone
      // mirror of C₂ᵥ reads `σv(xz)` — which plane it is — rather than `σv`
      // and a prime that says only that there is another one somewhere.
      header:
        size === 1
          ? (members[0] as ClassMember).name
          : `${size}${representative.label}`,
      size,
      members,
    });
  }
  return primeDuplicates(
    classes.toSorted((a, b) =>
      compareOperations(
        (a.members[0] as ClassMember).operation,
        (b.members[0] as ClassMember).operation,
      ),
    ),
  );
}

/**
 * Where an operation sits in the printed order: the identity, then the proper
 * rotations from the highest order down, then the inversion, the improper
 * rotations and the planes.
 */
function compareOperations(a: PointOperation, b: PointOperation): number {
  const kinds = kindRank(a) - kindRank(b);
  if (kinds !== 0) return kinds;
  if (a.order !== b.order) return b.order - a.order;
  if (a.power !== b.power) return a.power - b.power;
  const planes = planeRank(a.label) - planeRank(b.label);
  if (planes !== 0) return planes;
  // `σv(xz)` before `σv(yz)`, which is the order every table heads them in.
  return compareText(operationSituation(a), operationSituation(b));
}

/** Plain code-point order: two situations are ASCII but for the `⊥`. */
function compareText(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function kindRank(operation: PointOperation): number {
  switch (operation.kind) {
    case 'E': {
      return 0;
    }
    case 'Cn': {
      return 1;
    }
    case 'i': {
      return 2;
    }
    case 'Sn': {
      return 3;
    }
    case 'sigma': {
      return 4;
    }
    // no default
  }
}

/** σₕ before σᵥ before σ_d, which is the order every table prints them in. */
function planeRank(label: string): number {
  if (label === 'σh') return 0;
  if (label === 'σv') return 1;
  if (label === 'σd') return 2;
  return 3;
}

/**
 * Two classes of the same kind and order print the same header — benzene has
 * two of three `C₂` each — so the second takes a prime, which is what a
 * textbook does for exactly this reason.
 */
function primeDuplicates(
  classes: readonly OperationClass[],
): readonly OperationClass[] {
  const seen = new Map<string, number>();
  const out: OperationClass[] = [];
  for (const entry of classes) {
    const count = seen.get(entry.header) ?? 0;
    seen.set(entry.header, count + 1);
    const prime = PRIMES[count] ?? `(${count + 1})`;
    out.push(
      count === 0 ? entry : { ...entry, header: `${entry.header}${prime}` },
    );
  }
  return out;
}
