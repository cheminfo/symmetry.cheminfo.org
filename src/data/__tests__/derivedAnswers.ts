/**
 * The assertion that matters: an authored answer equals what the engine says.
 *
 * Every branch here reaches past the data file to the detector, the character
 * tables, the space-group operations or the plane-group catalogue. A number
 * changed by hand in `src/data/exercises/` therefore fails the build.
 */

import { expect } from 'vitest';

import {
  composeOperations,
  indexOfOperation,
} from '../../symmetry/operations.ts';
import { operationsOf } from '../../symmetry/pointGroups.ts';
import {
  canonicalPlaneGroup,
  canonicalSchoenflies,
  characterRow,
  deriveCount,
  groupOperationNames,
  moleculePointGroup,
  operationByName,
  reduceToIrreps,
  selectMembership,
  spaceGroupFact,
} from '../../symmetry/validate.ts';
import { characterTableOf } from '../characterTables.ts';
import type { Exercise } from '../exercises/types.ts';

/** Hold one exercise's authored answer against the engine. */
export function assertAnswerIsDerived(exercise: Exercise): void {
  const where = exercise.id;
  switch (exercise.kind) {
    case 'assign-point-group': {
      expect(exercise.solution, where).toBe(
        moleculePointGroup(exercise.molecule),
      );
      for (const miss of exercise.nearMisses) {
        expect(
          canonicalSchoenflies(miss.group),
          `${where}: ${miss.group}`,
        ).not.toBeNull();
      }
      return;
    }
    case 'identify-plane-group': {
      const namespace = exercise.pattern.namespace;
      expect(exercise.solution, where).toBe(exercise.pattern.group);
      expect(canonicalPlaneGroup(exercise.solution, namespace), where).toBe(
        exercise.pattern.group,
      );
      for (const miss of exercise.nearMisses) {
        expect(
          canonicalPlaneGroup(miss.group, namespace),
          `${where}: ${miss.group}`,
        ).not.toBeNull();
      }
      return;
    }
    case 'select': {
      const derived = exercise.offered
        .filter((option) => selectMembership(exercise, option.id))
        .map((option) => option.id);
      expect(exercise.answer.toSorted(), where).toStrictEqual(
        derived.toSorted(),
      );
      return;
    }
    case 'count': {
      expect(Object.keys(exercise.answer).toSorted(), where).toStrictEqual(
        [...exercise.asked].toSorted(),
      );
      for (const quantity of exercise.asked) {
        expect(exercise.answer[quantity], `${where}: ${quantity}`).toBe(
          deriveCount(exercise.object, quantity),
        );
      }
      return;
    }
    case 'character-row': {
      const table = characterTableOf(exercise.pointGroup);
      expect(table, where).toBeDefined();
      expect(exercise.answer, where).toStrictEqual(
        characterRow(exercise.pointGroup, exercise.irrep),
      );
      expect(exercise.given, where).not.toContain(exercise.irrep);
      for (const row of exercise.given) {
        expect(
          characterRow(exercise.pointGroup, row),
          `${where}: ${row}`,
        ).toBeDefined();
      }
      return;
    }
    case 'reduce': {
      const table = characterTableOf(exercise.pointGroup);
      expect(exercise.gamma, where).toHaveLength(table?.classes.length ?? -1);
      expect(exercise.answer, where).toStrictEqual(
        reduceToIrreps(exercise.pointGroup, exercise.gamma),
      );
      return;
    }
    case 'space-group-facts': {
      expect(Object.keys(exercise.answer).toSorted(), where).toStrictEqual(
        [...exercise.asked].toSorted(),
      );
      for (const field of exercise.asked) {
        expect(exercise.answer[field], `${where}: ${field}`).toBe(
          spaceGroupFact(exercise.spaceGroupNumber, exercise.variant, field),
        );
      }
      return;
    }
    case 'multiply': {
      const names = groupOperationNames(exercise.pointGroup);
      const operations = operationsOf(exercise.pointGroup);
      expect(exercise.answer, where).toHaveLength(exercise.products.length);
      for (const offered of exercise.offered) {
        expect(names, `${where}: ${offered}`).toContain(offered);
      }
      for (let index = 0; index < exercise.products.length; index++) {
        const product = exercise.products[index];
        if (product === undefined) continue;
        const first = operationByName(exercise.pointGroup, product.a);
        const second = operationByName(exercise.pointGroup, product.b);
        expect(first, `${where}: ${product.a}`).toBeDefined();
        expect(second, `${where}: ${product.b}`).toBeDefined();
        if (first === undefined || second === undefined) continue;
        const composed = composeOperations(first, second);
        const wanted = names[indexOfOperation(operations, composed, 1e-6)];
        expect(
          exercise.answer[index],
          `${where}: ${product.a}∘${product.b}`,
        ).toBe(wanted);
        expect(exercise.offered, where).toContain(exercise.answer[index]);
      }
      return;
    }
    case 'place-atom': {
      expect(exercise.answer, where).toHaveLength(exercise.asked.count);
      expect(
        exercise.probes.filter((probe) => probe.shouldPass).length,
        where,
      ).toBeGreaterThanOrEqual(1);
      expect(
        exercise.probes.filter((probe) => !probe.shouldPass).length,
        where,
      ).toBeGreaterThanOrEqual(1);
    }
    // no default
  }
}
