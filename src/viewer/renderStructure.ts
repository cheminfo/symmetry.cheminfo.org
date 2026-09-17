/**
 * The atoms on screen.
 *
 * They arrive already expanded and already repeated over the lattice, as
 * Cartesian ångström, and go in as XYZ — the one format that carries elements
 * and coordinates and invites molstar to apply nothing of its own.
 */

import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';
import { PluginStateObject } from 'molstar/lib/mol-plugin-state/objects.js';
import type { Representation } from 'molstar/lib/mol-repr/representation.js';

import { toXyzText } from './structureText.ts';
import type { ViewerAtom } from './types.ts';

/** How the atoms are drawn. */
export interface StructureStyle {
  /**
   * Balls and sticks, or space-filling spheres.
   * @default 'ball-and-stick'
   */
  representation?: 'ball-and-stick' | 'spacefill';
  /**
   * Ball and stick radius multiplier. A handful of atoms reads better slightly
   * thinner than molstar's protein-oriented default.
   * @default 0.25
   */
  sizeFactor?: number;
}

/**
 * Replace the atoms on screen.
 *
 * @param plugin - The molstar context.
 * @param atoms - The whole scene, Cartesian ångström; an empty list clears it.
 * @param style - See {@link StructureStyle}.
 * @throws When molstar parses the file to no atoms at all.
 */
export async function renderStructure(
  plugin: PluginContext,
  atoms: readonly ViewerAtom[],
  style: StructureStyle = {},
): Promise<void> {
  await clearStructure(plugin);
  if (atoms.length === 0) return;
  const { representation = 'ball-and-stick', sizeFactor = 0.25 } = style;

  const data = await plugin.builders.data.rawData(
    { data: toXyzText(atoms) },
    { ref: STRUCTURE_DATA_REF, state: { isGhost: true } },
  );
  const trajectory = await plugin.builders.structure.parseTrajectory(
    data,
    'xyz',
  );
  const model = await plugin.builders.structure.createModel(trajectory);
  if ((model.data?.atomicHierarchy.atoms._rowCount ?? 0) !== atoms.length) {
    await clearStructure(plugin);
    throw new Error(
      `molstar read ${model.data?.atomicHierarchy.atoms._rowCount ?? 0} of the ${atoms.length} atoms it was given.`,
    );
  }
  const structure = await plugin.builders.structure.createStructure(model);
  const drawn =
    await plugin.builders.structure.representation.addRepresentation(
      structure,
      representation === 'spacefill'
        ? {
            type: 'spacefill',
            typeParams: { sizeFactor: 1 },
            color: 'element-symbol',
          }
        : {
            type: 'ball-and-stick',
            // A benzene drawn with molstar's dashed aromatic bond already shows
            // the π cloud, which is a different lesson from the one here.
            typeParams: {
              sizeFactor,
              sizeAspectRatio: 2 / 3,
              aromaticBonds: false,
            },
            color: 'element-symbol',
            colorParams: {
              carbonColor: { name: 'element-symbol', params: {} },
            },
          },
    );
  representationRefs.set(plugin, drawn.ref);
}

/**
 * Remove the atoms, leaving every drawn layer in place.
 *
 * @param plugin - The molstar context.
 */
export async function clearStructure(plugin: PluginContext): Promise<void> {
  representationRefs.delete(plugin);
  if (!plugin.state.data.cells.has(STRUCTURE_DATA_REF)) return;
  await plugin.build().delete(STRUCTURE_DATA_REF).commit();
}

/**
 * The representation the atoms are drawn by, which is what an operation moves.
 *
 * It is resolved from the state tree rather than kept, because a rebuild
 * replaces the object behind the same address.
 *
 * @param plugin - The molstar context.
 * @returns The representation, or `undefined` when nothing is drawn.
 */
export function structureRepresentation(
  plugin: PluginContext,
): Representation.Any | undefined {
  const ref = representationRefs.get(plugin);
  if (ref === undefined) return undefined;
  const object = plugin.state.data.cells.get(ref)?.obj;
  if (!PluginStateObject.Molecule.Structure.Representation3D.is(object)) {
    return undefined;
  }
  return object.data.repr;
}

/** Deleting this ref deletes the model and the representation under it. */
const STRUCTURE_DATA_REF = 'symmetry-structure-data';

/** Where the drawn representation sits in the state tree, per plugin. */
const representationRefs = new WeakMap<PluginContext, string>();
