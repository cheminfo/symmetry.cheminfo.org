import type { CharacterTable } from '../../symmetry/characterTables.ts';
import { displayRows, groupOrderOf } from '../../symmetry/characterTables.ts';

import { formatCharacter } from './character.ts';

/** What a rendered character table needs. */
export interface CharacterTableViewProps {
  readonly table: CharacterTable;
}

/**
 * A character table as a textbook prints it: one column per class, one row per
 * irreducible representation, with the basis functions at the right.
 *
 * The twelve groups whose `E` is a conjugate pair are stored as two rows of
 * dimension one — which is what the orthogonality relations hold for — and
 * printed as the one real row their sum is. That row says so, because it is not
 * an irrep and nothing should be reduced against it.
 * @param props - The table to print.
 * @returns The table.
 */
export function CharacterTableView(props: CharacterTableViewProps) {
  const { table } = props;
  const rows = displayRows(table);
  return (
    <div className="catalogue-scroll">
      <table className="catalogue-table catalogue-table--characters">
        <caption>
          {table.group}, order {groupOrderOf(table)}
        </caption>
        <thead>
          <tr>
            <th scope="col">{table.group}</th>
            {table.classes.map((label) => (
              <th key={label} scope="col" className="catalogue-cell--number">
                {label}
              </th>
            ))}
            <th scope="col">Linear, rotations</th>
            <th scope="col">Quadratic</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.mulliken}>
              <th scope="row" className="catalogue-cell--symbol">
                {row.mulliken}
                {row.combined ? (
                  <span
                    className="catalogue-pair"
                    title="A pair of complex representations, printed as the one real row their sum is."
                  >
                    pair
                  </span>
                ) : null}
              </th>
              {row.characters.map((character, column) => (
                <td
                  key={table.classes[column] ?? String(column)}
                  className="catalogue-cell--number"
                >
                  {formatCharacter(character)}
                </td>
              ))}
              <td>{row.linear.join(', ')}</td>
              <td>{row.quadratic.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
