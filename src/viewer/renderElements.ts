/**
 * The symmetry elements over the structure — the reason this site has a viewer
 * of its own at all.
 *
 * The shapes come from `elementDrawing.ts`, which knows no molstar. This module
 * hands them to **three** layers, which is what keeps a cell holding ten of
 * them readable: the planes are drawn nearly transparent, the rods, rims and
 * balls that outline them stay solid, and the names sit in a third layer so
 * they can be switched off without rebuilding anything.
 *
 * Drawing the whole of an element at one opacity is what makes a stack of
 * mirror planes a wash of colour with the structure lost somewhere inside it.
 */

import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';

import type { ElementGroup } from './elementDrawing.ts';
import { elementGroups } from './elementDrawing.ts';
import { clearShapeLayer } from './layerRegistry.ts';
import { LABEL_COLOUR } from './palette.ts';
import type { ElementStyle, MeshPrimitive, TextItem } from './primitives.ts';
import type { ShapeGroup } from './shapeLayer.ts';
import { renderShapeLayer } from './shapeLayer.ts';
import { renderTextLayer } from './textLayer.ts';
import type { SymmetryDrawing } from './types.ts';

/** How the elements are drawn. */
export interface ElementLayerStyle {
  /** Sizes; the defaults of `primitives.ts` are used for anything left out. */
  style?: ElementStyle;
  /**
   * Whether each element's name floats beside it.
   * @default true
   */
  labels?: boolean;
  /**
   * Opacity of a plane's face. Low on purpose: the structure has to be read
   * through however many planes cut the cell.
   * @default 0.1
   */
  faceAlpha?: number;
  /**
   * Opacity of the rods, rims, arrows and balls.
   * @default 0.9
   */
  lineAlpha?: number;
}

/**
 * Replace the drawn symmetry elements.
 *
 * @param plugin - The molstar context.
 * @param drawings - The elements; an empty list clears them.
 * @param style - See {@link ElementLayerStyle}.
 * @returns The groups that were drawn, so a caller can measure them without
 *   building them a second time.
 * @throws When the canvas is not initialised yet.
 */
export async function renderSymmetryElements(
  plugin: PluginContext,
  drawings: readonly SymmetryDrawing[],
  style: ElementLayerStyle = {},
): Promise<ElementGroup[]> {
  const groups = elementGroups(drawings, {
    style: style.style,
    labels: style.labels ?? true,
  });
  const faces: ShapeGroup[] = [];
  const lines: ShapeGroup[] = [];
  const labels: TextItem[] = [];
  for (const group of groups) {
    const solid: MeshPrimitive[] = [];
    const flat: MeshPrimitive[] = [];
    for (const primitive of group.primitives) {
      const target =
        primitive.shape === 'face' || primitive.shape === 'plate'
          ? flat
          : solid;
      target.push(primitive);
    }
    const { label, colour } = group;
    if (flat.length > 0) faces.push({ label, colour, primitives: flat });
    if (solid.length > 0) lines.push({ label, colour, primitives: solid });
    for (const item of group.labels) labels.push({ ...item, colour });
  }
  await renderShapeLayer(plugin, FACE_LAYER, 'Symmetry planes', faces, {
    alpha: style.faceAlpha ?? 0.1,
    // A face seen edge-on would otherwise darken to nothing.
    ignoreLight: true,
  });
  await renderShapeLayer(plugin, ELEMENT_LAYER, 'Symmetry elements', lines, {
    alpha: style.lineAlpha ?? 0.9,
    ignoreLight: true,
  });
  await renderTextLayer(
    plugin,
    ELEMENT_LABEL_LAYER,
    'Symmetry element labels',
    labels,
    LABEL_COLOUR,
  );
  return groups;
}

/**
 * Remove the symmetry elements and their labels.
 *
 * @param plugin - The molstar context.
 */
export function clearSymmetryElements(plugin: PluginContext): void {
  clearShapeLayer(plugin, FACE_LAYER);
  clearShapeLayer(plugin, ELEMENT_LAYER);
  clearShapeLayer(plugin, ELEMENT_LABEL_LAYER);
}

const FACE_LAYER = 'symmetry-element-faces';
const ELEMENT_LAYER = 'symmetry-elements';
const ELEMENT_LABEL_LAYER = 'symmetry-element-labels';
