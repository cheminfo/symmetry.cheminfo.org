/**
 * Everything an exercise answer is checked against.
 *
 * Nothing here reads an authored value. Each function goes back to the
 * engine — the detector, the catalogues, the character tables, the space-group
 * operations — so the content tests and the validators cannot drift apart:
 * they call the same function.
 */

import { characterTableOf } from '../../data/characterTables.ts';
import type { CountableQuantity } from '../../data/exercises/types.ts';
import type { ObjectRef } from '../../data/glossary/types.ts';
import { splitObjectRef } from '../../data/glossary/types.ts';
import { moleculeById } from '../../data/molecules.ts';
import { WALLPAPER_GROUPS } from '../../data/planeGroups.ts';
import { pointGroupById, pointGroupBySlug } from '../../data/pointGroups.ts';
import { centringTranslations } from '../core/index.ts';
import { centreAtoms, detectPointGroup, isLinear } from '../detect.ts';
import type { PointOperation } from '../operations.ts';
import { operationsOf } from '../pointGroups.ts';
import {
  spaceGroup,
  spaceGroupOperations,
  spaceGroupSettings,
} from '../spaceGroups.ts';

/** The `PointGroup.id` the detector reads off a molecule of the library. */
export function moleculePointGroup(moleculeId: string): string {
  const entry = moleculeById(moleculeId);
  if (entry === undefined) {
    throw new RangeError(`no molecule ${moleculeId} in the library`);
  }
  const positions = entry.atoms.map((atom) => atom.position);
  const elements = entry.atoms.map((atom) => atom.element);
  return detectPointGroup(positions, elements).group;
}

/** The class labels of a group, which is what a `select` on operations offers. */
export function groupClassLabels(group: string): readonly string[] {
  return pointGroupById(group).classes.map((entry) => entry.label);
}

/**
 * A quantity of an object, or `null` when the quantity does not apply to it.
 *
 * `null` is a defect in the content, never a legitimate answer, so the content
 * test fails on it rather than skipping the case.
 * @param object - What the question is about.
 * @param quantity - What is counted.
 * @returns The count, or `null`.
 */
export function deriveCount(
  object: ObjectRef,
  quantity: CountableQuantity,
): number | null {
  const { kind, id } = splitObjectRef(object);
  if (kind === 'molecule') return moleculeCount(id, quantity);
  if (kind === 'pointGroup') {
    const group = pointGroupBySlug(id);
    return group === undefined ? null : groupCount(group.id, quantity);
  }
  if (kind === 'spaceGroup') return spaceGroupCount(Number(id), quantity);
  if (kind === 'wallpaper' && quantity === 'operationsPerCell') {
    return WALLPAPER_GROUPS.find((g) => g.id === id)?.operationsPerCell ?? null;
  }
  return null;
}

/** Whether the space group with this number holds only proper operations. */
export function isSohncke(number: number): boolean {
  return spaceGroup(number).sohncke;
}

/** One row of a character table, keyed by class label. @throws When absent. */
export function characterRow(
  group: string,
  mulliken: string,
): Record<string, number> {
  const table = characterTableOf(group);
  if (table === undefined) {
    throw new RangeError(`no character table for ${group}`);
  }
  const irrep = table.irreps.find((row) => row.mulliken === mulliken);
  if (irrep === undefined) {
    throw new RangeError(
      `${group} has no irreducible representation ${mulliken}`,
    );
  }
  const row: Record<string, number> = {};
  for (let index = 0; index < table.classes.length; index++) {
    const character = irrep.characters[index];
    if (typeof character !== 'number') {
      throw new RangeError(`${group} ${mulliken} has a complex character`);
    }
    row[table.classes[index] as string] = character;
  }
  return row;
}

