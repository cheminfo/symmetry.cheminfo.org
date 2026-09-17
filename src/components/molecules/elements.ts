/**
 * The symmetry elements of a molecule, as shapes the 3D view can draw.
 *
 * An *operation* is what you do; an *element* is the axis, plane or point you do
 * it about, and several operations share one. So the drawings are grouped by
 * element — one rod for the C₆ of benzene, not two for C₆ and C₆⁵ — and they
 * come back in four layers, because the chip bar switches them one at a time.
 *
 * Each drawing is labelled with the **name** of the operation it belongs to,
 * never with its bare symbol: water has two planes whose symbol is `σv`, and a
 * student hovering one of them has to be told which.
 *
 * Everything here is Cartesian ångström about the centroid, which is the frame
 * the detector works in and the frame the scene is drawn in.
 */

import type { PointOperation } from '../../symmetry/operations.ts';
import type { Vec3 } from '../../symmetry/point/vec3.ts';
import { sameAxis, vectorNorm } from '../../symmetry/point/vec3.ts';
import type { SymmetryDrawing } from '../../viewer/core.ts';
import { ELEMENT_COLOURS } from '../../viewer/core.ts';

/** The elements, split the way the layer chips switch them. */
export interface ElementLayers {
  /** Proper rotation axes, one rod per axis at its highest order. */
  readonly axes: readonly SymmetryDrawing[];
  /** Mirror planes, one disc each. */
  readonly mirrors: readonly SymmetryDrawing[];
  /** The inversion centre, when the group has one. */
  readonly inversion: readonly SymmetryDrawing[];
  /** Improper axes: a broken rod, and the disc it reflects in. */
  readonly improper: readonly SymmetryDrawing[];
}

/** Where the origin is: every operation of a point group fixes the centroid. */
const ORIGIN: Vec3 = [0, 0, 0];

/**
 * The elements a set of operations carries.
 *
 * @param operations - The molecule's operations, in its own frame.
 * @param names - One name per operation, from `operationNames`, which is what
 *   each drawing is labelled with.
 * @param extent - How far the furthest atom sits from the centroid, ångström,
 *   so a rod reaches past the structure instead of ending inside it.
 * @returns The four layers, each in the order the operations were given.
 */
export function moleculeElements(
  operations: readonly PointOperation[],
  names: readonly string[],
  extent: number,
): ElementLayers {
  const reach = Math.max(extent, 1);
  const length = 2 * reach + 2.4;
  const size = 2 * reach + 1.2;
  const axes: SymmetryDrawing[] = [];
  const mirrors: SymmetryDrawing[] = [];
  const inversion: SymmetryDrawing[] = [];
  const improper: SymmetryDrawing[] = [];

  for (const found of highestOrders(operations, 'Cn')) {
    axes.push({
      kind: 'rotation',
      id: `axis:${axisKey(found.axis)}`,
      label: names[found.index] ?? `C${found.order}`,
      point: ORIGIN,
      direction: found.axis,
      length,
      order: found.order,
    });
  }
  for (let index = 0; index < operations.length; index++) {
    const operation = operations[index] as PointOperation;
    if (operation.kind !== 'sigma' || operation.axis === null) continue;
    mirrors.push({
      kind: 'mirror',
      id: `plane:${axisKey(operation.axis)}`,
      label: names[index] ?? operation.label,
      point: ORIGIN,
      normal: operation.axis,
      size,
    });
  }
  for (const operation of operations) {
    if (operation.kind !== 'i') continue;
    inversion.push({
      kind: 'inversion',
      id: 'inversion',
      label: 'i',
      point: ORIGIN,
    });
    break;
  }
  for (const found of highestOrders(operations, 'Sn')) {
    const id = `improper:${axisKey(found.axis)}`;
    improper.push(
      {
        kind: 'rotoinversion',
        id,
        label: names[found.index] ?? `S${found.order}`,
        point: ORIGIN,
        direction: found.axis,
        length,
        order: found.order,
      },
      {
        // The plane the rotation reflects in. It is part of the improper axis
        // and never a mirror of the group on its own — allene's S₄ is real and
        // its σₕ is not — so it takes the improper colour and carries no label.
        kind: 'mirror',
        id: `${id}:plane`,
        label: '',
        colour: ELEMENT_COLOURS.rotoinversion,
        point: ORIGIN,
        normal: found.axis,
        size: size * 0.8,
      },
    );
  }
  return { axes, mirrors, inversion, improper };
}

