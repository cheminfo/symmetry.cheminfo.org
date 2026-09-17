import type { ReactNode } from 'react';
import { PagePart } from 'react-cheminfo/ui';

import { selectSetting } from '../../state/index.ts';
import { SymbolText } from '../molecules/index.ts';

import { CatalogueAnchor } from './CatalogueAnchor.tsx';
import { EntryBodyView } from './EntryBodyView.tsx';
import { EntryFigureView } from './EntryFigure.tsx';
import type { CatalogueDescriptor, CatalogueEntryView } from './types.ts';

/** What one entry page needs: the catalogue it belongs to, and the entry. */
export interface CatalogueEntryProps {
  readonly descriptor: CatalogueDescriptor;
  readonly view: CatalogueEntryView;
}

/**
 * One entry of a catalogue: an indexable page that **says** what the group is
 * rather than linking to it.
 *
 * Somebody searching `Pnma` or `C2v character table` lands here, so the
 * operations, the classes, the table, the positions and the absences are all on
 * the page. The rail beside it is the rest of the block the entry sits in, so a
 * reader can walk the catalogue without going back to the index.
 * @param props - See {@link CatalogueEntryProps}.
 * @returns The entry page.
 */
export function CatalogueEntry(props: CatalogueEntryProps) {
  const { descriptor, view } = props;
  const row = descriptor.rows.find((entry) => entry.id === view.id);
  const siblings = descriptor.rows.filter(
    (entry) => entry.group === row?.group && entry.id !== view.id,
  );
  return (
    <article className="catalogue-entry">
      <PagePart part="intro">
        <header className="catalogue-entry__head">
          <CatalogueAnchor
            className="catalogue-back"
            target={{ page: 'catalogue', tab: descriptor.tab, id: null }}
          >
            All {descriptor.title.toLowerCase()}
          </CatalogueAnchor>
          <h1>
            <EntrySymbol descriptor={descriptor} symbol={view.symbol} />
          </h1>
          <p className="catalogue-entry__lead">{view.subtitle}</p>
        </header>
      </PagePart>

      <div className="catalogue-entry__body">
        <div className="catalogue-entry__main">
          {view.figure === null ? null : (
            <EntryFigureView figure={view.figure} symbol={view.symbol} />
          )}

          {view.settings.length > 1 ? (
            <section className="catalogue-settings">
              <h2>Settings</h2>
              <p className="catalogue-caption">
                The same group on other axes, at another origin, or with another
                unique axis. The address names the number; this choice rides in
                the query.
              </p>
              <div className="chip-row__chips">
                {view.settings.map((setting) => (
                  <button
                    key={setting.index}
                    type="button"
                    className="chip"
                    aria-pressed={setting.index === view.settingIndex}
                    title={setting.detail}
                    onClick={() => {
                      selectSetting(setting.index);
                    }}
                  >
                    {setting.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <dl className="catalogue-facts">
            {view.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd className={fact.mono === true ? 'catalogue-mono' : ''}>
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          {view.open.length === 0 ? null : (
            <nav className="catalogue-open">
              {view.open.map((link) => (
                <CatalogueAnchor
                  key={link.label}
                  className="catalogue-open__link"
                  target={link.target}
                  title={link.detail}
                >
                  {link.label}
                </CatalogueAnchor>
              ))}
            </nav>
          )}

          {view.sections.map((section) => (
            <Section key={section.id} part={section.part}>
              <section className="catalogue-section" id={section.id}>
                <h2>{section.title}</h2>
                <EntryBodyView body={section.body} />
              </section>
            </Section>
          ))}
        </div>

        <PagePart part="catalogue">
          <aside className="catalogue-rail">
            <h2>{row?.group ?? descriptor.title}</h2>
            <ul>
              {siblings.map((sibling) => (
                <li key={sibling.id}>
                  <CatalogueAnchor
                    target={{
                      page: 'catalogue',
                      tab: descriptor.tab,
                      id: sibling.id,
                      ...(sibling.setting === undefined
                        ? {}
                        : { setting: sibling.setting }),
                    }}
                    title={sibling.detail}
                  >
                    <EntrySymbol
                      descriptor={descriptor}
                      symbol={sibling.symbol}
                    />
                  </CatalogueAnchor>
                </li>
              ))}
            </ul>
          </aside>
        </PagePart>
      </div>
    </article>
  );
}

/**
 * The entry's symbol: set with its subscript where the catalogue writes
 * Schoenflies, and left as it is written where it writes Hermann-Mauguin.
 */
function EntrySymbol(props: {
  descriptor: CatalogueDescriptor;
  symbol: string;
}): ReactNode {
  if (props.descriptor.schoenflies !== true) return props.symbol;
  return <SymbolText symbol={props.symbol} />;
}

/** A section a shared link may drop, or one it may not. */
function Section(props: {
  part: string | null;
  children: ReactNode;
}): ReactNode {
  if (props.part === null) return props.children;
  return <PagePart part={props.part}>{props.children}</PagePart>;
}
