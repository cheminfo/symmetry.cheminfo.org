/**
 * What a catalogue is, as data.
 *
 * Four catalogues — point groups, space groups, wallpaper groups, frieze groups
 * — are one page. What differs between them is a **descriptor**: the rows its
 * index lists, the capsules that narrow them, and a function turning an address
 * into an entry. Everything a descriptor returns is plain data, so the four are
 * unit-tested without a DOM and the rendering exists once.
 */

import type { SharePartId } from '../../share/parts.ts';
import type { CatalogueTabId } from '../../state/index.ts';
import type { CharacterTable } from '../../symmetry/characterTables.ts';
import type {
  CrystalOperation,
  UnitCell2D,
} from '../../symmetry/core/index.ts';
import type { PointOperation } from '../../symmetry/operations.ts';

/** Where a link out of a catalogue goes, before it is written as an address. */
export type CatalogueTarget =
  | { readonly page: 'molecules'; readonly moleculeId: string }
  | {
      readonly page: 'crystals';
      /** International Tables number, 1 to 230. */
      readonly number: number;
      /** Index into that number's own settings. */
      readonly setting: number;
    }
  | { readonly page: 'plane'; readonly planeGroup: string }
  | {
      readonly page: 'catalogue';
      readonly tab: CatalogueTabId;
      /** The entry, or `null` for the index. */
      readonly id: string | null;
      /** Which setting to open it on; space groups only. @default undefined */
      readonly setting?: number;
    };

/** One link, and the sentence saying what pressing it does. */
export interface CatalogueLink {
  readonly label: string;
  /** One clause under the label. @default undefined — the label stands alone */
  readonly detail?: string;
  readonly target: CatalogueTarget;
}

/** One entry as the index lists it. */
export interface CatalogueRow {
  /** The path segment: a slug, a number, a plane-group id. */
  readonly id: string;
  /** What the cell shows large: `C2v`, `P 21/c`, `p4g`. */
  readonly symbol: string;
  /** The line under it, already written out. */
  readonly detail: string;
  /** Heading of the block it sits under. */
  readonly group: string;
  /** Facet values this row holds, matched against {@link CatalogueFacet}. */
  readonly tags: readonly string[];
  /** Everything the search box matches, lowercased. */
  readonly search: string;
  /** A short flag to the right of the symbol. @default undefined — no flag */
  readonly badge?: string;
  /**
   * Which setting the entry opens on, for a catalogue whose entries have
   * several. @default undefined — the entry keeps whatever is in force
   */
  readonly setting?: number;
}

/** One row of filter capsules. */
export interface CatalogueFacet {
  readonly id: string;
  /** What the row is called, e.g. `System`. */
  readonly label: string;
  /** The capsules, in the order they are drawn. */
  readonly options: readonly CatalogueFacetOption[];
  /** What the capsule clearing the row reads, e.g. `Every system`. */
  readonly allLabel: string;
}

/** One capsule: the tag it selects, and what it reads. */
export interface CatalogueFacetOption {
  /** The value looked for in {@link CatalogueRow.tags}. */
  readonly value: string;
  readonly label: string;
  /** What the pointer is told when it rests on it. @default undefined */
  readonly title?: string;
}

/** One row of the definition grid at the top of an entry. */
export interface EntryFact {
  readonly label: string;
  readonly value: string;
  /** Whether the value is a symbol rather than prose. @default false */
  readonly mono?: boolean;
}

/** One cell of an entry table, keyed so React does not reorder it. */
export interface EntryTableRow {
  readonly key: string;
  readonly cells: readonly string[];
}

/** What a section of an entry draws. */
export type EntryBody =
  | { readonly kind: 'note'; readonly lines: readonly string[] }
  | {
      readonly kind: 'tokens';
      readonly tokens: readonly string[];
      readonly note?: string;
    }
  | {
      readonly kind: 'table';
      readonly headers: readonly string[];
      readonly rows: readonly EntryTableRow[];
      readonly note?: string;
    }
  | {
      readonly kind: 'characters';
      readonly table: CharacterTable;
      readonly note?: string;
    }
  | {
      readonly kind: 'links';
      readonly links: readonly CatalogueLink[];
      readonly note?: string;
    };

/** One block of an entry page, under its own heading. */
export interface EntrySection {
  readonly id: string;
  readonly title: string;
  /** The region `?hide=` names, or `null` when a link may never drop it. */
  readonly part: SharePartId | null;
  readonly body: EntryBody;
}

/** The picture at the top of an entry, when the catalogue draws one. */
export type EntryFigure =
  | {
      readonly kind: 'stereogram';
      readonly operations: readonly PointOperation[];
      readonly caption: string;
    }
  | {
      readonly kind: 'wallpaper';
      readonly operations: ReadonlyArray<CrystalOperation<2>>;
      readonly cell: UnitCell2D;
      readonly caption: string;
    }
  | {
      readonly kind: 'frieze';
      readonly operations: ReadonlyArray<CrystalOperation<2>>;
      readonly caption: string;
    };

/** One setting of a space group, as the picker offers it. */
export interface SettingChoice {
  readonly index: number;
  /** The setting's own symbol. */
  readonly label: string;
  /** What distinguishes it from its siblings: an origin, an axis, a cell. */
  readonly detail: string;
}

/** Everything an entry page shows. */
export interface CatalogueEntryView {
  readonly id: string;
  /** The symbol, large, at the top of the page. */
  readonly symbol: string;
  /** The line under it. */
  readonly subtitle: string;
  readonly figure: EntryFigure | null;
  readonly facts: readonly EntryFact[];
  /** The settings this entry is written in; empty for every catalogue but one. */
  readonly settings: readonly SettingChoice[];
  /** Which of {@link settings} is in force. */
  readonly settingIndex: number;
  /** Where a reader goes next: a workbench, or another catalogue. */
  readonly open: readonly CatalogueLink[];
  readonly sections: readonly EntrySection[];
}

/** One catalogue, as the page reads it. */
export interface CatalogueDescriptor {
  readonly tab: CatalogueTabId;
  /** The heading of the index. */
  readonly title: string;
  /** One sentence under it. */
  readonly intro: string;
  /** What the search box invites. */
  readonly searchHint: string;
  /** Every entry, in the order the index lists them. */
  readonly rows: readonly CatalogueRow[];
  readonly facets: readonly CatalogueFacet[];
  /**
   * The entry an address names.
   * @param id - The second path segment.
   * @param settingIndex - What `?setting=` asks for, already clamped to 0 or more.
   * @returns The entry, or `null` when nobody minted that address.
   */
  readonly entry: (
    id: string,
    settingIndex: number,
  ) => CatalogueEntryView | null;
}
