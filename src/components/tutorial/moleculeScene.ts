/**
 * What the 3D view shows for a molecule: the structure, its elements, and the
 * operation a step plays.
 *
 * The structure is centred on its centroid, because that is the frame the
 * detector works in and therefore the frame every axis and plane it returns
 * passes through the origin of. Drawing the library coordinates instead puts
 * every element beside the molecule rather than through it.
 */

import { moleculeById } from '../../data/molecules.ts';
import { centreAtoms, detectPointGroup } from '../../symmetry/detect.ts';
import type { PointOperation } from '../../symmetry/operations.ts';
import type { Vec3 } from '../../symmetry/point/vec3.ts';
import { operationByName } from '../../symmetry/validate.ts';
import type { ViewerOperation } from '../../viewer/core.ts';
import type { ViewerScene } from '../viewer/index.ts';

import type { MoleculeElementOptions } from './moleculeElements.ts';
import { moleculeElements, structureRadius } from './moleculeElements.ts';

/** What the scene draws beyond the atoms. */
export interface MoleculeSceneOptions extends Omit<
  MoleculeElementOptions,
  'radius'
> {
  /** Whether each element's name floats beside it. @default true */
  readonly labels?: boolean;
  /**
   * The operation to play, named as `groupOperationNames` names it — `C3`,
   * `σv(xz)`, `i`, `S4`. A name the group does not carry plays nothing.
   * @default undefined — nothing moves
   */
  readonly play?: { readonly nonce: number; readonly name: string };
}

/** The scene, and what is needed to caption it. */
export interface MoleculeSceneResult {
  readonly scene: ViewerScene;
  /** The `PointGroup.id` the detector reads off the coordinates. */
  readonly group: string;
  /** Every operation, in the molecule's own frame. */
  readonly operations: readonly PointOperation[];
}

/**
 * The scene for one molecule of the library.
 *
 * @param moleculeId - `MoleculeEntry.id`.
 * @param options - See {@link MoleculeSceneOptions}.
 * @returns The scene, the detected group, and the operations it was built from.
 * @throws When the library holds no such molecule.
 */
export function moleculeScene(
  moleculeId: string,
  options: MoleculeSceneOptions = {},
): MoleculeSceneResult {
  const entry = moleculeById(moleculeId);
  if (entry === undefined) {
    throw new RangeError(`no molecule ${moleculeId} in the library`);
  }
  const positions = entry.atoms.map((atom) => atom.position);
  const elements = entry.atoms.map((atom) => atom.element);
  const centred = centreAtoms(positions, elements);
  const detected = detectPointGroup(positions, elements);
  const radius = structureRadius(centred.map((atom) => atom.position));

  return {
    group: detected.group,
    operations: detected.operations,
    scene: {
      atoms: centred,
      elements: moleculeElements(detected.operations, { ...options, radius }),
      labels: options.labels ?? true,
      play: playback(detected.group, options.play),
    },
  };
}

/**
 * One molecular operation, as the viewer applies it.
 *
 * Everything acts about the centroid, which the scene has already moved to the
 * origin, so no operation of a point group carries a translation.
 * @param operation - What `operationByName` or the detector returned.
 * @returns The operation, or `null` for the identity, which moves nothing.
 */
export function viewerOperation(
  operation: PointOperation,
): ViewerOperation | null {
  const axis = operation.axis ?? Z_AXIS;
  switch (operation.kind) {
    case 'Cn': {
      return {
        kind: 'rotation',
        axis,
        origin: ORIGIN,
        order: operation.order,
        power: operation.power,
      };
    }
    case 'Sn': {
      return {
        kind: 'improperRotation',
        axis,
        origin: ORIGIN,
        order: operation.order,
        power: operation.power,
      };
    }
    case 'sigma': {
      return { kind: 'mirror', normal: axis, point: ORIGIN };
    }
    case 'i': {
      return { kind: 'inversion', centre: ORIGIN };
    }
    case 'E': {
      return null;
    }
    // no default
  }
}

/** The named operation, as the viewer plays it, or nothing to play. */
function playback(
  group: string,
  play: MoleculeSceneOptions['play'],
): ViewerScene['play'] {
  if (play === undefined) return null;
  const operation = operationByName(group, play.name);
  if (operation === undefined) return null;
  const viewer = viewerOperation(operation);
  return viewer === null ? null : { nonce: play.nonce, operation: viewer };
}

const ORIGIN: Vec3 = [0, 0, 0];
const Z_AXIS: Vec3 = [0, 0, 1];
