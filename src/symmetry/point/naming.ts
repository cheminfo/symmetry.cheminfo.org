/**
 * Naming an operation by the class it belongs to.
 *
 * A label is not a name: D₆ₕ writes `C2` on seven of its operations and `σv` on
 * six. What tells them apart is never their position in a list — `C2(5)` says
 * nothing about the axis it turns about — but the class they sit in, which is
 * the same thing the character table's columns are made of.
 */

import { operationClassIndices } from './classes.ts';
import { axisLetter, directionIndices } from './direction.ts';
import type { PointOperation } from './operation.ts';

/** What a class of two or three is told apart by, the first of them bare. */
const PRIMES = ['', '′', '″', '‴'];

/** The largest class a prime is used inside; beyond it, members are numbered. */
const PRIMED_CLASS = 3;

/**
 * Every operation of a set, named the way a chemist writes it on a page, and
 * all distinct.
 *
 * A label the group carries once is the name. A label it repeats is named from
 * the operation's **conjugacy class**, in this order:
 *
 * 1. by a **Cartesian axis letter** when the class puts every member on one —
 *    `C2(z)`, `σv(xz)`, `S4(y)`;
 * 2. by **direction indices** when the axes are rational — `C3(111)`,
 *    `σ(11̄0)`, which is how a cubic group's axes have always been written;
 * 3. by a **prime within the class** when two or three of them share an axis
 *    kind no index reaches — `σv`, `σv′`, `σv″`;
 * 4. by a **number within the class**, never within the group, when there are
 *    more than three — `σd(1)` … `σd(6)`.
 *
 * Where several classes carry one label and none of them is named by a place,
 * the **class** takes the prime and its members the number, which is exactly
 * how a textbook writes D₆ₕ: `C2(z)`, then `C2′(1)…C2′(3)` through the atoms
 * and `C2″(1)…C2″(3)` through the bonds.
 *
 * Never by a Cartesian vector: `σd(⊥[0.259 0.966 0])` is exact, teaches
 * nothing, and is not what the reader has to type back.
 *
 * A prime is written as a power — `σv^′` — because that is where
 * `operationLabelParts` puts what is set above the symbol, which is where a
 * prime goes.
 * @param operations - The operations, in the order they are printed.
 * @returns One name per operation, all distinct.
 */
export function operationDisplayNames(
  operations: readonly PointOperation[],
): readonly string[] {
  // An empty place is one no letter and no index reaches, which is what sends
  // a class to a prime or to a number.
  const places: string[] = [];
  for (const operation of operations) {
    places.push(operationPlace(operation) ?? '');
  }
  const classes = operationClassIndices(operations);
  const names = new Array<string>(operations.length).fill('');
  for (const [label, buckets] of bucketsByLabel(operations, classes)) {
    nameOneLabel(label, buckets, places, names);
  }
  return names;
}

/**
 * Where an operation acts, written the way a chemist writes it.
 *
 * @param operation - Any operation.
 * @returns `xz` or `y` for a coordinate plane or axis, `110` or `11̄0` for any
 *   other rational direction, and `null` for an operation with no axis or one
 *   whose direction has no whole indices.
 */
export function operationPlace(operation: PointOperation): string | null {
  const axis = operation.axis;
  if (axis === null) return null;
  const letter = axisLetter(axis);
  if (!letter.startsWith('[')) {
    if (operation.kind !== 'sigma') return letter;
    if (letter === 'x') return 'yz';
    return letter === 'y' ? 'xz' : 'xy';
  }
  return directionIndices(axis);
}

/**
 * The operations carrying one label, gathered per class, each class in the
 * order its first member appears.
 */
