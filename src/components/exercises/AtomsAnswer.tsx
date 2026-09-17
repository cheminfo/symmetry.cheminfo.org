/**
 * Placing an atom in a cell, in fractional coordinates.
 *
 * What is marked is the structure the group generates, not the three numbers:
 * several positions give the same crystal, and every one of them is right. So
 * the form says what is already in the cell and what the answer has to satisfy,
 * and leaves the choice open.
 */

import { InputGroup } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import type {
  PlaceAtomExercise,
  PlacedAtom,
} from '../../data/exercises/types.ts';

/** What {@link AtomsAnswer} needs. */
export interface AtomsAnswerProps {
  /** The question, for the cell, the atoms given and the atoms asked for. */
  readonly exercise: PlaceAtomExercise;
  /** The atoms placed so far, one row each. */
  readonly value: readonly PlacedAtom[];
  /** Called with the whole list on every keystroke. */
  readonly onChange: (value: readonly PlacedAtom[]) => void;
}

/**
 * The atoms already in the cell, then a row per atom to place.
 * @param props - See {@link AtomsAnswerProps}.
 * @returns The form.
 */
export function AtomsAnswer(props: AtomsAnswerProps): ReactElement {
  const { exercise, value, onChange } = props;
  const rows = numbered(value);

  return (
    <div className="answer-atoms">
      <p className="answer-atoms__given">
        {`Already in the cell: ${exercise.given.map(describe).join(', ')}.`}
      </p>
      {rows.map((row) => (
        <div key={row.name} className="answer-atoms__row">
          <span className="answer-atoms__element">{row.name}</span>
          {AXES.map((axis) => (
            <InputGroup
              key={axis}
              type="number"
              value={String(row.atom[axis])}
              aria-label={`${row.name} ${axis}`}
              onValueChange={(entry) => {
                onChange(
                  replace(value, row.position, {
                    ...row.atom,
                    [axis]: Number(entry),
                  }),
                );
              }}
            />
          ))}
        </div>
      ))}
      <p className="answer-atoms__hint">
        Fractional coordinates, so ½ is 0.5. The whole orbit is generated and
        marked, not the three numbers.
      </p>
    </div>
  );
}

const AXES = ['x', 'y', 'z'] as const;

/**
 * One row per atom, named the way a crystallographer labels them — `Cl1`,
 * `Cl2` — which is also what keeps the rows apart while they are edited.
 */
function numbered(
  atoms: readonly PlacedAtom[],
): Array<{ name: string; atom: PlacedAtom; position: number }> {
  const rows: Array<{ name: string; atom: PlacedAtom; position: number }> = [];
  for (let position = 0; position < atoms.length; position++) {
    const atom = atoms[position] as PlacedAtom;
    rows.push({ name: `${atom.element}${position + 1}`, atom, position });
  }
  return rows;
}

function describe(atom: PlacedAtom): string {
  return `${atom.element} at (${atom.x}, ${atom.y}, ${atom.z})`;
}

function replace(
  value: readonly PlacedAtom[],
  index: number,
  atom: PlacedAtom,
): PlacedAtom[] {
  const next = [...value];
  next[index] = atom;
  return next;
}