/** How many of each irrep a reducible representation holds, zeroes included. */
export function reduceToIrreps(
  group: string,
  gamma: readonly number[],
): Record<string, number> {
  const table = characterTableOf(group);
  if (table === undefined) {
    throw new RangeError(`no character table for ${group}`);
  }
  if (gamma.length !== table.classes.length) {
    throw new RangeError(
      `Γ for ${group} needs ${table.classes.length} characters, not ${gamma.length}`,
    );
  }
  const order = sum(table.classSizes);
  const counts: Record<string, number> = {};
  for (const irrep of table.irreps) {
    let total = 0;
    for (let index = 0; index < gamma.length; index++) {
      const character = irrep.characters[index];
      if (typeof character !== 'number') {
        throw new RangeError(`${group} cannot be reduced: complex characters`);
      }
      total +=
        (table.classSizes[index] as number) *
        (gamma[index] as number) *
        character;
    }
    counts[irrep.mulliken] = total / order;
  }
  return counts;
}

/** Every operation of a group; the barrel keeps the import in one place. */
export function groupOperations(group: string): readonly PointOperation[] {
  return operationsOf(group);
}

/** How many distinct proper rotation axes a group has, counting each once. */
export function properAxisCount(group: string): number {
  const seen = new Set<string>();
  for (const operation of operationsOf(group)) {
    if (operation.kind !== 'Cn' || operation.axis === null) continue;
    seen.add(axisKey(operation.axis));
  }
  return seen.size;
}

/** An axis and its opposite share a key, so one axis is never counted twice. */
function axisKey(axis: readonly number[]): string {
  const rounded: number[] = [];
  for (let index = 0; index < 3; index++) {
    rounded.push(Math.round((axis[index] ?? 0) * 1e4) / 1e4);
  }
  let sign = 1;
  for (const value of rounded) {
    if (value === 0) continue;
    sign = value < 0 ? -1 : 1;
    break;
  }
  return rounded.map((value) => value * sign + 0).join(',');
}

function moleculeCount(
  moleculeId: string,
  quantity: CountableQuantity,
): number | null {
  const entry = moleculeById(moleculeId);
  if (entry === undefined) return null;
  if (quantity === 'vibrations') {
    const atoms = centreAtoms(
      entry.atoms.map((atom) => atom.position),
      entry.atoms.map((atom) => atom.element),
    );
    return 3 * entry.atoms.length - (isLinear(atoms) ? 5 : 6);
  }
  return groupCount(moleculePointGroup(moleculeId), quantity);
}

function groupCount(group: string, quantity: CountableQuantity): number | null {
  const entry = pointGroupById(group);
  if (quantity === 'order') {
    return Number.isFinite(entry.order) ? entry.order : null;
  }
  if (quantity === 'classes') return entry.classes.length;
  const table = characterTableOf(group);
  if (quantity === 'irreps') return table?.irreps.length ?? null;
  if (quantity === 'infraredActiveIrreps' || quantity === 'ramanActiveIrreps') {
    if (table === undefined) return null;
    let active = 0;
    for (const irrep of table.irreps) {
      const infrared = irrep.linear.some((name) => name.length === 1);
      if (
        quantity === 'infraredActiveIrreps'
          ? infrared
          : irrep.quadratic.length > 0
      ) {
        active++;
      }
    }
    return active;
  }
  if (!Number.isFinite(entry.order)) return null;
  if (quantity === 'properAxes') return properAxisCount(group);
  if (quantity === 'mirrorPlanes' || quantity === 'improperOperations') {
    let count = 0;
    for (const operation of operationsOf(group)) {
      if (
        quantity === 'mirrorPlanes'
          ? operation.kind === 'sigma'
          : operation.kind !== 'E' && operation.kind !== 'Cn'
      ) {
        count++;
      }
    }
    return count;
  }
  return null;
}

function spaceGroupCount(
  number: number,
  quantity: CountableQuantity,
): number | null {
  if (!Number.isInteger(number) || number < 1 || number > 230) return null;
  const setting = spaceGroup(number);
  if (quantity === 'generalPositions') return setting.multiplicity;
  if (quantity === 'settings') return spaceGroupSettings(number).length;
  if (quantity === 'latticePoints') {
    return centringTranslations(spaceGroupOperations(setting)).length;
  }
  return null;
}

function sum(values: readonly number[]): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}
