/**
 * Drawing a part of the scene and telling the camera how far it reaches, in one
 * call, so the two can never disagree.
 */

import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';

import { setSceneExtent } from './camera.ts';
import { cellEdges } from './cellGeometry.ts';
import type { ElementGroup } from './elementDrawing.ts';
import { boundingSphereOf, primitivesExtent } from './framing.ts';
import type { MeshPrimitive } from './primitives.ts';
import type { CellStyle } from './renderCell.ts';
import { renderUnitCell } from './renderCell.ts';
import type { ElementLayerStyle } from './renderElements.ts';
import { renderSymmetryElements } from './renderElements.ts';
import type { StructureStyle } from './renderStructure.ts';
import { renderStructure } from './renderStructure.ts';
import type {
  CellRepeat,
  Point3,
  SymmetryDrawing,
  UnitCell,
  ViewerAtom,
} from './types.ts';

/**
 * Replace the atoms, and record how far they reach.
 *
 * @param plugin - The molstar context.
 * @param atoms - The whole scene, Cartesian ångström.
 * @param style - See {@link StructureStyle}.
 */
export async function drawStructure(
  plugin: PluginContext,
  atoms: readonly ViewerAtom[],
  style?: StructureStyle,
): Promise<void> {
  await renderStructure(plugin, atoms, style);
  if (atoms.length === 0) {
    setSceneExtent(plugin, 'atoms', null);
    return;
  }
  const positions: Point3[] = [];
  for (const atom of atoms) positions.push(atom.position);
  // The largest van der Waals radius an ordinary structure carries is about
  // 2 Å, and the representation draws a ball of that times the size factor.
  setSceneExtent(plugin, 'atoms', boundingSphereOf(positions, ATOM_PADDING));
}

/**
 * Replace the cell, and record how far it reaches.
 *
 * @param plugin - The molstar context.
 * @param cell - The six cell parameters, or `null` to draw none.
 * @param repeat - Cells along a, b and c.
 * @param style - See {@link CellStyle}.
 */
export async function drawCell(
  plugin: PluginContext,
  cell: UnitCell | null,
  repeat: CellRepeat = [1, 1, 1],
  style?: CellStyle,
): Promise<void> {
  await renderUnitCell(plugin, cell, repeat, style);
  if (cell === null) {
    setSceneExtent(plugin, 'cell', null);
    return;
  }
  const corners: Point3[] = [];
  for (const edge of cellEdges(cell, repeat)) {
    corners.push(edge.start, edge.end);
  }
  setSceneExtent(plugin, 'cell', boundingSphereOf(corners));
}

/**
 * Replace the symmetry elements, and record how far they reach.
 *
 * @param plugin - The molstar context.
 * @param drawings - The elements.
 * @param style - See {@link ElementLayerStyle}.
 */
export async function drawElements(
  plugin: PluginContext,
  drawings: readonly SymmetryDrawing[],
  style?: ElementLayerStyle,
): Promise<void> {
  const groups: ElementGroup[] = await renderSymmetryElements(
    plugin,
    drawings,
    style,
  );
  if (groups.length === 0) {
    setSceneExtent(plugin, 'elements', null);
    return;
  }
  const primitives: MeshPrimitive[] = [];
  for (const group of groups) primitives.push(...group.primitives);
  setSceneExtent(plugin, 'elements', primitivesExtent(primitives));
}

const ATOM_PADDING = 0.5;
