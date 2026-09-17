import type { CifJson } from 'cif-to-json';

/** One `loop_` row, keyed on the lowercased tag of each column. */
export type CifRowIndex = ReadonlyMap<string, string>;

/** A parsed CIF, with every tag folded to lower case so lookups are case-blind. */
export interface CifIndex {
  /** Every scalar tag of the block. */
  readonly scalars: ReadonlyMap<string, string>;
  /** Every `loop_` of the block, in file order. */
  readonly loops: ReadonlyArray<readonly CifRowIndex[]>;
}

/**
 * Fold a parsed CIF so every tag can be looked up whatever case it was written in.
 *
 * CIF tags are case-insensitive and real files disagree: COD writes
 * `_symmetry_Int_Tables_number`, other producers write it all in lower case.
 * `cif-to-json` stores the tag verbatim, so the folding has to happen here.
 * @param parsed - the output of `cifParser`.
 * @returns the folded index.
 */
export function indexCif(parsed: CifJson): CifIndex {
  const scalars = new Map<string, string>();
  const loops: Array<readonly CifRowIndex[]> = [];
  for (const [tag, value] of Object.entries(parsed)) {
    if (typeof value === 'string') {
      scalars.set(tag.toLowerCase(), value);
      continue;
    }
    const rows: CifRowIndex[] = [];
    for (const source of value) {
      const row = new Map<string, string>();
      for (const [column, cell] of Object.entries(source)) {
        row.set(column.toLowerCase(), cell);
      }
      rows.push(row);
    }
    loops.push(rows);
  }
  return { scalars, loops };
}

/**
 * Read a scalar tag, trying each alias in turn.
 * @param index - the folded CIF.
 * @param aliases - the tags to try, lowercased, most current first.
 * @returns the trimmed value, or `null` when no alias carries one.
 */
export function scalarTag(
  index: CifIndex,
  aliases: readonly string[],
): string | null {
  for (const alias of aliases) {
    const value = index.scalars.get(alias);
    if (value !== undefined && value.trim() !== '') return value.trim();
  }
  return null;
}

/**
 * Find the loop that carries one of these columns.
 *
 * `cif-to-json` keys a loop on the longest common prefix of its column tags, so
 * the key changes with the optional columns a file happened to write: the same
 * operation list arrives as `_space_group_symop`, `_symmetry_equiv_pos` or the
 * full tag. Searching the columns instead of the key is immune to that.
 * @param index - the folded CIF.
 * @param aliases - the column tags to look for, lowercased.
 * @returns the loop's rows, or `null` when no loop carries any of them.
 */
export function loopWith(
  index: CifIndex,
  aliases: readonly string[],
): readonly CifRowIndex[] | null {
  for (const rows of index.loops) {
    const first = rows[0];
    if (first === undefined) continue;
    for (const alias of aliases) {
      if (first.has(alias)) return rows;
    }
  }
  return null;
}

/**
 * Read one cell of a loop row, trying each alias in turn.
 * @param row - the row.
 * @param aliases - the column tags to try, lowercased.
 * @returns the trimmed value, or `null` when no alias carries one.
 */
export function rowTag(
  row: CifRowIndex,
  aliases: readonly string[],
): string | null {
  for (const alias of aliases) {
    const value = row.get(alias);
    if (value !== undefined && value.trim() !== '') return value.trim();
  }
  return null;
}

/** The four tags a file may carry its symmetry operations under. */
export const SYMOP_TAGS = [
  '_space_group_symop_operation_xyz',
  '_space_group_symop.operation_xyz',
  '_symmetry_equiv_pos_as_xyz',
  '_symmetry_equiv_pos.as_xyz',
] as const;

/** The two tags a file may carry its International Tables number under. */
export const IT_NUMBER_TAGS = [
  '_space_group_it_number',
  '_symmetry_int_tables_number',
] as const;

/** The tags a file may carry its Hermann-Mauguin symbol under. */
export const HM_TAGS = [
  '_space_group_name_h-m_alt',
  '_space_group_name_h-m_full',
  '_symmetry_space_group_name_h-m',
  '_cod_original_sg_symbol_h-m',
] as const;

/** The tags a file may carry its Hall symbol under. */
export const HALL_TAGS = [
  '_space_group_name_hall',
  '_symmetry_space_group_name_hall',
] as const;
