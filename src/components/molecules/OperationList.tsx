/**
 * Every operation of the group, grouped as a character table groups its
 * columns.
 *
 * Each one is a button, and pressing it plays that operation on the structure.
 * That is the whole argument for the panel: a class is not a piece of notation
 * but a set of operations that do the same thing seen from different sides, and
 * pressing the three members of `3σv` in turn is how that stops being a claim.
 */

import type { ReactElement } from 'react';

import { OperationLabel } from './OperationLabel.tsx';
import type { ClassMember, OperationClass } from './operationClasses.ts';
import { operationDescription } from './viewerOperation.ts';

import './molecules.css';

/** Props of {@link OperationList}. */
export interface OperationListProps {
  /** The classes, from `operationClasses`. */
  readonly classes: readonly OperationClass[];
  /** The operation being played, by name, or `null`. */
  readonly playing: string | null;
  /** Play one. Pressing the one already playing plays it again. */
  readonly onPlay: (name: string) => void;
}

/**
 * The operations, grouped by class.
 * @param props - See {@link OperationListProps}.
 * @returns One row per class, and a line saying what the last press did.
 */
export function OperationList(props: OperationListProps): ReactElement {
  const { classes, playing, onPlay } = props;
  if (classes.length === 0) {
    return (
      <p className="mol-note">
        A linear molecule has infinitely many operations: every rotation about
        the axis, and every plane holding it. There is no list to print.
      </p>
    );
  }
  const played = memberNamed(classes, playing);

  return (
    <div className="mol-panel">
      {classes.map((entry) => (
        <div className="mol-class" key={entry.header}>
          <div className="mol-class__header">
            <OperationLabel name={entry.header} />
          </div>
          <div className="mol-class__members">
            {entry.members.map((member) => (
              <button
                type="button"
                className="mol-operation"
                key={member.name}
                aria-pressed={member.name === playing}
                title={operationDescription(member.operation)}
                onClick={() => {
                  onPlay(member.name);
                }}
              >
                <OperationLabel name={member.name} />
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="mol-note">
        {played === undefined
          ? 'Press an operation to watch it act on the structure.'
          : operationDescription(played.operation)}
      </p>
    </div>
  );
}

/** The member of any class with this name. */
function memberNamed(
  classes: readonly OperationClass[],
  name: string | null,
): ClassMember | undefined {
  if (name === null) return undefined;
  for (const entry of classes) {
    for (const member of entry.members) {
      if (member.name === name) return member;
    }
  }
  return undefined;
}
