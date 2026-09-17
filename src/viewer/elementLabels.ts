/**
 * Where an element's name floats, and whether it is written at all.
 *
 * Naming a symmetry element is harder than drawing it, because symmetry piles
 * elements on top of each other: the nine mirror planes of a cubic cell all
 * meet at its eight corners. So a name is placed as far from the structure as
 * its element reaches, and is dropped when another name already sits there.
 */

import type { Vec3 } from '../symmetry/point/vec3.ts';
import {
  addVectors,
  normalizeVector,
  scaleVector,
  subtractVectors,
  vectorNorm,
} from '../symmetry/point/vec3.ts';

import { faceCorners } from './elementShapes.ts';
import { plainName } from './labelText.ts';
import type {
  ElementStyle,
  ResolvedElementStyle,
  TextItem,
} from './primitives.ts';
import { resolveElementStyle } from './primitives.ts';
import type {
  GlideDrawing,
  MirrorDrawing,
  Point3,
  SymmetryDrawing,
} from './types.ts';

/**
 * Where one element's text floats, and what it reads.
 *
 * @param drawing - The element.
 * @param style - Sizes; the defaults are used for anything left out.
 * @returns One line of text, or none when the element carries no label.
 */
export function drawingLabels(
  drawing: SymmetryDrawing,
  style: ElementStyle = {},
): TextItem[] {
  const text = plainName(drawing.badge ?? drawing.label);
  if (text === '') return [];
  const sizes = resolveElementStyle(style);
  const size = sizes.labelSize;
  if (drawing.kind === 'inversion') {
    const offset = scaleVector(LABEL_UP, sizes.centreRadius + sizes.labelGap);
    return [{ text, position: addVectors(drawing.point, offset), size }];
  }
  if (drawing.kind === 'mirror' || drawing.kind === 'glide') {
    return [{ text, position: planeLabelPoint(drawing, sizes), size }];
  }
  const unit = normalizeVector(drawing.direction);
  const reach = drawing.length / 2 + sizes.labelGap;
  return [
    {
      text,
      position: addVectors(drawing.point, scaleVector(unit, reach)),
      size,
    },
  ];
}

/**
 * The element's name, unless another name already sits where it would go.
 *
 * Symmetry puts elements on top of each other — nine mirror planes of a cubic
 * cell meet at the same eight corners — and two names in one place are not two
 * names, they are a smudge. The one drawn first keeps the spot; the rest are
 * still on the pointer and in the list beside the view.
 *
 * @param drawing - The element.
 * @param style - Resolved sizes.
 * @param taken - Where names already sit; the kept one is added to it.
 * @returns Its text, or none when the spot is taken.
 */
export function spacedLabels(
  drawing: SymmetryDrawing,
  style: ResolvedElementStyle,
  taken: Point3[],
): TextItem[] {
  const kept: TextItem[] = [];
  for (const item of drawingLabels(drawing, style)) {
    let clear = true;
    for (const other of taken) {
      if (vectorNorm(subtractVectors(item.position, other)) < style.labelSize) {
        clear = false;
        break;
      }
    }
    if (!clear) continue;
    taken.push(item.position);
    kept.push(item);
  }
  return kept;
}

/**
 * Where a plane's name sits: a corner of the drawn face, pushed out of it.
 *
 * A corner is as far from the structure as the element gets, so the names of
 * ten planes through one cell end up spread round its edges rather than piled
 * on the atoms in the middle.
 */
function planeLabelPoint(
  drawing: GlideDrawing | MirrorDrawing,
  sizes: ResolvedElementStyle,
): Point3 {
  const corners = faceCorners(drawing);
  const first = corners[0];
  if (first === undefined) return drawing.point;
  let centre: Point3 = [0, 0, 0];
  for (const corner of corners) centre = addVectors(centre, corner);
  centre = scaleVector(centre, 1 / corners.length);
  const outward = subtractVectors(first, centre);
  if (vectorNorm(outward) < FLAT) return first;
  return addVectors(
    first,
    scaleVector(normalizeVector(outward), sizes.labelGap),
  );
}

/** Which way an inversion centre's label sits, having no direction of its own. */
const LABEL_UP: Vec3 = [0, 0, 1];

/** Below this, ångström, a corner is the centre and has no outward direction. */
const FLAT = 1e-9;
