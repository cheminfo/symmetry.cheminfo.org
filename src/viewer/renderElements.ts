/**
 * The symmetry elements over the structure — the reason this site has a viewer
 * of its own at all.
 *
 * The shapes come from `elementDrawing.ts`, which knows no molstar; this module
 * only hands them to a layer, and keeps the labels in a second layer so they can
 * be switched off without rebuilding the elements.
 */

import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';

import type { ElementGroup } from './elementDrawing.ts';
import { elementGroups } from './elementDrawing.ts';
import { clearShapeLayer } from './layerRegistry.ts';
import { LABEL_COLOUR } from './palette.ts';
import type { ElementStyle, TextItem } from './primitives.ts';
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
   * Opacity of the planes and the axes. A marker over a structure stays fainter
   * than the structure it marks.
   * @default 0.45
   */
  alpha?: number;
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
  const shapes: ShapeGroup[] = [];
  const labels: TextItem[] = [];
  for (const group of groups) {
    shapes.push({
      label: group.label,
      colour: group.colour,
      primitives: group.primitives,
    });
    labels.push(...group.labels);
  }
  await renderShapeLayer(plugin, ELEMENT_LAYER, 'Symmetry elements', shapes, {
    alpha: style.alpha ?? 0.45,
    // A square seen edge-on would otherwise darken to nothing.
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
  clearShapeLayer(plugin, ELEMENT_LAYER);
  clearShapeLayer(plugin, ELEMENT_LABEL_LAYER);
}

const ELEMENT_LAYER = 'symmetry-elements';
const ELEMENT_LABEL_LAYER = 'symmetry-element-labels';