function bucketsByLabel(
  operations: readonly PointOperation[],
  classes: readonly number[],
): ReadonlyMap<string, readonly number[][]> {
  const perLabel = new Map<string, Map<number, number[]>>();
  for (let index = 0; index < operations.length; index++) {
    const label = (operations[index] as PointOperation).label;
    let perClass = perLabel.get(label);
    if (perClass === undefined) {
      perClass = new Map<number, number[]>();
      perLabel.set(label, perClass);
    }
    const key = classes[index] as number;
    const bucket = perClass.get(key);
    if (bucket === undefined) perClass.set(key, [index]);
    else bucket.push(index);
  }
  const buckets = new Map<string, readonly number[][]>();
  for (const [label, perClass] of perLabel) {
    buckets.set(label, [...perClass.values()]);
  }
  return buckets;
}

/** Write the names of every operation carrying one label. */
function nameOneLabel(
  label: string,
  buckets: readonly number[][],
  places: readonly string[],
  names: string[],
): void {
  const only = soleMember(buckets);
  if (only !== -1) {
    names[only] = label;
    return;
  }
  const distinct = distinctPlaces(buckets, places);
  const ambiguous: number[][] = [];
  for (const bucket of buckets) {
    if (isPlaced(bucket, places, distinct)) {
      for (const index of bucket) {
        names[index] = `${label}(${places[index] as string})`;
      }
    } else {
      ambiguous.push(bucket);
    }
  }
  // With one class left to name, the prime is free to tell its members apart;
  // with several, it is spent on the classes themselves and the members are
  // numbered inside each.
  const alone = ambiguous.length === 1;
  const placed = buckets.length - ambiguous.length;
  for (let rank = 0; rank < ambiguous.length; rank++) {
    const bucket = ambiguous[rank] as number[];
    const prime = alone ? '' : primeAt(placed + rank);
    nameOneClass(label, prime, alone, bucket, names);
  }
}

/**
 * Name the members of one class that no place tells apart.
 *
 * With the bare label still free, two or three of them take a prime each, which
 * is what a textbook does; any more, or a class carrying a prime of its own,
 * and the members are numbered inside the class.
 */
function nameOneClass(
  label: string,
  classPrime: string,
  alone: boolean,
  bucket: readonly number[],
  names: string[],
): void {
  const tag = withPrime(label, classPrime);
  // A prime cannot sit over a power, and a class that carries one has spent the
  // single place a prime goes, so both are numbered instead.
  const primed = alone && bucket.length <= PRIMED_CLASS && !label.includes('^');
  for (let member = 0; member < bucket.length; member++) {
    const index = bucket[member] as number;
    names[index] = primed
      ? withPrime(label, primeAt(member))
      : `${tag}(${member + 1})`;
  }
}

/** The one operation carrying this label, or −1 when the group repeats it. */
function soleMember(buckets: readonly number[][]): number {
  const first = buckets[0];
  if (buckets.length !== 1 || first?.length !== 1) return -1;
  return first[0] as number;
}

/** The places this label uses exactly once, so no two of them can collide. */
function distinctPlaces(
  buckets: readonly number[][],
  places: readonly string[],
): ReadonlySet<string> {
  const counts = new Map<string, number>();
  for (const bucket of buckets) {
    for (const index of bucket) {
      const place = places[index] as string;
      if (place !== '') counts.set(place, (counts.get(place) ?? 0) + 1);
    }
  }
  const once = new Set<string>();
  for (const [place, count] of counts) if (count === 1) once.add(place);
  return once;
}

/** Whether every member of a class has a place of its own to be named by. */
function isPlaced(
  bucket: readonly number[],
  places: readonly string[],
  distinct: ReadonlySet<string>,
): boolean {
  for (const index of bucket) {
    if (!distinct.has(places[index] as string)) return false;
  }
  return true;
}

/** The nth prime, falling back to a number where a group runs past three. */
function primeAt(rank: number): string {
  return PRIMES[rank] ?? String(rank + 1);
}

/** The label with a prime set above it, beside a power when it carries one. */
function withPrime(label: string, prime: string): string {
  if (prime === '') return label;
  return label.includes('^') ? `${label}${prime}` : `${label}^${prime}`;
}
