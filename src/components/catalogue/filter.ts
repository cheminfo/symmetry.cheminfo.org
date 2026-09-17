/**
 * Narrowing a catalogue index: a search box and any number of capsule rows.
 *
 * Inside one row the capsules are alternatives, and between rows they are
 * conditions — `tetragonal or cubic`, **and** `I or F`, **and** `Sohncke`. That
 * is what a reader expects of a filter, and it is why each row's counts are
 * taken with that row's own selection lifted: a capsule showing 0 while its
 * neighbours are selected tells the reader nothing about what pressing it does.
 */

import type { CatalogueFacet, CatalogueRow } from './types.ts';

/** What the reader has typed and pressed. */
export interface CatalogueFilterState {
  /** What is in the search box. */
  readonly query: string;
  /** The capsules pressed, by facet id; an absent or empty row selects all. */
  readonly selected: Readonly<Record<string, readonly string[]>>;
}

/** Nothing typed, nothing pressed. */
export const EMPTY_FILTER: CatalogueFilterState = { query: '', selected: {} };

/** One block of the index: a heading and the rows under it. */
export interface CatalogueBlock {
  readonly group: string;
  readonly rows: readonly CatalogueRow[];
}

/**
 * The rows the filter keeps.
 * @param rows - Every row of the catalogue.
 * @param facets - The capsule rows offered.
 * @param state - What the reader has typed and pressed.
 * @returns The rows that pass, in the catalogue's own order.
 */
export function filterRows(
  rows: readonly CatalogueRow[],
  facets: readonly CatalogueFacet[],
  state: CatalogueFilterState,
): readonly CatalogueRow[] {
  const needle = state.query.trim().toLowerCase();
  const kept: CatalogueRow[] = [];
  for (const row of rows) {
    if (needle !== '' && !row.search.includes(needle)) continue;
    if (!passesFacets(row, facets, state, null)) continue;
    kept.push(row);
  }
  return kept;
}

/**
 * How many rows each capsule of one facet would keep.
 *
 * That facet's own selection is lifted, so the counts say what pressing a
 * capsule does rather than what the current selection already excluded.
 * @param rows - Every row of the catalogue.
 * @param facets - The capsule rows offered.
 * @param state - What the reader has typed and pressed.
 * @param facetId - Which row the counts are for.
 * @returns A count per capsule value, plus one under the facet's own id for the
 *   capsule that clears the row.
 */
export function facetCounts(
  rows: readonly CatalogueRow[],
  facets: readonly CatalogueFacet[],
  state: CatalogueFilterState,
  facetId: string,
): Readonly<Record<string, number>> {
  const needle = state.query.trim().toLowerCase();
  const counts: Record<string, number> = { [facetId]: 0 };
  const facet = facets.find((entry) => entry.id === facetId);
  if (facet === undefined) return counts;
  for (const option of facet.options) counts[option.value] = 0;
  for (const row of rows) {
    if (needle !== '' && !row.search.includes(needle)) continue;
    if (!passesFacets(row, facets, state, facetId)) continue;
    counts[facetId] = (counts[facetId] ?? 0) + 1;
    for (const option of facet.options) {
      if (row.tags.includes(option.value)) {
        counts[option.value] = (counts[option.value] ?? 0) + 1;
      }
    }
  }
  return counts;
}

/**
 * The rows in blocks, each under the heading its catalogue gave it, in the
 * order the headings first appear.
 * @param rows - The rows that passed the filter.
 * @returns One block per heading.
 */
export function groupRows(
  rows: readonly CatalogueRow[],
): readonly CatalogueBlock[] {
  const blocks: CatalogueBlock[] = [];
  const byGroup = new Map<string, CatalogueRow[]>();
  for (const row of rows) {
    const existing = byGroup.get(row.group);
    if (existing === undefined) {
      const created = [row];
      byGroup.set(row.group, created);
      blocks.push({ group: row.group, rows: created });
    } else {
      existing.push(row);
    }
  }
  return blocks;
}

/** Whether a row passes every facet but one, which `ignore` names. */
function passesFacets(
  row: CatalogueRow,
  facets: readonly CatalogueFacet[],
  state: CatalogueFilterState,
  ignore: string | null,
): boolean {
  for (const facet of facets) {
    if (facet.id === ignore) continue;
    const selected = state.selected[facet.id];
    if (selected === undefined || selected.length === 0) continue;
    let held = false;
    for (const value of selected) {
      if (row.tags.includes(value)) {
        held = true;
        break;
      }
    }
    if (!held) return false;
  }
  return true;
}
