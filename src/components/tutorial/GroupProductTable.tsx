/**
 * The multiplication table of a point group.
 *
 * Every cell is composed, never looked up: the table is the proof that the set
 * is closed, so a transcribed one would prove nothing. Reading it is `row ∘
 * column` — the column's operation first, then the row's — which is the order
 * the operators are written in.
 */

import { Callout } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import {
  composeOperations,
  indexOfOperation,
} from '../../symmetry/operations.ts';
import { operationsOf } from '../../symmetry/pointGroups.ts';
import { groupOperationNames } from '../../symmetry/validate.ts';

/** What {@link GroupProductTable} needs. */
export interface GroupProductTableProps {
  /** `PointGroup.id` of a group with finitely many operations. */
  readonly group: string;
  /**
   * The largest group the grid is drawn for. Above it the table is 24 × 24 and
   * teaches nothing a student can read.
   * @default 12
   */
  readonly maximumOrder?: number;
}

/**
 * The h × h table of a group, composed cell by cell.
 * @param props - See {@link GroupProductTableProps}.
 * @returns The table, or a line saying the group is too large to print.
 */
export function GroupProductTable(props: GroupProductTableProps): ReactElement {
  const { group, maximumOrder = 12 } = props;
  const operations = operationsOf(group);
  const names = groupOperationNames(group);
  if (operations.length > maximumOrder) {
    return (
      <Callout intent="primary" icon="th">
        {`${group} has ${operations.length} operations, so its table has ${operations.length * operations.length} cells. Try it on a smaller group first.`}
      </Callout>
    );
  }

  return (
    <div className="product-table">
      <table className="bp6-html-table bp6-compact bp6-html-table-bordered">
        <thead>
          <tr>
            <th scope="col">{`${group}: row ∘ column`}</th>
            {names.map((name) => (
              <th key={name} scope="col">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {operations.map((first, row) => (
            <tr key={names[row]}>
              <th scope="row">{names[row]}</th>
              {operations.map((second, column) => {
                const composed = composeOperations(first, second);
                const index = indexOfOperation(operations, composed, TOLERANCE);
                return <td key={names[column]}>{names[index] ?? '—'}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Matrices built by different routes agree to about this, never exactly. */
const TOLERANCE = 1e-6;
