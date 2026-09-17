/**
 * The unit cell, and the stack of cells around it.
 *
 * molstar's own unit-cell shape reads the space group off the model, and this
 * site gives it none — it has applied its own operations already — so the box is
 * drawn here, which also lets an n×n×n stack be drawn at all.
 */

import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';

import { cellAxisLabelPoints, cellEdges } from './cellGeometry.ts';
import { clearShapeLayer } from './layerRegistry.ts';
import { CELL_COLOUR, LABEL_COLOUR } from './palette.ts';
import type { MeshPrimitive, TextItem } from './primitives.ts';
import { renderShapeLayer } from './shapeLayer.ts';
import { renderTextLayer } from './textLayer.ts';
import type { CellRepeat, UnitCell } from './types.ts';

/** How the box is drawn. */
export interface CellStyle {
  /**
   * Radius of an edge, ångström.
   * @default 0.035
   */
  radius?: number;
  /**
   * Whether the a, b and c letters are drawn on the cell at the origin.
   * @default true
   */
  labels?: boolean;
  /**
   * Height of those letters, ångström.
   * @default 0.7
   */
  labelSize?: number;
}

/**
 * Replace the drawn cell.
 *
 * @param plugin - The molstar context.
 * @param cell - The six cell parameters, or `null` to draw none.
 * @param repeat - Cells along a, b and c.
 * @param style - See {@link CellStyle}.
 * @throws When the canvas is not ready, or the angles describe no cell.
 */
export async function renderUnitCell(
  plugin: PluginContext,
  cell: UnitCell | null,
  repeat: CellRepeat = [1, 1, 1],
  style: CellStyle = {},
): Promise<void> {
  if (cell === null) {
    clearUnitCell(plugin);
    return;
  }
  const radius = style.radius ?? 0.035;
  const primitives: MeshPrimitive[] = [];
  for (const edge of cellEdges(cell, repeat)) {
    primitives.push({ shape: 'rod', start: edge.start, end: edge.end, radius });
  }
  await renderShapeLayer(
    plugin,
    CELL_LAYER,
    'Unit cell',
    [{ label: 'Unit cell', colour: CELL_COLOUR, primitives }],
    { alpha: 1 },
  );
  await renderTextLayer(
    plugin,
    CELL_LABEL_LAYER,
    'Cell axes',
    style.labels === false ? [] : axisLabels(cell, style.labelSize ?? 0.7),
    LABEL_COLOUR,
  );
}

/**
 * Remove the cell and its letters.
 *
 * @param plugin - The molstar context.
 */
export function clearUnitCell(plugin: PluginContext): void {
  clearShapeLayer(plugin, CELL_LAYER);
  clearShapeLayer(plugin, CELL_LABEL_LAYER);
}

function axisLabels(cell: UnitCell, size: number): TextItem[] {
  const points = cellAxisLabelPoints(cell);
  return [
    { text: 'a', position: points[0], size },
    { text: 'b', position: points[1], size },
    { text: 'c', position: points[2], size },
  ];
}

const CELL_LAYER = 'symmetry-unit-cell';
const CELL_LABEL_LAYER = 'symmetry-unit-cell-labels';
