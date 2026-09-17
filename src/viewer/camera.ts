/**
 * Framing the scene.
 *
 * What is on screen is measured here rather than read off molstar, for the
 * reason `framing.ts` gives: a representation's own bounding sphere is padded by
 * the largest ball it could ever draw. Each part of the scene registers its
 * extent as it is drawn, and the camera frames the union.
 */

import { Sphere3D } from 'molstar/lib/mol-math/geometry.js';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra.js';
import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';

import type { SceneSphere } from './framing.ts';
import { framedRadius, unionSpheres } from './framing.ts';
import type { Point3 } from './types.ts';

/** Transition length used when the caller does not pick one, milliseconds. */
export const DEFAULT_CAMERA_DURATION = 250;

/**
 * Record how far one part of the scene reaches.
 *
 * @param plugin - The molstar context.
 * @param key - Which part: the atoms, the cell, the elements.
 * @param sphere - Its extent, or `null` once it is no longer drawn.
 */
export function setSceneExtent(
  plugin: PluginContext,
  key: string,
  sphere: SceneSphere | null,
): void {
  let parts = extents.get(plugin);
  if (parts === undefined) {
    parts = new Map<string, SceneSphere>();
    extents.set(plugin, parts);
  }
  if (sphere === null) parts.delete(key);
  else parts.set(key, sphere);
}

/**
 * Everything registered, as one ball.
 *
 * @param plugin - The molstar context.
 * @returns The scene's extent; a point at the origin when nothing is drawn.
 */
export function sceneExtent(plugin: PluginContext): SceneSphere {
  return unionSpheres([...(extents.get(plugin)?.values() ?? [])]);
}

/**
 * Frame everything on screen.
 *
 * @param plugin - The molstar context.
 * @param durationMs - Transition length; 0 jumps.
 */
export function resetCamera(
  plugin: PluginContext,
  durationMs = DEFAULT_CAMERA_DURATION,
): void {
  const scene = sceneExtent(plugin);
  if (scene.radius <= 0) {
    plugin.managers.camera.reset(undefined, durationMs);
    return;
  }
  focusPoint(plugin, scene.centre, framedRadius(scene.radius), durationMs);
}

/**
 * Zoom onto one point of the scene.
 *
 * @param plugin - The molstar context.
 * @param centre - What to frame, Cartesian ångström.
 * @param radius - Radius of the ball to fit, ångström.
 * @param durationMs - Transition length; 0 jumps.
 */
export function focusPoint(
  plugin: PluginContext,
  centre: Point3,
  radius: number,
  durationMs = DEFAULT_CAMERA_DURATION,
): void {
  // add() only queues, and a queued object belongs to no bounding sphere yet,
  // so framing right after drawing would frame the scene without it.
  plugin.canvas3d?.commit(true);
  plugin.managers.camera.focusSphere(
    Sphere3D.create(Vec3.create(centre[0], centre[1], centre[2]), radius),
    // `extraRadius` defaults to 4 A, which is the very padding this module
    // measures the scene itself to avoid: it left water filling a twentieth of
    // the canvas and benzene a quarter of it. The margin is already in
    // `framedRadius`, so nothing is added here.
    { extraRadius: 0, minRadius: 0.5, durationMs },
  );
}

/**
 * Turn the automatic spin on or off.
 *
 * A spinning scene is a camera move, not a symmetry operation: it is for
 * reading a 3D arrangement off a flat screen, never for showing that a molecule
 * maps onto itself.
 *
 * @param plugin - The molstar context.
 * @param spinning - Whether the scene should keep turning.
 * @param speed - molstar's own spin unit.
 */
export function setSpin(
  plugin: PluginContext,
  spinning: boolean,
  speed = 1,
): void {
  plugin.canvas3d?.setProps({
    trackball: {
      animate: spinning
        ? { name: 'spin', params: { speed, axis: Vec3.create(0, 1, 0) } }
        : { name: 'off', params: {} },
    },
  });
}

/** What each part of the scene reaches, per plugin. */
const extents = new WeakMap<PluginContext, Map<string, SceneSphere>>();
