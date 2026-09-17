/**
 * Marking the questions whose object is a molecule or a point group.
 *
 * Every verdict comes from `derive.ts`, so an answer is compared with what the
 * engine says and never with what the data file says.
 */

import type { TestCaseResult, ValidationResult } from 'react-cheminfo/core';
import { failedValidation, finishValidation } from 'react-cheminfo/core';

import type {
  AssignPointGroupExercise,
  CountExercise,
  MultiplyExercise,
  SelectExercise,
} from '../../data/exercises/types.ts';
import { splitObjectRef } from '../../data/glossary/types.ts';
import { composeOperations, indexOfOperation } from '../operations.ts';
import { operationsOf } from '../pointGroups.ts';
import { isSystematicallyAbsent, spaceGroup } from '../spaceGroups.ts';

import {
  deriveCount,
  groupClassLabels,
  isSohncke,
  moleculePointGroup,
} from './derive.ts';
import {
  canonicalSchoenflies,
  groupOperationNames,
  operationByName,
} from './names.ts';

/** Mark a typed Schoenflies symbol against the detector. */
export function validateAssignPointGroup(
  exercise: AssignPointGroupExercise,
  answer: string,
): ValidationResult {
  const given = canonicalSchoenflies(answer);
  if (given === null) {
    return failedValidation(
      `"${answer}" is not a Schoenflies symbol. Write it like C2v, D3h, Td or D∞h.`,
    );
  }
  const detected = moleculePointGroup(exercise.molecule);
  const cases: TestCaseResult[] = [
    {
      passed: given === detected,
      reason:
        given === detected
          ? `${detected}: right.`
          : `you answered ${given}; this structure is ${detected}`,
      actual: given,
    },
  ];
  for (const miss of exercise.nearMisses) {
    const tripped = given === canonicalSchoenflies(miss.group);
    cases.push({
      passed: !tripped,
      reason: tripped ? miss.why : `not ${miss.group} — ${miss.why}`,
      actual: tripped ? miss.group : null,
    });
  }
  return finishValidation(cases);
}

/** Mark a set of ticks: one case per checkbox, so both outcomes are tested. */
export function validateSelect(
  exercise: SelectExercise,
  chosen: readonly string[],
): ValidationResult {
  const ticked = new Set(chosen);
  const cases: TestCaseResult[] = [];
  for (const option of exercise.offered) {
    const belongs = selectMembership(exercise, option.id);
    const has = ticked.has(option.id);
    const name = option.label ?? option.id;
    cases.push({
      passed: has === belongs,
      reason:
        has === belongs
          ? option.reason
          : belongs
            ? `you left out ${name}: ${option.reason}`
            : `you ticked ${name}: ${option.reason}`,
      actual: has ? 'ticked' : 'not ticked',
    });
  }
  return finishValidation(cases);
}

/** Whether one offered item really belongs, asked of the engine. */
export function selectMembership(
  exercise: SelectExercise,
  item: string,
): boolean {
  const { id } = splitObjectRef(exercise.object);
  if (exercise.domain === 'operation') {
    return groupClassLabels(moleculePointGroup(id)).includes(item);
  }
  if (exercise.domain === 'spaceGroup') return isSohncke(Number(item));
  const hkl = item.trim().split(/\s+/).map(Number);
  return isSystematicallyAbsent(hkl, spaceGroup(Number(id)));
}

/** Mark one typed number per asked quantity. */
export function validateCount(
  exercise: CountExercise,
  fields: Readonly<Record<string, string>>,
): ValidationResult {
  const cases: TestCaseResult[] = [];
  for (const quantity of exercise.asked) {
    const written = (fields[quantity] ?? '').trim();
    const value = Number(written);
    if (written === '' || !Number.isInteger(value)) {
      return failedValidation('Type a whole number — 4, not "four".', cases);
    }
    const derived = deriveCount(exercise.object, quantity);
    if (derived === null) {
      return failedValidation(
        `${quantity} cannot be counted for ${exercise.object}.`,
      );
    }
    cases.push({
      passed: value === derived,
      reason:
        value === derived
          ? `${quantity}: ${derived}`
          : `you answered ${value}; ${quantity} is ${derived}`,
      actual: String(value),
    });
  }
  return finishValidation(cases);
}

/** Mark products by composing matrices, so `C3⁻¹` for `C3²` is right. */
export function validateMultiply(
  exercise: MultiplyExercise,
  answers: readonly string[],
): ValidationResult {
  const operations = operationsOf(exercise.pointGroup);
  const names = groupOperationNames(exercise.pointGroup);
  const cases: TestCaseResult[] = [];
  for (let index = 0; index < exercise.products.length; index++) {
    const product = exercise.products[index] as { a: string; b: string };
    const first = operationByName(exercise.pointGroup, product.a);
    const second = operationByName(exercise.pointGroup, product.b);
    if (first === undefined || second === undefined) {
      return failedValidation(
        `${exercise.pointGroup} has no operation ${product.a} or ${product.b}.`,
      );
    }
    const composed = composeOperations(first, second);
    const wanted = names[indexOfOperation(operations, composed, 1e-6)] ?? '?';
    const given = answers[index] ?? '';
    const chosen = operationByName(exercise.pointGroup, given);
    const passed =
      chosen !== undefined && indexOfOperation([composed], chosen, 1e-6) !== -1;
    cases.push({
      passed,
      reason: passed
        ? `${product.a} ∘ ${product.b} = ${wanted}`
        : `${product.a} ∘ ${product.b} is ${wanted}, not ${given === '' ? 'nothing' : given}`,
      actual: given === '' ? null : given,
    });
  }
  return finishValidation(cases);
}
