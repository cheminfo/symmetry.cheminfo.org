/**
 * The character table of a point group, as a textbook prints it.
 *
 * One component for every page that shows one — the workbench, a tutorial step,
 * an exercise — because a class header, a character and a basis function are
 * not things a page gets to spell its own way. What varies is what a page asks
 * for: the workbench wants the basis columns, since they are what say which
 * vibration is infrared active and which is Raman active; an exercise wants a
 * few rows and a blank one underneath, which is `children`.
 */

import type { ReactElement, ReactNode } from 'react';

import type { PointGroup } from '../../data/pointGroups.ts';
import { pointGroupBySlug } from '../../data/pointGroups.ts';
import type { CharacterTable as Table } from '../../symmetry/characterTables.ts';
import { displayRows, groupOrderOf } from '../../symmetry/characterTables.ts';

import { OperationLabel } from './OperationLabel.tsx';
import { SymbolText } from './SymbolText.tsx';
import { byClass } from './characterCells.ts';
import { formatCharacter, formatFunction } from './characters.ts';

import './molecules.css';

/** Props of {@link CharacterTable}. */
export interface CharacterTableProps {
  /** The table, from `characterTableOf`. */
  readonly table: Table;
  /**
   * How the group is written on screen, e.g. `C∞v`.
   * @default the table's own group name
   */
  readonly schoenflies?: string;
  /**
   * The Mulliken symbols to print, in the table's own order.
   * @default every row of the table
   */
  readonly rows?: readonly string[];
  /**
   * Whether the two basis-function columns are printed.
   * @default true
   */
  readonly basis?: boolean;
  /**
   * A row drawn under the printed ones — the one an exercise is filling in. It
   * is a `<tr>`, and it carries one cell per class.
   * @default undefined
   */
  readonly children?: ReactNode;
}

/** Marks a row a table prints as one and this site stores as two. */
const COMBINED = '‡';

/**
 * The table: the class headers, one row per irreducible representation, and
 * what each row carries.
 * @param props - See {@link CharacterTableProps}.
 * @returns The table, with its notes under it.
 */
export function CharacterTable(props: CharacterTableProps): ReactElement {
  const {
    table,
    schoenflies = table.group,
    rows,
    basis = true,
    children,
  } = props;
  const wanted = rows === undefined ? null : new Set(rows);
  const printed = displayRows(table).filter(
    (row) => wanted === null || wanted.has(row.mulliken),
  );
  const combined = printed.some((row) => row.combined);

  return (
    <div className="mol-panel">
      <div className="mol-table-scroll">
        <table className="mol-table">
          <thead>
            <tr>
              <th scope="col">
                <SymbolText symbol={schoenflies} />
                {` (h = ${groupOrderOf(table)})`}
              </th>
              {table.classes.map((label) => (
                <th key={label} scope="col">
                  {/* The same symbol the operations panel sets: a column read
                      as `2S8^3` here and as 2S₈³ there is two tables. */}
                  <OperationLabel name={label} />
                </th>
              ))}
              {basis && (
                <th scope="col" className="mol-table__functions">
                  Linear, rotations
                </th>
              )}
              {basis && (
                <th scope="col" className="mol-table__functions">
                  Quadratic
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {printed.map((row) => (
              <tr key={row.mulliken}>
                <th scope="row" className="mol-table__irrep">
                  <SymbolText symbol={row.mulliken} />
                  {row.combined && <sup>{COMBINED}</sup>}
                </th>
                {byClass(table.classes, row.characters).map((cell) => (
                  <td key={cell.className}>
                    {formatCharacter(cell.character)}
                  </td>
                ))}
                {basis && (
                  <td className="mol-table__functions">
                    {row.linear.map(formatFunction).join(', ')}
                  </td>
                )}
                {basis && (
                  <td className="mol-table__functions">
                    {row.quadratic.map(formatFunction).join(', ')}
                  </td>
                )}
              </tr>
            ))}
            {children}
          </tbody>
        </table>
      </div>
      {combined && (
        <p className="mol-table__note">
          {COMBINED} Two irreducible representations, complex conjugates of each
          other, printed as one row. They are degenerate in any real experiment.
        </p>
      )}
      {table.conventionNote !== undefined && (
        <p className="mol-table__note">{table.conventionNote}</p>
      )}
    </div>
  );
}

/** Props of {@link NoCharacterTable}. */
export interface NoCharacterTableProps {
  /** The `PointGroup.id` there is no table for. */
  readonly group: string;
  /**
   * How the group is written on screen, e.g. `D∞h`.
   * @default the id itself
   */
  readonly schoenflies?: string;
}

/**
 * What to say when there is no table to print: the two reasons are different,
 * and a student is owed the one that applies.
 * @param props - See {@link NoCharacterTableProps}.
 * @returns One sentence.
 */
export function NoCharacterTable(props: NoCharacterTableProps): ReactElement {
  const { group, schoenflies = group } = props;
  const entry: PointGroup | undefined = pointGroupBySlug(group.toLowerCase());
  const infinite = entry !== undefined && !Number.isFinite(entry.order);
  return (
    <p className="mol-note">
      {infinite
        ? `${schoenflies} has infinitely many irreducible representations: the rotation about the axis turns through every angle, so there is no finite table to print.`
        : `This site ships no character table for ${schoenflies}. Its operations, its elements and its assignment are all still exact.`}
    </p>
  );
}
