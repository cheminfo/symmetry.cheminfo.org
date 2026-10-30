/**
 * Framing the scene.
 *
 * What is on screen is measured here rather than read off molstar, for the
 * reason `framing.ts` gives: a representation's own bounding sphere is padded by
 * the largest ball it could ever draw. Each part of the scene registers its
 * extent as it is drawn, and the camera frames the union — the framing itself,
 * and the union, are `react-cheminfo`'s.
 */

import { Sphere3D } from 'molstar/lib/mol-math/geometry.js';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra.js';
import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';
import {
  DEFAULT_CAMERA_DURATION,
  resetCamera as frameScene,
} from 'react-cheminfo/molstar/core';

import type { SceneSphere } from './framing.ts';
import type { ViewOrientation } from './orientation.ts';

/**
 * The scene is measured as the ball through its furthest corners, and a camera
 * fitting that ball to the window leaves a cell filling barely half of it: a
 * cube touches its own circumscribed sphere only at eight corners, and uses
 * about 82% of its diameter even seen square-on. So the ball handed to the
 * camera is **smaller** than the one measured, by about the slack that costs.
 * Nothing is cut at the orientations a cell is read at, and the reader can
 * always pull back.
 */
const SCENE_MARGIN = -0.12;

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
    parts = new Map<string, Sphere3D>();
    extents.set(plugin, parts);
  }
  if (sphere === null) {
    parts.delete(key);
    return;
  }
  const [x, y, z] = sphere.centre;
  parts.set(key, Sphere3D.create(Vec3.create(x, y, z), sphere.radius));
}

/**
 * Frame everything on screen.
 *
 * @param plugin - The molstar context.
 * @param durationMs - Transition length; 0 jumps.
 * @param orientation - Where to look from, from `sceneOrientation`. Left out,
 *   the camera keeps the direction it is already pointing, which is what a
 *   reframe after a reader has turned the scene should do.
 */
export function resetCamera(
  plugin: PluginContext,
  durationMs = DEFAULT_CAMERA_DURATION,
  orientation?: ViewOrientation,
): void {
  frameScene(plugin, {
    spheres: [...(extents.get(plugin)?.values() ?? [])],
    margin: SCENE_MARGIN,
    durationMs,
    orientation,
  });
}

/** What each part of the scene reaches, per plugin. */
const extents = new WeakMap<PluginContext, Map<string, Sphere3D>>();

export { DEFAULT_CAMERA_DURATION } from 'react-cheminfo/molstar/core';
