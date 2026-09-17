/**
 * A symmetry element as shapes: the whole of what the 3D view draws over a
 * structure, worked out without a canvas anywhere in sight.
 *
 * The rules are the ones a crystallographic diagram uses. A proper axis is a
 * solid rod; a screw carries an arrow as long as its pitch, beside the rod so
 * neither hides the other; a rotoinversion is broken, with a ball at the point
 * it inverts through; a plane is a translucent face with its rim drawn, and a
 * glide plane wears its glide vector as an arrow lying in it.
 *
 * A plane drawn over a cell is handed the polygon it cuts out of that cell, so
 * what is on screen is the slice itself rather than a square hanging in the
 * middle of the box. Without one — a molecule has no cell to cut — it falls
 * back to a square of `size`.
 */

import {
  addVectors,
  normalizeVector,
  scaleVector,
  vectorNorm,
} from '../symmetry/point/vec3.ts';

import { spacedLabels } from './elementLabels.ts';
import { arrow, planeFace, rodEnds } from './elementShapes.ts';
import { perpendicularTo } from './frame.ts';
import { drawingColour } from './palette.ts';
import type { ElementStyle, MeshPrimitive, TextItem } from './primitives.ts';
import { resolveElementStyle } from './primitives.ts';
import type { Point3, SymmetryDrawing } from './types.ts';

/** One element, ready to become one pickable, labelled group of a mesh. */
export interface ElementGroup {
  /** The drawing's own id, unchanged. */
  readonly id: string;
  /** What the pointer reads. */
  readonly label: string;
  /** `#rrggbb`. */
  readonly colour: string;
  /** Its shapes. */
  readonly primitives: readonly MeshPrimitive[];
  /** Its floating text, empty when labels are off. */
  readonly labels: readonly TextItem[];
}

/**
 * Turn the drawings into groups, in the order they were given.
 *
 * @param drawings - The elements to draw.
 * @param options - Sizes, and whether the labels are drawn.
 * @returns One group per drawing.
 */
export function elementGroups(
  drawings: readonly SymmetryDrawing[],
  options: { style?: ElementStyle; labels?: boolean } = {},
): ElementGroup[] {
  const style = resolveElementStyle(options.style);
  const withLabels = options.labels ?? true;
  const groups: ElementGroup[] = [];
  const taken: Point3[] = [];
  for (const drawing of drawings) {
    groups.push({
      id: drawing.id,
      label: drawing.label,
      colour: drawingColour(drawing.kind, drawing.colour),
      primitives: drawingPrimitives(drawing, style),
      labels: withLabels ? spacedLabels(drawing, style, taken) : [],
    });
  }
  return groups;
}

/**
 * The shapes one element is drawn as.
 *
 * @param drawing - The element.
 * @param style - Sizes; the defaults are used for anything left out.
 * @returns Its shapes, in drawing order.
 */
export function drawingPrimitives(
  drawing: SymmetryDrawing,
  style: ElementStyle = {},
): MeshPrimitive[] {
  const sizes = resolveElementStyle(style);
  switch (drawing.kind) {
    case 'inversion': {
      return [
        { shape: 'sphere', centre: drawing.point, radius: sizes.centreRadius },
      ];
    }
    case 'mirror': {
      return planeFace(drawing, sizes);
    }
    case 'glide': {
      const length = vectorNorm(drawing.glide);
      return [
        ...planeFace(drawing, sizes),
        ...arrow(drawing.point, drawing.glide, length, sizes),
      ];
    }
    case 'rotoinversion': {
      const [start, end] = rodEnds(
        drawing.point,
        drawing.direction,
        drawing.length,
      );
      return [
        {
          shape: 'dashes',
          start,
          end,
          radius: sizes.axisRadius,
          segments: sizes.dashSegments,
        },
        { shape: 'sphere', centre: drawing.point, radius: sizes.centreRadius },
      ];
    }
    case 'screw': {
      const [start, end] = rodEnds(
        drawing.point,
        drawing.direction,
        drawing.length,
      );
      const unit = normalizeVector(drawing.direction);
      const beside = addVectors(
        drawing.point,
        scaleVector(
          perpendicularTo(unit),
          sizes.arrowOffset * sizes.axisRadius,
        ),
      );
      return [
        { shape: 'rod', start, end, radius: sizes.axisRadius },
        ...arrow(beside, unit, drawing.pitch, sizes),
      ];
    }
    case 'rotation': {
      const [start, end] = rodEnds(
        drawing.point,
        drawing.direction,
        drawing.length,
      );
      return [{ shape: 'rod', start, end, radius: sizes.axisRadius }];
    }
    // no default
  }
}
