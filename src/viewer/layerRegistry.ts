/**
 * Which drawn layers a canvas is carrying.
 *
 * A layer lives outside the state tree, keyed by name on the plugin, the way
 * `lcao`'s lobes and nodal surfaces do: it is rebuilt whole on every toggle, and
 * the state tree has nothing to add to that. Keeping the register here lets the
 * mesh layers and the text layers share one place to be removed from.
 */

import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';
import type { Representation } from 'molstar/lib/mol-repr/representation.js';

/**
 * Remember a layer, so a later call can take it off again.
 *
 * @param plugin - The molstar context.
 * @param key - Which layer.
 * @param representation - What was added to the canvas.
 */
export function storeLayer(
  plugin: PluginContext,
  key: string,
  representation: Representation.Any,
): void {
  let layers = registry.get(plugin);
  if (layers === undefined) {
    layers = new Map<string, Representation.Any>();
    registry.set(plugin, layers);
  }
  layers.set(key, representation);
}

/**
 * Remove one layer, leaving every other in place.
 *
 * @param plugin - The molstar context.
 * @param key - Which layer; an unknown one is ignored.
 */
export function clearShapeLayer(plugin: PluginContext, key: string): void {
  const layers = registry.get(plugin);
  const previous = layers?.get(key);
  if (layers === undefined || previous === undefined) return;
  layers.delete(key);
  plugin.canvas3d?.remove(previous);
  plugin.canvas3d?.commit();
}

/** Every layer drawn on a plugin, so each can be removed on its own. */
const registry = new WeakMap<PluginContext, Map<string, Representation.Any>>();
