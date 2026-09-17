import { useMemo, useState } from 'react';
import { CapsuleFilter, PagePart } from 'react-cheminfo/ui';

import { SymbolText } from '../molecules/index.ts';

import { CatalogueAnchor } from './CatalogueAnchor.tsx';
import type { CatalogueFilterState } from './filter.ts';
import { EMPTY_FILTER, facetCounts, filterRows, groupRows } from './filter.ts';
import type { CatalogueDescriptor, CatalogueRow } from './types.ts';

/** What one catalogue index needs. */
export interface CatalogueIndexProps {
  readonly descriptor: CatalogueDescriptor;
  /** An address that named no entry, said back to the reader. @default undefined */
  readonly missing?: string;
}

/**
 * The browsable list of one catalogue: a search box, a row of capsules per
 * facet, and the entries in the blocks their catalogue sorts them into.
 *
 * The filter is not in the address on purpose. What a link hands out is an
 * entry — `/space-groups/225` — and a half-typed search in a shared URL is
 * noise a reader then has to clear.
 * @param props - See {@link CatalogueIndexProps}.
 * @returns The index.
 */
export function CatalogueIndex(props: CatalogueIndexProps) {
  const { descriptor, missing } = props;
  const [filter, setFilter] = useState<CatalogueFilterState>(EMPTY_FILTER);
  const blocks = useMemo(
    () => groupRows(filterRows(descriptor.rows, descriptor.facets, filter)),
    [descriptor, filter],
  );
  const kept = blocks.reduce((total, block) => total + block.rows.length, 0);
  return (
    <section className="catalogue-index">
      <PagePart part="intro">
        <header className="catalogue-index__head">
          <h1>{descriptor.title}</h1>
          <p>{descriptor.intro}</p>
        </header>
      </PagePart>

      {missing === undefined ? null : (
        <p className="catalogue-missing">
          Nothing in this catalogue is called {missing}. Here is the whole of
          it.
        </p>
      )}

      <div className="catalogue-controls">
        <input
          className="catalogue-search"
          type="search"
          value={filter.query}
          placeholder={descriptor.searchHint}
          aria-label={descriptor.searchHint}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          onChange={(event) => {
            setFilter({ ...filter, query: event.target.value });
          }}
        />
        {descriptor.facets.map((facet) => {
          const counts = facetCounts(
            descriptor.rows,
            descriptor.facets,
            filter,
            facet.id,
          );
          return (
            <div key={facet.id} className="chip-row">
              <span className="chip-row__label">{facet.label}</span>
              <CapsuleFilter
                multiple
                label={facet.label}
                values={filter.selected[facet.id] ?? []}
                allOption={{
                  label: facet.allLabel,
                  count: counts[facet.id] ?? 0,
                }}
                options={facet.options.map((option) => ({
                  value: option.value,
                  label: option.label,
                  count: counts[option.value] ?? 0,
                  ...(option.title === undefined
                    ? {}
                    : { title: option.title }),
                }))}
                onChange={(values) => {
                  setFilter({
                    ...filter,
                    selected: { ...filter.selected, [facet.id]: values },
                  });
                }}
              />
            </div>
          );
        })}
      </div>

      {kept === 0 ? (
        <p className="catalogue-note">
          Nothing matches. Clear the search, or a capsule.
        </p>
      ) : null}

      {blocks.map((block) => (
        <section key={block.group} className="catalogue-block">
          <h2>
            {block.group}
            <span className="catalogue-block__count">{block.rows.length}</span>
          </h2>
          <ul className="catalogue-grid">
            {block.rows.map((row) => (
              <Entry key={row.id} descriptor={descriptor} row={row} />
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}

/** One cell of the grid: the symbol, its flag, and the line under it. */
function Entry(props: { descriptor: CatalogueDescriptor; row: CatalogueRow }) {
  const { descriptor, row } = props;
  return (
    <li className="catalogue-cell">
      <CatalogueAnchor
        target={{
          page: 'catalogue',
          tab: descriptor.tab,
          id: row.id,
          ...(row.setting === undefined ? {} : { setting: row.setting }),
        }}
      >
        <span className="catalogue-cell__head">
          <span className="catalogue-cell__symbol">
            {descriptor.schoenflies === true ? (
              <SymbolText symbol={row.symbol} />
            ) : (
              row.symbol
            )}
          </span>
          {row.badge === undefined ? null : (
            <span className="catalogue-cell__badge">{row.badge}</span>
          )}
        </span>
        <span className="catalogue-cell__detail">{row.detail}</span>
      </CatalogueAnchor>
    </li>
  );
}
