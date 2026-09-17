/**
 * Marking the questions whose object is a crystal or a pattern.
 *
 * A `place-atom` answer is marked on the structure it generates, not on the
 * coordinates it was typed as: several positions give rock salt, and every one
 * of them is right.
 */

import type { TestCaseResult, ValidationResult } from 'react-cheminfo/core';
import { failedValidation, finishValidation } from 'react-cheminfo/core';

import type {
  IdentifyPlaneGroupExercise,
  PlaceAtomExercise,
  PlacedAtom,
  SpaceGroupFactsExercise,
  SpaceGroupField,
} from '../../data/exercises/types.ts';
import { spaceGroup } from '../spaceGroups.ts';

import { canonicalPlaneGroup } from './names.ts';
import { checkConstraint, generateStructure } from './structure.ts';

/** Mark a plane-group name against the group that generated the drawing. */
export function validateIdentifyPlaneGroup(
  exercise: IdentifyPlaneGroupExercise,
  answer: string,
): ValidationResult {
  const namespace = exercise.pattern.namespace;
  const given = canonicalPlaneGroup(answer, namespace);
  if (given === null) {
    return failedValidation(
      `"${answer}" names no ${namespace} group. Write the IUC symbol, such as p4m, or the orbifold, such as *442.`,
    );
  }
  const wanted = exercise.pattern.group;
  const cases: TestCaseResult[] = [
    {
      passed: given === wanted,
      reason:
        given === wanted
          ? `${wanted}: right.`
          : `you answered ${given}; this pattern was drawn in ${wanted}`,
      actual: given,
    },
  ];
  for (const miss of exercise.nearMisses) {
    const tripped = given === canonicalPlaneGroup(miss.group, namespace);
    cases.push({
      passed: !tripped,
      reason: tripped ? miss.why : `not ${miss.group} — ${miss.why}`,
      actual: tripped ? miss.group : null,
    });
  }
  return finishValidation(cases);
}

/** Mark the facts, each read off the setting record. */
export function validateSpaceGroupFacts(
  exercise: SpaceGroupFactsExercise,
  fields: Readonly<Record<string, string>>,
): ValidationResult {
  const cases: TestCaseResult[] = [];
  for (const field of exercise.asked) {
    const written = (fields[field] ?? '').trim();
    if (written === '') {
      return failedValidation(`Answer every field: ${field} is empty.`, cases);
    }
    const wanted = spaceGroupFact(
      exercise.spaceGroupNumber,
      exercise.variant,
      field,
    );
    const passed = sameAnswer(written, wanted);
    cases.push({
      passed,
      reason: passed
        ? `${field}: ${String(wanted)}`
        : `you answered ${written}; ${field} is ${String(wanted)}`,
      actual: written,
    });
  }
  return finishValidation(cases);
}

/** One fact of one setting, read off the catalogue. */
export function spaceGroupFact(
  number: number,
  variant: number,
  field: SpaceGroupField,
): string | number | boolean {
  const setting = spaceGroup(number, variant);
  switch (field) {
    case 'number': {
      return setting.number;
    }
    case 'crystalSystem': {
      return setting.crystalSystem;
    }
    case 'centring': {
      return setting.centring;
    }
    case 'generalPositions': {
      return setting.multiplicity;
    }
    case 'centrosymmetric': {
      return setting.centrosymmetric;
    }
    case 'sohncke': {
      return setting.sohncke;
    }
    case 'crystalClass': {
      return setting.crystalClass;
    }
    case 'laueClass': {
      return setting.laueClass;
    }
    // no default
  }
}

/** Text is compared with case and spacing folded; a number as a number. */
function sameAnswer(
  written: string,
  wanted: string | number | boolean,
): boolean {
  if (typeof wanted === 'number') return Number(written) === wanted;
  if (typeof wanted === 'boolean') {
    const folded = written.trim().toLowerCase();
    if (folded === 'true' || folded === 'yes') return wanted;
    if (folded === 'false' || folded === 'no') return !wanted;
    return false;
  }
  return fold(written) === fold(wanted);
}

function fold(text: string): string {
  return text.trim().toLowerCase().replaceAll(/\s+/g, ' ');
}

/** Mark placed atoms on the structure the group generates from them. */
export function validatePlaceAtom(
  exercise: PlaceAtomExercise,
  atoms: readonly PlacedAtom[],
): ValidationResult {
  if (atoms.length !== exercise.asked.count) {
    return failedValidation(
      `Place ${exercise.asked.count} ${exercise.asked.element} atom${exercise.asked.count === 1 ? '' : 's'}: you placed ${atoms.length}.`,
    );
  }
  for (const atom of atoms) {
    if (atom.element !== exercise.asked.element) {
      return failedValidation(
        `This question asks for ${exercise.asked.element}, and you placed ${atom.element}.`,
      );
    }
  }
  const sites = generateStructure(exercise.spaceGroupNumber, exercise.variant, [
    ...exercise.given,
    ...atoms,
  ]);
  const cases: TestCaseResult[] = [];
  for (const constraint of exercise.constraints) {
    cases.push(checkConstraint(constraint, sites, exercise.cell));
  }
  return finishValidation(cases);
}
