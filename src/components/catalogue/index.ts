/**
 * The four catalogues: point groups, space groups, wallpaper groups and frieze
 * groups, as one index component, one entry component and a descriptor each.
 *
 * These are the pages a search engine sends a reader to, so an entry says what
 * the group is — its operations, its classes, its table, its positions, its
 * absences — rather than linking to somewhere that does.
 */

export type { ClickIntent } from './anchorClick.ts';
export { handledHere } from './anchorClick.ts';
export { CatalogueAnchor } from './CatalogueAnchor.tsx';
export { CatalogueEntry } from './CatalogueEntry.tsx';
export type { CatalogueEntryProps } from './CatalogueEntry.tsx';
export { CatalogueIndex } from './CatalogueIndex.tsx';
export type { CatalogueIndexProps } from './CatalogueIndex.tsx';
export { CATALOGUES, descriptorFor } from './descriptors.ts';
export type { CatalogueBlock, CatalogueFilterState } from './filter.ts';
export { EMPTY_FILTER, facetCounts, filterRows, groupRows } from './filter.ts';
export { stripDiagram, stripShifts } from './friezeDiagram.ts';
export {
  cellElementLabels,
  cellLines,
  cellRotations,
} from './planeElementList.ts';
export type { StripDiagram, StripGlyph, StripLine } from './friezeDiagram.ts';
export { pointGroupEntry } from './pointGroupEntry.ts';
export { friezeEntry, wallpaperEntry } from './planeEntry.ts';
export { spaceGroupEntry } from './spaceGroupEntry.ts';
export { openTarget, routeOf, targetHref } from './target.ts';
export type {
  CatalogueDescriptor,
  CatalogueEntryView,
  CatalogueFacet,
  CatalogueFacetOption,
  CatalogueLink,
  CatalogueRow,
  CatalogueTarget,
  EntryBody,
  EntryFact,
  EntryFigure,
  EntrySection,
  EntryTableRow,
  SettingChoice,
} from './types.ts';
