import { MF } from 'react-mf';

import {
  CharacterTable,
  NoCharacterTable,
  OperationLabel,
} from '../molecules/index.ts';

import { CatalogueAnchor } from './CatalogueAnchor.tsx';
import type { CatalogueLink, EntryBody } from './types.ts';

/** What one section of an entry draws. */
export interface EntryBodyViewProps {
  readonly body: EntryBody;
}

/**
 * One section of an entry page.
 *
 * Every catalogue describes its sections as data, so the five shapes a section
 * can take are drawn here once rather than four times over.
 * @param props - The section body.
 * @returns The section's content.
 */
export function EntryBodyView(props: EntryBodyViewProps) {
  const { body } = props;
  switch (body.kind) {
    case 'note': {
      return (
        <div className="catalogue-note">
          {body.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      );
    }
    case 'tokens': {
      return (
        <>
          <ul className="catalogue-tokens">
            {keyTokens(body.tokens).map((token) => (
              <li key={token.key}>{token.text}</li>
            ))}
          </ul>
          <Note text={body.note} />
        </>
      );
    }
    case 'table': {
      return (
        <>
          <div className="catalogue-scroll">
            <table className="catalogue-table">
              <thead>
                <tr>
                  {body.headers.map((header) => (
                    <th key={header} scope="col">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.rows.map((row) => (
                  <tr key={row.key}>
                    {row.cells.map((cell, column) => (
                      <td key={`${body.headers[column] ?? column}`}>
                        {column === body.symbolColumn ? (
                          <OperationLabel name={cell} />
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note text={body.note} />
        </>
      );
    }
    case 'operations': {
      return (
        <>
          <ul className="catalogue-operations">
            {keyTokens(body.names).map((token) => (
              <li key={token.key}>
                <OperationLabel name={token.text} />
              </li>
            ))}
          </ul>
          <Note text={body.note} />
        </>
      );
    }
    case 'characters': {
      // The one character table of the site, the one `/` prints. A second
      // spelling of a class header or of a character is a second idea of what
      // the table says, one click apart.
      return body.table === null ? (
        <NoCharacterTable group={body.group} schoenflies={body.schoenflies} />
      ) : (
        <CharacterTable table={body.table} schoenflies={body.schoenflies} />
      );
    }
    case 'links': {
      return (
        <>
          <ul className="catalogue-links">
            {body.links.map((link) => (
              <li key={link.label}>
                <CatalogueAnchor target={link.target}>
                  <LinkLabel link={link} />
                </CatalogueAnchor>
                {link.detail === undefined ? null : <span>{link.detail}</span>}
              </li>
            ))}
          </ul>
          <Note text={body.note} />
        </>
      );
    }
    // no default
  }
}

/**
 * Stable keys for a list whose entries repeat: `Oh` holds six operations
 * labelled `C4`, and an index key would be the only alternative.
 */
function keyTokens(
  tokens: readonly string[],
): ReadonlyArray<{ key: string; text: string }> {
  const seen = new Map<string, number>();
  const keyed: Array<{ key: string; text: string }> = [];
  for (const text of tokens) {
    const count = seen.get(text) ?? 0;
    seen.set(text, count + 1);
    keyed.push({ key: count === 0 ? text : `${text}#${count}`, text });
  }
  return keyed;
}

/** A link's label, with its formula set by `react-mf` rather than written flat. */
function LinkLabel(props: { link: CatalogueLink }) {
  const { label, formula } = props.link;
  if (formula === undefined) return <>{label}</>;
  return (
    <>
      {label} — <MF mf={formula} />
    </>
  );
}

function Note(props: { text?: string }) {
  if (props.text === undefined) return null;
  return <p className="catalogue-caption">{props.text}</p>;
}
