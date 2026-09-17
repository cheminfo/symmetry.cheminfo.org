/**
 * One operation, as something the 3D view can play and as a sentence.
 *
 * Playing it is the point: a student who has been told that `S₄` is a rotation
 * followed by a reflection has heard a definition, and a student who watches
 * allene pass through its own plane and land on itself has seen one.
 */

import type { PointOperation } from '../../symmetry/operations.ts';
import { axisLetter } from '../../symmetry/point/labels.ts';
import type { Vec3 } from '../../symmetry/point/vec3.ts';
import type { ViewerOperation } from '../../viewer/core.ts';

/** Every operation of a point group fixes the centroid, which is the origin. */
const ORIGIN: Vec3 = [0, 0, 0];

/**
 * What the viewer applies for this operation.
 *
 * @param operation - One of the molecule's operations.
 * @returns The playback, or `null` for the identity, which moves nothing.
 */
export function viewerOperationOf(
  operation: PointOperation,
): ViewerOperation | null {
  switch (operation.kind) {
    case 'E': {
      return null;
    }
    case 'i': {
      return { kind: 'inversion', centre: ORIGIN };
    }
    case 'sigma': {
      return {
        kind: 'mirror',
        normal: operation.axis ?? [0, 0, 1],
        point: ORIGIN,
      };
    }
    case 'Cn': {
      return {
        kind: 'rotation',
        axis: operation.axis ?? [0, 0, 1],
        origin: ORIGIN,
        order: operation.order,
        power: operation.power,
      };
    }
    case 'Sn': {
      return {
        kind: 'improperRotation',
        axis: operation.axis ?? [0, 0, 1],
        origin: ORIGIN,
        order: operation.order,
        power: operation.power,
      };
    }
    // no default
  }
}

/**
 * What the operation does, in one sentence a student can check on screen.
 *
 * @param operation - One of the molecule's operations.
 * @returns The sentence, ending in a full stop.
 */
export function operationDescription(operation: PointOperation): string {
  const axis = operation.axis;
  switch (operation.kind) {
    case 'E': {
      return 'Leaves every atom where it is.';
    }
    case 'i': {
      return 'Sends every atom straight through the centre to the far side.';
    }
    case 'sigma': {
      return `Reflects in the plane perpendicular to ${axis === null ? 'the axis' : axisLetter(axis)}.`;
    }
    case 'Cn': {
      return `Turns by ${turn(operation)} about ${axis === null ? 'the axis' : axisLetter(axis)}.`;
    }
    case 'Sn': {
      return `Turns by ${turn(operation)} about ${axis === null ? 'the axis' : axisLetter(axis)}, then reflects in the plane perpendicular to it.`;
    }
    // no default
  }
}

/** The angle one application turns through, in whole or one-decimal degrees. */
function turn(operation: PointOperation): string {
  const degrees = (360 * operation.power) / operation.order;
  const rounded = Math.round(degrees * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}°`;
}
