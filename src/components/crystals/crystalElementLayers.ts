/**
 * The symmetry elements of a cell, as a figure.
 *
 * Which kinds a layer switch puts on screen, where each one is cut off, how
 * thick it is drawn and when it stops carrying its name are one job, and it is
 * not the job of working out what the cell holds. The analysis next door is
 * exact crystallography and says nothing about how big anything looks;
 * everything here is legibility, and it is why a 3.9 Å perovskite and a 24 Å
 * zeolite read the same although their elements are drawn at very different
 * sizes.
 */

import type { SymmetryElement } from '../../symmetry/core/index.ts';
import { elementKey } from '../../symmetry/core/index.ts';
import type { ElementStyle, SymmetryDrawing } from '../../viewer/core.ts';
import { NO_SHIFT, crystalElementDrawing } from '../../viewer/core.ts';

import { elementBadge, elementLabel } from './crystalLabels.ts';
import type { CrystalAnalysis } from './crystalScene.ts';

/** Which kinds of element are drawn. */
export interface CrystalLayers {
  readonly axes: boolean;
  readonly screws: boolean;
  readonly mirrors: boolean;
  readonly glides: boolean;
  readonly inversion: boolean;
  readonly improper: boolean;
}

/**
 * The symmetry elements the layers ask for, in Cartesian ångström.
 *
 * Each is **cut off at the cell**: an axis runs from where it enters the box to
 * where it leaves it, and a plane is drawn as the polygon it slices out of it.
 * That is what makes a cell full of elements readable — every rod ends on a
 * face, every plane shows exactly where it cuts — where rods of one arbitrary
 * length and squares hanging in the middle of the box read as a pile of sticks.
 *
 * The identity and the centring translations are elements with nothing to draw,
 * so they come back as `null` and are dropped.
 *
 * @param analysis - What `analyseCrystal` returned.
 * @param layers - Which kinds are drawn.
 */
export function crystalDrawings(
  analysis: CrystalAnalysis,
  layers: CrystalLayers,
): SymmetryDrawing[] {
  const { cell } = analysis.lattice;
  const shortest = Math.min(cell.a, cell.b, cell.c);
  const longest = Math.max(cell.a, cell.b, cell.c);
  const drawings: SymmetryDrawing[] = [];
  for (const element of analysis.elements) {
    if (!drawsKind(element, layers)) continue;
    const drawing = crystalElementDrawing(element, analysis.lattice, {
      id: elementKey(element),
      label: elementLabel(element),
      badge: elementBadge(element),
      clip: true,
      shift: analysis.shifts.get(elementKey(element)) ?? NO_SHIFT,
      length: longest,
      size: shortest * 0.55,
    });
    if (drawing !== null) drawings.push(drawing);
  }
  return drawings;
}

/**
 * How thick and how large the elements of this cell are drawn.
 *
 * Everything is a fraction of the shortest cell edge, so the same figure reads
 * the same on a 3.9 Å perovskite and a 24 Å zeolite. A fixed size in ångström
 * is a hairline on one and a wall of text on the other.
 *
 * @param analysis - What `analyseCrystal` returned.
 */
export function crystalElementStyle(analysis: CrystalAnalysis): ElementStyle {
  const { cell } = analysis.lattice;
  const shortest = Math.min(cell.a, cell.b, cell.c);
  return {
    axisRadius: shortest * 0.012,
    rimRadius: shortest * 0.007,
    arrowRadius: shortest * 0.032,
    arrowLength: shortest * 0.08,
    centreRadius: shortest * 0.04,
    labelSize: shortest * 0.26,
    labelGap: shortest * 0.09,
  };
}

/**
 * How many elements may be drawn before their names are left off.
 *
 * Fifty labelled rods through one cell is a wall of text, and the label of an
 * element nobody can pick out of it says nothing. The list beside the view
 * names every one of them whatever is on screen.
 */
export const LABEL_LIMIT = 24;

function drawsKind(element: SymmetryElement, layers: CrystalLayers): boolean {
  switch (element.kind) {
    case 'rotation': {
      return layers.axes;
    }
    case 'screw': {
      return layers.screws;
    }
    case 'rotoinversion': {
      return layers.improper;
    }
    case 'mirror': {
      return layers.mirrors;
    }
    case 'glide': {
      return layers.glides;
    }
    case 'inversion': {
      return layers.inversion;
    }
    case 'identity':
    case 'translation': {
      return false;
    }
    // no default
  }
}
