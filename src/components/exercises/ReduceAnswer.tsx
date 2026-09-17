/**
 * How many of each irreducible representation a reducible one holds.
 *
 * Every row of the group gets a box, the ones that appear zero times included:
 * a form offering only the rows that occur would hand over half the answer.
 */

import { InputGroup } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import type { ReduceExercise } from '../../data/exercises/types.ts';
import { characterTableOf } from '../../symmetry/characterTables.ts';
import {
  CharacterTable,
  NoCharacterTable,
  byClass,
} from '../molecules/index.ts';

/** What {@link ReduceAnswer} needs. */
export interface ReduceAnswerProps {
  /** The question, for its group and its Γ. */
  readonly exercise: ReduceExercise;
  /** What is in each box, keyed by Mulliken symbol. */
  readonly value: Readonly<Record<string, string>>;
  /** Called with the whole record on every keystroke. */
  readonly onChange: (value: Readonly<Record<string, string>>) => void;
}

/** What Γ was built from, said in the words the basis is named in. */
const BASIS_TEXT: Record<ReduceExercise['basis'], string> = {
  stretch: 'the bond stretches',
  cartesian: 'the 3N Cartesian displacements',
  vibration: 'the vibrations',
  ligand: 'the ligand orbitals',
};

/**
 * The table, Γ under it, and a box per row.
 * @param props - See {@link ReduceAnswerProps}.
 * @returns The form.
 */
export function ReduceAnswer(props: ReduceAnswerProps): ReactElement {
  const { exercise, value, onChange } = props;
  const table = characterTableOf(exercise.pointGroup);
  if (table === undefined) {
    return <NoCharacterTable group={exercise.pointGroup} />;
  }

  return (
    <div className="answer-reduce">
      <CharacterTable table={table} basis={false}>
        <tr className="answer-row">
          <th scope="row">{`Γ (${BASIS_TEXT[exercise.basis]})`}</th>
          {byClass(table.classes, exercise.gamma).map((cell) => (
            <td key={cell.className}>{cell.character}</td>
          ))}
        </tr>
      </CharacterTable>

      <div className="answer-fields">
        {answerRows(table.irreps).map((mulliken) => (
          <label key={mulliken} className="answer-field">
            <span className="answer-field__label">{mulliken}</span>
            <InputGroup
              type="number"
              value={value[mulliken] ?? ''}
              placeholder="0"
              onValueChange={(entry) => {
                onChange({ ...value, [mulliken]: entry });
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * One box per Mulliken symbol, in table order.
 *
 * The twelve groups whose `E` is a conjugate pair store it as two rows sharing
 * one symbol, so the symbols are deduplicated: two boxes called `E` writing one
 * field would be two ways to answer the same question.
 * @param irreps - The stored rows of the table.
 * @returns The symbols, each once.
 */
function answerRows(
  irreps: ReadonlyArray<{ readonly mulliken: string }>,
): string[] {
  const seen = new Set<string>();
  const rows: string[] = [];
  for (const irrep of irreps) {
    if (seen.has(irrep.mulliken)) continue;
    seen.add(irrep.mulliken);
    rows.push(irrep.mulliken);
  }
  return rows;
}