/**
 * What a linear molecule carries, which no finite operation list holds.
 *
 * `C∞ᵥ` and `D∞ₕ` have infinitely many operations, so the detector returns none
 * and there is nothing to group. The axis, the centre and the horizontal plane
 * are still there, and drawing them is the whole picture a student needs.
 *
 * @param axis - The line the atoms lie on.
 * @param centric - True for `D∞ₕ`: the centre and the σₕ are drawn as well.
 * @param extent - How far the furthest atom sits from the centroid, ångström.
 * @returns The layers, with no improper axis in them.
 */
export function linearElements(
  axis: Vec3,
  centric: boolean,
  extent: number,
): ElementLayers {
  const reach = Math.max(extent, 1);
  const rod: SymmetryDrawing = {
    kind: 'rotation',
    id: 'axis:linear',
    label: 'C∞',
    point: ORIGIN,
    direction: axis,
    length: 2 * reach + 2.4,
    order: Number.POSITIVE_INFINITY,
  };
  if (!centric) {
    return { axes: [rod], mirrors: [], inversion: [], improper: [] };
  }
  return {
    axes: [rod],
    mirrors: [
      {
        kind: 'mirror',
        id: 'plane:linear-h',
        label: 'σh',
        point: ORIGIN,
        normal: axis,
        size: 2 * reach + 1.2,
      },
    ],
    inversion: [
      { kind: 'inversion', id: 'inversion', label: 'i', point: ORIGIN },
    ],
    improper: [],
  };
}

/** How far the furthest atom is from the origin, ångström. */
export function atomicExtent(positions: readonly Vec3[]): number {
  let furthest = 0;
  for (const position of positions) {
    const radius = vectorNorm(position);
    if (radius > furthest) furthest = radius;
  }
  return furthest;
}

/** One axis, the largest n found on it, and the operation that names it. */
interface AxisOrder {
  readonly axis: Vec3;
  readonly order: number;
  /** Index into the operation list of the `n`-fold turn itself, `Cₙ` or `Sₙ`. */
  readonly index: number;
}

/**
 * One entry per axis, carrying the largest n found on it and the operation that
 * turns by exactly 360°/n about it — which is the one the element is named for.
 *
 * Compared with a tolerance rather than on a rounded key: C₃ and C₃² come out
 * of a closure with axes that agree to 1e-9 and round to two different strings,
 * which would draw the same rod twice.
 */
function highestOrders(
  operations: readonly PointOperation[],
  kind: 'Cn' | 'Sn',
): AxisOrder[] {
  const found: AxisOrder[] = [];
  for (let index = 0; index < operations.length; index++) {
    const operation = operations[index] as PointOperation;
    if (operation.kind !== kind || operation.axis === null) continue;
    const axis = operation.axis;
    const known = found.findIndex((entry) => sameAxis(entry.axis, axis));
    if (known === -1) {
      found.push({ axis, order: operation.order, index });
      continue;
    }
    const entry = found[known] as AxisOrder;
    const better =
      operation.order > entry.order ||
      (operation.order === entry.order &&
        operation.power < (operations[entry.index] as PointOperation).power);
    if (better) {
      found[known] = { axis: entry.axis, order: operation.order, index };
    }
  }
  return found;
}

/** A stable id for an axis, so one element can be removed on its own. */
function axisKey(axis: Vec3): string {
  return `${round(axis[0])},${round(axis[1])},${round(axis[2])}`;
}

function round(value: number): string {
  return (value === 0 ? 0 : Math.round(value * 1000) / 1000).toFixed(3);
}
