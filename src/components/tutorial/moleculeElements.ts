/**
 * The elements a molecule's operations *are*, ready to draw.
 *
 * An element is not an operation: one C₃ axis carries C₃ and C₃², and a group
 * of order 24 would otherwise put 24 rods through the same structure. So the
 * operations are folded onto their axis or their normal, the highest order on
 * each wins, and what comes out is one drawing per thing a student can point
 * at.
 */

import type { PointOperation } from '../../symmetry/operations.ts';
import { canonicalSense } from '../../symmetry/operations.ts';
import type { Vec3 } from '../../symmetry/point/vec3.ts';
import type { Point3, SymmetryDrawing } from '../../viewer/core.ts';

/** Which kinds of element to draw, and how big. */
export interface MoleculeElementOptions {
  /** Proper rotation axes. @default true */
  readonly axes?: boolean;
  /** Mirror planes. @default true */
  readonly mirrors?: boolean;
  /** The inversion centre. @default true */
  readonly inversion?: boolean;
  /** Improper axes Sₙ. @default false */
  readonly improper?: boolean;
  /**
   * How far the structure reaches from its centre, ångström. A rod is drawn
   * across it and a plane a little wider, so neither stops inside the molecule.
   */
  readonly radius: number;
}

/**
 * One drawing per symmetry element of a molecule.
 *
 * @param operations - What the detector found, in the molecule's own frame and
 *   about its centroid, which is where `centreAtoms` puts the structure.
 * @param options - See {@link MoleculeElementOptions}.
 * @returns The drawings, axes first, in a stable order.
 */
export function moleculeElements(
  operations: readonly PointOperation[],
  options: MoleculeElementOptions,
): SymmetryDrawing[] {
  const {
    axes = true,
    mirrors = true,
    inversion = true,
    improper = false,
    radius,
  } = options;
  const rotations = new Map<string, AxisElement>();
  const improperAxes = new Map<string, AxisElement>();
  const planes = new Map<string, Vec3>();
  let centre = false;

  for (const operation of operations) {
    if (operation.kind === 'Cn' && operation.axis !== null) {
      keepHighest(rotations, operation.axis, operation.order);
    } else if (operation.kind === 'Sn' && operation.axis !== null) {
      keepHighest(improperAxes, operation.axis, operation.order);
    } else if (operation.kind === 'sigma' && operation.axis !== null) {
      const sense = canonicalSense(operation.axis);
      planes.set(axisKey(sense), sense);
    } else if (operation.kind === 'i') {
      centre = true;
    }
  }

  const drawings: SymmetryDrawing[] = [];
  if (axes) {
    for (const [key, element] of rotations) {
      drawings.push({
        kind: 'rotation',
        id: `c-${key}`,
        label: `C${element.order}`,
        point: ORIGIN,
        direction: element.axis,
        length: 2.4 * radius,
        order: element.order,
      });
    }
  }
  if (improper) {
    for (const [key, element] of improperAxes) {
      drawings.push({
        kind: 'rotoinversion',
        id: `s-${key}`,
        label: `S${element.order}`,
        point: ORIGIN,
        direction: element.axis,
        length: 2.6 * radius,
        order: element.order,
      });
    }
  }
  if (mirrors) {
    for (const [key, normal] of planes) {
      drawings.push({
        kind: 'mirror',
        id: `m-${key}`,
        label: 'σ',
        point: ORIGIN,
        normal,
        size: 2.2 * radius,
      });
    }
  }
  if (inversion && centre) {
    drawings.push({ kind: 'inversion', id: 'i', label: 'i', point: ORIGIN });
  }
  return drawings;
}

/** How far the furthest atom sits from the centre, with a floor for a diatomic. */
export function structureRadius(positions: readonly Point3[]): number {
  let largest = 0;
  for (const position of positions) {
    const distance = Math.hypot(position[0], position[1], position[2]);
    if (distance > largest) largest = distance;
  }
  return Math.max(largest, 1);
}

interface AxisElement {
  readonly axis: Vec3;
  readonly order: number;
}

/** An axis and its opposite are one element, and the highest order names it. */
function keepHighest(
  into: Map<string, AxisElement>,
  axis: Vec3,
  order: number,
): void {
  const sense = canonicalSense(axis);
  const key = axisKey(sense);
  const held = into.get(key);
  if (held === undefined || order > held.order) {
    into.set(key, { axis: sense, order });
  }
}

/** Rounded hard enough that two searches of the same axis agree on the key. */
function axisKey(axis: Vec3): string {
  const parts: string[] = [];
  for (let index = 0; index < 3; index++) {
    parts.push(String(Math.round((axis[index] ?? 0) * 1e4) / 1e4 + 0));
  }
  return parts.join(',');
}

const ORIGIN: Point3 = [0, 0, 0];
