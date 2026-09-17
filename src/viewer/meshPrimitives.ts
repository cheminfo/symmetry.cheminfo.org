/**
 * The one place a shape worked out in `primitives.ts` becomes molstar geometry.
 */

import {
  addFixedCountDashedCylinder,
  addSimpleCylinder,
} from 'molstar/lib/mol-geo/geometry/mesh/builder/cylinder.js';
import { addPlane } from 'molstar/lib/mol-geo/geometry/mesh/builder/plane.js';
import { addSphere } from 'molstar/lib/mol-geo/geometry/mesh/builder/sphere.js';
import type { MeshBuilder } from 'molstar/lib/mol-geo/geometry/mesh/mesh-builder.js';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra.js';

import type { MeshPrimitive } from './primitives.ts';
import type { Point3 } from './types.ts';

/**
 * Add one shape to a mesh under construction.
 *
 * @param state - The builder; its `currentGroup` decides which item the
 *   triangles belong to, and so what colour and label they take.
 * @param primitive - The shape.
 */
export function addMeshPrimitive(
  state: MeshBuilder.State,
  primitive: MeshPrimitive,
): void {
  switch (primitive.shape) {
    case 'rod': {
      addSimpleCylinder(state, vec(primitive.start), vec(primitive.end), {
        radiusTop: primitive.radius,
        radiusBottom: primitive.radius,
        radialSegments: ROD_SEGMENTS,
      });
      return;
    }
    case 'dashes': {
      addFixedCountDashedCylinder(
        state,
        vec(primitive.start),
        vec(primitive.end),
        1,
        primitive.segments,
        true,
        {
          radiusTop: primitive.radius,
          radiusBottom: primitive.radius,
          radialSegments: ROD_SEGMENTS,
        },
      );
      return;
    }
    case 'cone': {
      addSimpleCylinder(state, vec(primitive.base), vec(primitive.tip), {
        radiusTop: 0,
        radiusBottom: primitive.radius,
        radialSegments: CONE_SEGMENTS,
        bottomCap: true,
      });
      return;
    }
    case 'sphere': {
      addSphere(state, vec(primitive.centre), primitive.radius, SPHERE_DETAIL);
      return;
    }
    case 'plate': {
      // The unit plane is ±0.5, so the scale is the side of the square; the
      // third component is the (zero-thickness) normal direction.
      addPlane(
        state,
        vec(primitive.centre),
        vec(primitive.major),
        vec(primitive.minor),
        Vec3.create(primitive.size, primitive.size, 1),
        1,
        1,
      );
    }
    // no default
  }
}

function vec(point: Point3): Vec3 {
  return Vec3.create(point[0], point[1], point[2]);
}

const ROD_SEGMENTS = 12;
const CONE_SEGMENTS = 16;
const SPHERE_DETAIL = 2;
