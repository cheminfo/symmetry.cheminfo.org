/**
 * One blank row of a character table, filled in against the printed ones.
 *
 * The boxes sit in the table itself rather than beside it, because the row is
 * fixed by the rows above it: orthogonality is something you read across the
 * columns, and a form that hid the table would be asking the student to
 * remember it instead.
 */

import { InputGroup } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import type { CharacterRowExercise } from '../../data/exercises/types.ts';
import { characterTableOf } from '../../symmetry/characterTables.ts';
import { CharacterTable, NoCharacterTable } from '../molecules/index.ts';

/** What {@link CharacterRowAnswer} needs. */
export interface CharacterRowAnswerProps {
  /** The question, for its group, its blank row and the rows it prints. */
  readonly exercise: CharacterRowExercise;
  /** What is in each box, keyed by class label. */
  readonly value: Readonly<Record<string, string>>;
  /** Called with the whole record on every keystroke. */
  readonly onChange: (value: Readonly<Record<string, string>>) => void;
}

/**
 * The given rows, with the blank one under them.
 * @param props - See {@link CharacterRowAnswerProps}.
 * @returns The table, the last row of which is the answer.
 */
export function CharacterRowAnswer(
  props: CharacterRowAnswerProps,
): ReactElement {
  const { exercise, value, onChange } = props;
  const table = characterTableOf(exercise.pointGroup);
  if (table === undefined) {
    return <NoCharacterTable group={exercise.pointGroup} />;
  }

  return (
    <CharacterTable table={table} rows={exercise.given} basis={false}>
      <tr className="answer-row">
        <th scope="row">{exercise.irrep}</th>
        {table.classes.map((className) => (
          <td key={className}>
            <InputGroup
              type="number"
              value={value[className] ?? ''}
              aria-label={`${exercise.irrep} under ${className}`}
              onValueChange={(entry) => {
                onChange({ ...value, [className]: entry });
              }}
            />
          </td>
        ))}
      </tr>
    </CharacterTable>
  );
}
