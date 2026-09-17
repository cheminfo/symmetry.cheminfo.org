import { expect, test } from 'vitest';

import { EXERCISES } from '../../../data/exercises/index.ts';
import {
  FIELD_LABEL,
  KIND_LABEL,
  QUANTITY_LABEL,
  fieldInput,
} from '../labels.ts';

test('every question the site asks has a word for what it asks', () => {
  for (const exercise of EXERCISES) {
    expect(KIND_LABEL[exercise.kind]).toBeTypeOf('string');
    expect(KIND_LABEL[exercise.kind]).not.toBe('');
  }
  expect(KIND_LABEL['assign-point-group']).toBe('assign');
  expect(KIND_LABEL['space-group-facts']).toBe('read');
});

test('every box a question opens is named in words a student reads', () => {
  const engineNames = new Set<string>();
  for (const exercise of EXERCISES) {
    if (exercise.kind === 'count') {
      for (const quantity of exercise.asked) {
        engineNames.add(quantity);
        expect(QUANTITY_LABEL[quantity]).toBeTypeOf('string');
      }
    }
    if (exercise.kind === 'space-group-facts') {
      for (const field of exercise.asked) {
        expect(FIELD_LABEL[field]).toBeTypeOf('string');
      }
    }
  }
  // The engine's own spelling never reaches the form.
  expect(engineNames.has('mirrorPlanes')).toBe(true);
  expect(QUANTITY_LABEL.mirrorPlanes).toBe('Mirror planes');
  expect(FIELD_LABEL.laueClass).toBe('Laue class');
});

test('a fact is answered in the kind of box the fact takes', () => {
  expect(fieldInput('number')).toStrictEqual({ kind: 'number' });
  expect(fieldInput('generalPositions')).toStrictEqual({ kind: 'number' });
  expect(fieldInput('crystalClass')).toStrictEqual({ kind: 'text' });
  expect(fieldInput('centrosymmetric')).toStrictEqual({
    kind: 'choice',
    options: ['yes', 'no'],
  });
  expect(fieldInput('centring')).toStrictEqual({
    kind: 'choice',
    options: ['P', 'A', 'B', 'C', 'I', 'F', 'R'],
  });
  expect(fieldInput('crystalSystem')).toStrictEqual({
    kind: 'choice',
    options: [
      'triclinic',
      'monoclinic',
      'orthorhombic',
      'tetragonal',
      'trigonal',
      'hexagonal',
      'cubic',
    ],
  });
});

test('a choice box offers the value the answer actually is', () => {
  for (const exercise of EXERCISES) {
    if (exercise.kind !== 'space-group-facts') continue;
    for (const field of exercise.asked) {
      const input = fieldInput(field);
      if (input.kind !== 'choice') continue;
      const wanted = exercise.answer[field];
      const written =
        typeof wanted === 'boolean' ? yesNo(wanted) : String(wanted);
      expect(input.options).toContain(written);
    }
  }
});

/** How a yes/no box writes what it holds. */
function yesNo(value: boolean): string {
  return value ? 'yes' : 'no';
}
