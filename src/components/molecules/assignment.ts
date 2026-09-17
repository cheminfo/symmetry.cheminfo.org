/**
 * Everything the workbench knows about one molecule, worked out in one pass.
 *
 * The page memoises this per molecule and per tolerance, and reads the rest off
 * it: the elements drawn over the structure, the operations grouped by class,
 * the route the assignment tree takes, and the group at the end of it.
 *
 * The group is **detected**, never read off the library record. The record says
 * what the geometry was built to be; the detector says what these coordinates
 * are, at a stated tolerance, which is the thing the site is teaching.
 */

import { flowQuestion } from '../../data/flowchart.ts';
import type { MoleculeEntry } from '../../data/molecules.ts';
import type { PointGroup } from '../../data/pointGroups.ts';
import { pointGroupBySlug } from '../../data/pointGroups.ts';
import type {
  AxisFinding,
  DetectionResult,
  SymmetryInventory,
} from '../../symmetry/detect.ts';
import {
  DEFAULT_TOLERANCE,
  centreAtoms,
  detectPointGroup,
  inventoryOfAtoms,
} from '../../symmetry/detect.ts';
import { walkFlowchart } from '../../symmetry/flowchart.ts';
import type { Vec3 } from '../../symmetry/point/vec3.ts';
import { sameAxis } from '../../symmetry/point/vec3.ts';
import type { SymmetryDrawing, ViewerAtom } from '../../viewer/core.ts';

import type { ElementLayers } from './elements.ts';
import { atomicExtent, linearElements, moleculeElements } from './elements.ts';
import { questionEvidence } from './evidence.ts';
import type { OperationClass } from './operationClasses.ts';
import { operationClasses } from './operationClasses.ts';
import { operationNames } from './operationNames.ts';
import { orbitDrawings } from './orbit.ts';

export { DEFAULT_TOLERANCE } from '../../symmetry/detect.ts';

/** One question of the assignment tree, answered by this molecule. */
export interface FlowStep {
  /** The question's own id, which the address of a tutorial step also uses. */
  readonly id: string;
  /** The question, with its `[[markers]]` still in it. */
  readonly question: string;
  /** What to look for. */
  readonly hint: string;
  /** What this molecule answers. */
  readonly answer: boolean;
  /** The count the answer was decided on. */
  readonly evidence: string;
}

/** The route the assignment tree takes through one structure. */
export interface MoleculeFlow {
  /** The questions it was asked, in order, each with what it answered. */
  readonly steps: readonly FlowStep[];
  /** Where the walk arrives, as a `PointGroup.id`. */
  readonly group: string;
}

/** One molecule, read end to end. */
export interface MoleculeAnalysis {
  readonly entry: MoleculeEntry;
  /** The atoms about the centroid, which is where every operation is centred. */
  readonly atoms: readonly ViewerAtom[];
  /** How far the furthest atom sits from the centroid, ångström. */
  readonly extent: number;
  readonly detection: DetectionResult;
  readonly inventory: SymmetryInventory;
  /** The catalogue row of the detected group, absent for a group nobody minted. */
  readonly group: PointGroup | undefined;
  /** One name per operation of `detection.operations`. */
  readonly names: readonly string[];
  /** The operations by conjugacy class, empty for a linear molecule. */
  readonly classes: readonly OperationClass[];
  /** The questions the tree asks of this molecule, in order. */
  readonly steps: readonly FlowStep[];
  /** Where the tree arrives, which the detector agrees with for every library entry. */
  readonly walkGroup: string;
  readonly layers: ElementLayers;
  /** A probe point and its images, empty for a linear molecule. */
  readonly orbit: readonly SymmetryDrawing[];
}

/**
 * Read a molecule: its group, its operations, its elements and its route
 * through the assignment tree.
 *
 * @param entry - The library molecule.
 * @param tolerance - How far an atom may land from the atom it maps onto, at
 *   2 Å from the centre. @default 0.1
 * @returns Everything the page draws from.
 */
export function analyseMolecule(
  entry: MoleculeEntry,
  tolerance: number = DEFAULT_TOLERANCE,
): MoleculeAnalysis {
  const positions = entry.atoms.map((atom) => atom.position);
  const elements = entry.atoms.map((atom) => atom.element);
  const atoms = centreAtoms(positions, elements);
  const extent = atomicExtent(atoms.map((atom) => atom.position));
  const detection = detectPointGroup(positions, elements, tolerance);
  const inventory = inventoryOfAtoms(positions, elements, { tolerance });
  const flow = flowOf(inventory);
  const names = operationNames(detection.operations);
  return {
    entry,
    atoms,
    extent,
    detection,
    inventory,
    group: pointGroupBySlug(detection.group.toLowerCase()),
    names,
    classes:
      detection.operations.length === 0
        ? []
        : operationClasses(detection.operations, names),
    steps: flow.steps,
    walkGroup: flow.group,
    layers: inventory.linear
      ? linearElements(
          detection.principalAxis ?? [0, 0, 1],
          detection.group === 'Dinfh',
          extent,
        )
      : moleculeElements(detection.operations, names, extent),
    orbit: orbitDrawings(detection.operations, extent),
  };
}

/**
 * The questions the tree puts to one molecule, and where it arrives.
 *
 * The workbench reads this off the full analysis it has already done; a
 * tutorial step wants only the walk, and pays only for the inventory it needs.
 * @param entry - The library molecule.
 * @param tolerance - How far an atom may land from the atom it maps onto, at
 *   2 Å from the centre. @default 0.1
 * @returns The answered route.
 */
export function moleculeFlow(
  entry: MoleculeEntry,
  tolerance: number = DEFAULT_TOLERANCE,
): MoleculeFlow {
  return flowOf(
    inventoryOfAtoms(
      entry.atoms.map((atom) => atom.position),
      entry.atoms.map((atom) => atom.element),
      { tolerance },
    ),
  );
}

/**
 * The questions the walk passed through, each with what it answered.
 *
 * @param path - `questionId:yes` and `questionId:no`, from `walkFlowchart`.
 * @param inventory - What the molecule holds.
 * @param principal - The axis the walk read `n` off.
 * @returns One step per question, in the order they were asked.
 */
export function flowSteps(
  path: readonly string[],
  inventory: SymmetryInventory,
  principal: AxisFinding | null,
): readonly FlowStep[] {
  const steps: FlowStep[] = [];
  for (const entry of path) {
    const colon = entry.lastIndexOf(':');
    const id = entry.slice(0, colon);
    const question = flowQuestion(id);
    steps.push({
      id,
      question: question.question,
      hint: question.hint,
      answer: entry.slice(colon + 1) === 'yes',
      evidence: questionEvidence(id, inventory, principal),
    });
  }
  return steps;
}

/** The walk down the tree, from an inventory somebody has already taken. */
function flowOf(inventory: SymmetryInventory): MoleculeFlow {
  const walk = walkFlowchart(inventory);
  return {
    steps: flowSteps(
      walk.path,
      inventory,
      principalOf(inventory, walk.principalAxis),
    ),
    group: walk.group,
  };
}

/** The inventory's entry for the axis the walk chose, with its order. */
function principalOf(
  inventory: SymmetryInventory,
  axis: Vec3 | null,
): AxisFinding | null {
  if (axis === null) return null;
  for (const finding of inventory.properAxes) {
    if (sameAxis(finding.axis, axis)) return finding;
  }
  return null;
}
