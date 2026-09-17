/**
 * A symmetry element as shapes: the whole of what the 3D view draws over a
 * structure, worked out without a canvas anywhere in sight.
 *
 * The rules are the ones a crystallographic diagram uses. A proper axis is a
 * solid rod; a screw carries an arrow as long as its pitch, beside the rod so
 * neither hides the other; a rotoinversion is broken, with a ball at the point
 * it inverts through; a plane is a translucent square, and a glide plane wears
 * its glide vector as an arrow lying in it.
 */

import type { Vec3 } from '../symmetry/point/vec3.ts';
import {
  addVectors,
  normalizeVector,
  scaleVector,
  vectorNorm,
} from '../symmetry/point/vec3.ts';

import { perpendicularTo, planeFrame } from './frame.ts';
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
  for (const drawing of drawings) {
    groups.push({
      id: drawing.id,
      label: drawing.label,
      colour: drawingColour(drawing.kind, drawing.colour),
      primitives: drawingPrimitives(drawing, style),
      labels: withLabels ? drawingLabels(drawing, style) : [],
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
      return [plate(drawing.point, drawing.normal, drawing.size)];
    }
    case 'glide': {
      const length = vectorNorm(drawing.glide);
      return [
        plate(drawing.point, drawing.normal, drawing.size),
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
  if (drawing.label === '') return [];
  const sizes = resolveElementStyle(style);
  const size = sizes.labelSize;
  if (drawing.kind === 'inversion') {
    const offset = scaleVector(LABEL_UP, sizes.centreRadius + sizes.labelGap);
    return [
      {
        text: drawing.label,
        position: addVectors(drawing.point, offset),
        size,
      },
    ];
  }
  if (drawing.kind === 'mirror' || drawing.kind === 'glide') {
    const { major } = planeFrame(drawing.normal);
    const reach = drawing.size / 2 + sizes.labelGap;
    return [
      {
        text: drawing.label,
        position: addVectors(drawing.point, scaleVector(major, reach)),
        size,
      },
    ];
  }
  const unit = normalizeVector(drawing.direction);
  const reach = drawing.length / 2 + sizes.labelGap;
  return [
    {
      text: drawing.label,
      position: addVectors(drawing.point, scaleVector(unit, reach)),
      size,
    },
  ];
}

/**
 * A shaft and a head, pointing along `direction` for `length` ångström.
 *
 * @param base - Where the arrow starts.
 * @param direction - Which way it points; need not be normalised.
 * @param length - How far it reaches. A negative length points the other way,
 *   which is how a left-handed screw is told from a right-handed one.
 * @param sizes - Resolved sizes.
 * @returns The shaft, when there is room for one, and the head.
 */
function arrow(
  base: Point3,
  direction: Point3,
  length: number,
  sizes: ReturnType<typeof resolveElementStyle>,
): MeshPrimitive[] {
  const reach = Math.abs(length);
  if (reach < MINIMUM_ARROW) return [];
  const unit = scaleVector(normalizeVector(direction), Math.sign(length));
  const head = Math.min(sizes.arrowLength, reach);
  const shaftEnd = addVectors(base, scaleVector(unit, reach - head));
  const tip = addVectors(base, scaleVector(unit, reach));
  const primitives: MeshPrimitive[] = [];
  if (reach > head) {
    primitives.push({
      shape: 'rod',
      start: base,
      end: shaftEnd,
      radius: sizes.axisRadius,
    });
  }
  primitives.push({
    shape: 'cone',
    base: shaftEnd,
    tip,
    radius: sizes.arrowRadius,
  });
  return primitives;
}

/** The two ends of a rod of `length` centred on `point`. */
function rodEnds(
  point: Point3,
  direction: Point3,
  length: number,
): [Point3, Point3] {
  const half = scaleVector(normalizeVector(direction), length / 2);
  return [addVectors(point, scaleVector(half, -1)), addVectors(point, half)];
}

/** The square a mirror or a glide plane is drawn as. */
function plate(point: Point3, normal: Point3, size: number): MeshPrimitive {
  const { major, minor } = planeFrame(normal);
  return { shape: 'plate', centre: point, major, minor, size };
}

/** Which way an inversion centre's label sits, having no direction of its own. */
const LABEL_UP: Vec3 = [0, 0, 1];

/** Below this, ångström, an arrow is a blob and is left out. */
const MINIMUM_ARROW = 1e-6;
