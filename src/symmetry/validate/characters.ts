/**
 * Marking a character table: a blanked row, and a reduction.
 *
 * Both go back to the stored table. The row is checked cell by cell and then
 * against the two conditions that fix it on their own — orthogonality to every
 * row already printed, and Σ g χ² = h.
 */

import type { TestCaseResult, ValidationResult } from 'react-cheminfo/core';
import { failedValidation, finishValidation } from 'react-cheminfo/core';

import { characterTableOf } from '../../data/characterTables.ts';
import type {
  CharacterRowExercise,
  ReduceExercise,
} from '../../data/exercises/types.ts';

import { characterRow, reduceToIrreps } from './derive.ts';

/** Mark a blanked row: the characters, then orthogonality, then normalisation. */
export function validateCharacterRow(
  exercise: CharacterRowExercise,
  fields: Readonly<Record<string, string>>,
): ValidationResult {
  const table = characterTableOf(exercise.pointGroup);
  if (table === undefined) {
    return failedValidation(`No character table for ${exercise.pointGroup}.`);
  }
  const wanted = characterRow(exercise.pointGroup, exercise.irrep);
  const answer: number[] = [];
  const cases: TestCaseResult[] = [];
  for (const className of table.classes) {
    const written = (fields[className] ?? '').trim();
    const value = Number(written);
    if (written === '' || !Number.isFinite(value)) {
      return failedValidation(
        `Fill every column: ${className} is empty.`,
        cases,
      );
    }
    answer.push(value);
    const target = wanted[className] as number;
    cases.push({
      passed: value === target,
      reason:
        value === target
          ? `${className}: ${target}`
          : `you put ${value} under ${className}, and it is ${target}`,
      actual: String(value),
    });
  }
  let norm = 0;
  for (let index = 0; index < answer.length; index++) {
    const size = table.classSizes[index] as number;
    const value = answer[index] as number;
    norm += size * value * value;
  }
  for (const other of exercise.given) {
    const otherRow = characterRow(exercise.pointGroup, other);
    let dot = 0;
    for (let index = 0; index < answer.length; index++) {
      dot +=
        (table.classSizes[index] as number) *
        (answer[index] as number) *
        (otherRow[table.classes[index] as string] as number);
    }
    cases.push({
      passed: dot === 0,
      reason:
        dot === 0
          ? `orthogonal to ${other}`
          : `your row is not orthogonal to ${other}: Σ g χ χ(${other}) = ${dot}, and two different rows must give 0`,
      actual: String(dot),
    });
  }
  const order = table.classSizes.reduce((total, size) => total + size, 0);
  cases.push({
    passed: norm === order,
    reason:
      norm === order
        ? `Σ g χ² = ${order} = h`
        : `Σ g χ² = ${norm}, and it must equal the order ${order}`,
    actual: String(norm),
  });
  return finishValidation(cases);
}

/** Mark a reduction: one case per irrep, then the dimension sum. */
export function validateReduce(
  exercise: ReduceExercise,
  fields: Readonly<Record<string, string>>,
): ValidationResult {
  const table = characterTableOf(exercise.pointGroup);
  if (table === undefined) {
    return failedValidation(`No character table for ${exercise.pointGroup}.`);
  }
  const wanted = reduceToIrreps(exercise.pointGroup, exercise.gamma);
  const cases: TestCaseResult[] = [];
  let dimensions = 0;
  for (const irrep of table.irreps) {
    const written = (fields[irrep.mulliken] ?? '0').trim();
    const value = written === '' ? 0 : Number(written);
    if (!Number.isInteger(value) || value < 0) {
      return failedValidation(
        `${irrep.mulliken} must be a whole number, zero included.`,
        cases,
      );
    }
    dimensions += value * irrep.dimension;
    const target = wanted[irrep.mulliken] as number;
    cases.push({
      passed: value === target,
      reason:
        value === target
          ? `${irrep.mulliken}: ${target}`
          : `you put ${value} × ${irrep.mulliken}, and Γ holds ${target}`,
      actual: String(value),
    });
  }
  const total = exercise.gamma[0] as number;
  cases.push({
    passed: dimensions === total,
    reason:
      dimensions === total
        ? `the dimensions add up to χ(E) = ${total}`
        : `your irreps add up to ${dimensions} dimensions, and Γ(E) is ${total}`,
    actual: String(dimensions),
  });
  return finishValidation(cases);
}
