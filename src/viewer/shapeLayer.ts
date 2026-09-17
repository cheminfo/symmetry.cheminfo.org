/**
 * A layer of shapes: one mesh with one group per item, so every item picks up
 * its own colour and its own hover label while the whole layer is added and
 * removed in one call.
 */

import { MeshBuilder } from 'molstar/lib/mol-geo/geometry/mesh/mesh-builder.js';
import { Mesh } from 'molstar/lib/mol-geo/geometry/mesh/mesh.js';
import { Shape } from 'molstar/lib/mol-model/shape.js';
import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';
// Lowercased on import: it is a factory, not a constructor.
import { ShapeRepresentation as createShapeRepresentation } from 'molstar/lib/mol-repr/shape/representation.js';
import { Color } from 'molstar/lib/mol-util/color/color.js';

import { clearShapeLayer, storeLayer } from './layerRegistry.ts';
import { addMeshPrimitive } from './meshPrimitives.ts';
import type { MeshPrimitive } from './primitives.ts';

/** One pickable, labelled item of a layer. */
export interface ShapeGroup {
  /** What the pointer reads. */
  readonly label: string;
  /** `#rrggbb`. */
  readonly colour: string;
  /** Its shapes. */
  readonly primitives: readonly MeshPrimitive[];
}

/** How solid a layer looks. */
export interface ShapeLayerStyle {
  /**
   * Opacity.
   * @default 1
   */
  alpha?: number;
  /**
   * Draw it flat, so a square reads as one even surface whatever angle it is
   * seen from.
   * @default false
   */
  ignoreLight?: boolean;
}

/**
 * Replace a layer of shapes.
 *
 * @param plugin - The molstar context.
 * @param key - Which layer; a second call with the same key replaces it.
 * @param name - What the layer is called in a picking label.
 * @param groups - The items; an empty list clears the layer.
 * @param style - See {@link ShapeLayerStyle}.
 * @throws When the canvas is not initialised yet.
 */
export async function renderShapeLayer(
  plugin: PluginContext,
  key: string,
  name: string,
  groups: readonly ShapeGroup[],
  style: ShapeLayerStyle = {},
): Promise<void> {
  const canvas3d = plugin.canvas3d;
  if (canvas3d === undefined) {
    throw new Error(
      `renderShapeLayer: the molstar canvas is not ready (${key}).`,
    );
  }
  clearShapeLayer(plugin, key);
  if (groups.length === 0) return;

  const state = MeshBuilder.createState(4096, 2048);
  const colours: Color[] = [];
  const labels: string[] = [];
  for (const group of groups) {
    state.currentGroup = colours.length;
    colours.push(Color.fromHexStyle(group.colour));
    labels.push(group.label);
    for (const primitive of group.primitives) {
      addMeshPrimitive(state, primitive);
    }
  }
  const mesh = MeshBuilder.getMesh(state);
  Mesh.computeNormals(mesh);
  const shape = Shape.create(
    name,
    {},
    mesh,
    (group: number) => colours[group] ?? BLACK,
    () => 1,
    (group: number) => labels[group] ?? name,
  );
  const representation = createShapeRepresentation(() => shape, Mesh.Utils);
  await plugin.runTask(
    representation.createOrUpdate(
      {
        alpha: style.alpha ?? 1,
        doubleSided: true,
        ignoreLight: style.ignoreLight ?? false,
      },
      shape,
    ),
  );
  storeLayer(plugin, key, representation);
  canvas3d.add(representation);
  // add() only queues; nothing appears until the queue is committed.
  canvas3d.commit();
}

const BLACK = Color.fromHexStyle('#000000'); // tokens-ok: the fallback ink of a picking label.
