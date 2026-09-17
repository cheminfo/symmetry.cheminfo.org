import type { CrystalOperation, SymmetryElement } from './core/index.ts';
import {
  TWELFTHS_PER_CELL,
  elementPoint,
  symmetryElements,
} from './core/index.ts';

/** How far two coordinates may sit apart and still be the same element. */
const TOLERANCE = 1e-9;

/** A rotation centre, named by the highest order that fixes it. */
export interface PlaneRotationPoint {
  /** 2, 3, 4 or 6. A 6-fold point is also a 3-fold and a 2-fold; the diagram draws the hexagon. */
  readonly order: number;
  /** Fractional coordinates of the centre. */
  readonly point: readonly [number, number];
}

/** A mirror line or a glide line, as the equation `h·x + k·y = offset`. */
export interface PlaneLine {
  readonly kind: 'mirror' | 'glide';
  /** `m` or `g`: in two dimensions there is only one kind of glide line. */
  readonly symbol: string;
  /** `(hk)`, primitive integers — the reciprocal-space normal of the line. */
  readonly normal: readonly [number, number];
  /** Where the line crosses: `h·x + k·y = offset`. */
  readonly offset: number;
  /** The glide vector in cell units, lying in the line; `[0, 0]` for a mirror. */
  readonly glide: readonly [number, number];
}

/** Everything the International Tables draws on a plane-group diagram. */
export interface PlaneElementTable {
  /** One entry per distinct centre, ordered by x then y. */
  readonly rotations: readonly PlaneRotationPoint[];
  /** Ordered by normal, then by offset. */
  readonly lines: readonly PlaneLine[];
  /** The centring translations, in cell units; empty on a primitive lattice. */
  readonly centring: ReadonlyArray<readonly [number, number]>;
}

/**
 * The symmetry-element diagram of a plane group, derived from its operations.
 *
 * Nothing here is transcribed: where a rotation centre, a mirror or a glide sits
 * comes out of the Wondratschek split in `symmetryElement`, the same code that
 * places a screw axis in three dimensions. Seventeen hand-typed tables would be
 * seventeen chances to be wrong, and nobody checks the hexagonal ones.
 *
 * @param operations - The coset list, from `wallpaperOperations` or `friezeOperations`.
 * @param shifts - Lattice translations to decompose as well, so the lines
 *   continue past the cell edge instead of stopping at it. @default [[0, 0]]
 */
export function planeElementTable(
  operations: ReadonlyArray<CrystalOperation<2>>,
  shifts?: ReadonlyArray<readonly number[]>,
): PlaneElementTable {
  const elements = symmetryElements(operations, shifts);
  const rotations = new Map<string, PlaneRotationPoint>();
  const lines = new Map<string, PlaneLine>();
  const centring: Array<readonly [number, number]> = [];
  for (const element of elements) {
    if (element.kind === 'rotation') {
      addRotation(rotations, element);
    } else if (element.kind === 'mirror' || element.kind === 'glide') {
      const line = toLine(element);
      lines.set(`${line.normal.join(',')}|${round(line.offset)}`, line);
    } else if (element.kind === 'translation') {
      centring.push(vectorOf(element.intrinsic));
    }
  }
  return {
    rotations: [...rotations.values()].toSorted(compareRotations),
    lines: [...lines.values()].toSorted(compareLines),
    centring,
  };
}

/**
 * The rotation centres inside the conventional cell. A table built over several
 * cells carries centres outside it, which a diagram wants and a catalogue does not.
 */
export function rotationsInCell(
  table: PlaneElementTable,
): readonly PlaneRotationPoint[] {
  return table.rotations.filter(
    (rotation) => inUnit(rotation.point[0]) && inUnit(rotation.point[1]),
  );
}

/**
 * The lines that cross the conventional cell in a segment rather than touching
 * one of its corners. A diagram over several cells carries both.
 */
export function linesInCell(table: PlaneElementTable): readonly PlaneLine[] {
  const inside: PlaneLine[] = [];
  for (const line of table.lines) {
    let below = 0;
    let above = 0;
    let on = 0;
    for (let corner = 0; corner < 4; corner++) {
      const value =
        (line.normal[0] ?? 0) * (corner % 2) +
        (line.normal[1] ?? 0) * Math.floor(corner / 2);
      if (value < line.offset - TOLERANCE) below += 1;
      else if (value > line.offset + TOLERANCE) above += 1;
      else on += 1;
    }
    if (on >= 2 || (below >= 1 && above >= 1)) inside.push(line);
  }
  return inside;
}

