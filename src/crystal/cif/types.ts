/** A number read from a CIF, with the standard uncertainty the file wrote it with. */
export interface CifNumber {
  /** The value, with the parenthesised standard uncertainty removed. */
  readonly value: number;
  /**
   * The standard uncertainty, in the unit of `value`: `0.30475(3)` gives `0.00003`.
   * `null` when the token carried none.
   */
  readonly su: number | null;
  /** The token exactly as the file wrote it, e.g. `0.30475(3)`. */
  readonly raw: string;
}

/** The unit cell: three edges in ångström, three angles in degrees. */
export interface CrystalCell {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly alpha: number;
  readonly beta: number;
  readonly gamma: number;
}

/** The space group as the file names it, plus the number when the file gives one. */
export interface CrystalSpaceGroup {
  /** `_space_group_IT_number`, else `_symmetry_Int_Tables_number`. 1 to 230. */
  readonly number: number | null;
  /** The Hermann-Mauguin symbol, spaced as the file wrote it, e.g. `F m -3 m`. */
  readonly hm: string | null;
  /** The Hall symbol, e.g. `-F 4 2 3`. */
  readonly hall: string | null;
}

/** One entry of the `_atom_site` loop: an atom of the asymmetric unit. */
export interface CrystalSite {
  /** `_atom_site_label`, e.g. `Na1`. Unique within the file, and not an element. */
  readonly label: string;
  /**
   * The chemical symbol, from `_atom_site_type_symbol` with any charge removed,
   * else from the letters that open `label`.
   */
  readonly element: string;
  /** Fractional coordinate along **a**. */
  readonly x: number;
  /** Fractional coordinate along **b**. */
  readonly y: number;
  /** Fractional coordinate along **c**. */
  readonly z: number;
  /** `_atom_site_occupancy`, 1 when the file gives none. */
  readonly occupancy: number;
  /** `_atom_site_U_iso_or_equiv` in Å², or `null` when the file gives none. */
  readonly uiso: number | null;
}

/** Where the structure came from, as far as the file says. */
export interface CrystalSource {
  /** `_journal_paper_doi`. */
  readonly doi?: string;
  /** `_cod_database_code`, the Crystallography Open Database entry. */
  readonly cod?: string;
  /** `_chemical_name_mineral`, else `_chemical_name_common`, e.g. `Halite`. */
  readonly note?: string;
}

/** One crystal structure: the cell, the space group and the asymmetric unit. */
export interface CrystalStructure {
  /** The text after `data_`, e.g. `9008671`. */
  readonly name: string;
  /** `_chemical_formula_sum`, else `_chemical_formula_moiety`; `''` when absent. */
  readonly formula: string;
  readonly cell: CrystalCell;
  readonly spaceGroup: CrystalSpaceGroup;
  /** The operations the file carries, verbatim and in file order, when it carries any. */
  readonly symopsXyz: readonly string[];
  /** The asymmetric unit, in file order. */
  readonly sites: readonly CrystalSite[];
  readonly source: CrystalSource;
}
