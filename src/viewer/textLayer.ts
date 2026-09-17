/**
 * A layer of text floating in the scene: an element's name, a cell's a, b and c.
 */

import { TextBuilder } from 'molstar/lib/mol-geo/geometry/text/text-builder.js';
import { Text } from 'molstar/lib/mol-geo/geometry/text/text.js';
import { Shape } from 'molstar/lib/mol-model/shape.js';
import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';
// Lowercased on import: it is a factory, not a constructor.
import { ShapeRepresentation as createShapeRepresentation } from 'molstar/lib/mol-repr/shape/representation.js';
import { Color } from 'molstar/lib/mol-util/color/color.js';

import { clearShapeLayer, storeLayer } from './layerRegistry.ts';
import type { TextItem } from './primitives.ts';

/**
 * Replace a layer of floating text.
 *
 * @param plugin - The molstar context.
 * @param key - Which layer; a second call with the same key replaces it.
 * @param name - What the layer is called in a picking label.
 * @param items - The lines; an empty list clears the layer.
 * @param colour - What they are written in, `#rrggbb`.
 * @throws When the canvas is not initialised yet.
 */
export async function renderTextLayer(
  plugin: PluginContext,
  key: string,
  name: string,
  items: readonly TextItem[],
  colour: string,
): Promise<void> {
  const canvas3d = plugin.canvas3d;
  if (canvas3d === undefined) {
    throw new Error(
      `renderTextLayer: the molstar canvas is not ready (${key}).`,
    );
  }
  clearShapeLayer(plugin, key);
  if (items.length === 0) return;

  const builder = TextBuilder.create({}, items.length * 4, items.length * 4);
  const ink = Color.fromHexStyle(colour);
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (item === undefined) continue;
    const [x, y, z] = item.position;
    builder.add(item.text, x, y, z, item.size, item.size, index);
  }
  const shape = Shape.create(
    name,
    {},
    builder.getText(),
    () => ink,
    () => 1,
    (group: number) => items[group]?.text ?? name,
  );
  const representation = createShapeRepresentation(() => shape, Text.Utils);
  await plugin.runTask(
    representation.createOrUpdate({ attachment: 'middle-center' }, shape),
  );
  storeLayer(plugin, key, representation);
  canvas3d.add(representation);
  canvas3d.commit();
}