/** Whether a point lies on a line, within a fractional tolerance. */
export function isOnLine(
  point: readonly [number, number],
  line: PlaneLine,
  tolerance = 1e-6,
): boolean {
  const value =
    (line.normal[0] ?? 0) * point[0] + (line.normal[1] ?? 0) * point[1];
  return Math.abs(value - line.offset) <= tolerance;
}

/**
 * The rotation centres that lie on no line of the table.
 *
 * This is the whole of the p3m1 / p31m distinction and half of p4m / p4g: in
 * p3m1 every 3-fold sits on a mirror, in p31m two of the three do not.
 */
export function rotationsOffEveryLine(
  table: PlaneElementTable,
): readonly PlaneRotationPoint[] {
  const free: PlaneRotationPoint[] = [];
  for (const rotation of table.rotations) {
    let onOne = false;
    for (const line of table.lines) {
      if (line.kind === 'mirror' && isOnLine(rotation.point, line)) {
        onOne = true;
      }
    }
    if (!onOne) free.push(rotation);
  }
  return free;
}

/** `4 at (0, 0)` / `m: x + y = 1/2` / `g: y = 1/4, glide (1/2, 0)` — one readable row. */
export function formatPlaneElement(
  element: PlaneRotationPoint | PlaneLine,
): string {
  if ('order' in element) {
    return `${element.order} at (${format(element.point[0])}, ${format(element.point[1])})`;
  }
  const glide =
    element.kind === 'glide'
      ? `, glide (${format(element.glide[0])}, ${format(element.glide[1])})`
      : '';
  return `${element.symbol}: ${formatSide(element.normal)} = ${format(element.offset)}${glide}`;
}

function inUnit(value: number): boolean {
  return value >= -TOLERANCE && value <= 1 + TOLERANCE;
}

function addRotation(
  rotations: Map<string, PlaneRotationPoint>,
  element: SymmetryElement,
): void {
  const point = pointOf(element);
  const key = `${round(point[0])},${round(point[1])}`;
  const current = rotations.get(key);
  if (current === undefined || current.order < element.order) {
    rotations.set(key, { order: element.order, point });
  }
}

function toLine(element: SymmetryElement): PlaneLine {
  const point = pointOf(element);
  const normal: readonly [number, number] = [
    element.normal?.[0] ?? 0,
    element.normal?.[1] ?? 0,
  ];
  return {
    kind: element.kind === 'mirror' ? 'mirror' : 'glide',
    symbol: element.symbol,
    normal,
    offset: normal[0] * point[0] + normal[1] * point[1],
    glide: vectorOf(element.intrinsic),
  };
}

function pointOf(element: SymmetryElement): readonly [number, number] {
  const point = elementPoint(element);
  return [point[0] ?? 0, point[1] ?? 0];
}

function vectorOf(twelfths: readonly number[]): readonly [number, number] {
  return [
    (twelfths[0] ?? 0) / TWELFTHS_PER_CELL,
    (twelfths[1] ?? 0) / TWELFTHS_PER_CELL,
  ];
}

function compareRotations(
  a: PlaneRotationPoint,
  b: PlaneRotationPoint,
): number {
  return a.point[0] - b.point[0] || a.point[1] - b.point[1];
}

function compareLines(a: PlaneLine, b: PlaneLine): number {
  return (
    (a.normal[0] ?? 0) - (b.normal[0] ?? 0) ||
    (a.normal[1] ?? 0) - (b.normal[1] ?? 0) ||
    a.offset - b.offset
  );
}

/** `x`, `y`, `x + y`, `x - 2y` — the left-hand side of the line's equation. */
function formatSide(normal: readonly [number, number]): string {
  const terms: string[] = [];
  const names = ['x', 'y'];
  for (let index = 0; index < 2; index++) {
    const coefficient = normal[index] ?? 0;
    if (coefficient === 0) continue;
    const size = Math.abs(coefficient);
    const magnitude = size === 1 ? '' : String(size);
    let sign = '';
    if (coefficient < 0) sign = '-';
    else if (terms.length > 0) sign = '+';
    terms.push(`${sign}${magnitude}${names[index] ?? ''}`);
  }
  return terms.join(' ').replace(' -', ' - ').replace(' +', ' + ');
}

/** A fraction with a denominator of 12 or less, or a rounded decimal. */
function format(value: number): string {
  for (let denominator = 1; denominator <= 12; denominator++) {
    const numerator = value * denominator;
    if (Math.abs(numerator - Math.round(numerator)) > TOLERANCE) continue;
    const whole = Math.round(numerator);
    return denominator === 1 ? String(whole) : `${whole}/${denominator}`;
  }
  return value.toFixed(4);
}

function round(value: number): number {
  return Math.round(value / TOLERANCE) * TOLERANCE;
}
