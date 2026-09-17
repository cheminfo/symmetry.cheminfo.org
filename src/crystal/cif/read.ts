import { cifParser } from 'cif-to-json';
import { elementBySymbol } from 'react-cheminfo/core';

import { normalizeCif } from './normalize.ts';
import { parseCifNumber } from './number.ts';
import type { CifIndex, CifRowIndex } from './tags.ts';
import {
  HALL_TAGS,
  HM_TAGS,
  IT_NUMBER_TAGS,
  SYMOP_TAGS,
  indexCif,
  loopWith,
  rowTag,
  scalarTag,
} from './tags.ts';
import type {
  CrystalCell,
  CrystalSite,
  CrystalSource,
  CrystalSpaceGroup,
  CrystalStructure,
} from './types.ts';

/**
 * Read one crystal structure from a CIF.
 * @param text - CIF file content, one `data_` block.
 * @returns the structure, with every value converted from the strings
 *   `cif-to-json` returns.
 * @throws when the file holds more than one data block, carries no unit cell,
 *   or names an atom whose element cannot be read.
 */
export function readCif(text: string): CrystalStructure {
  const { name, text: normalized } = normalizeCif(text);
  const index = indexCif(cifParser(normalized));
  return {
    name,
    formula:
      scalarTag(index, ['_chemical_formula_sum', '_chemical_formula_moiety']) ??
      '',
    cell: readCell(index),
    spaceGroup: readSpaceGroup(index),
    symopsXyz: readSymops(index),
    sites: readSites(index),
    source: readSource(index),
  };
}

function readCell(index: CifIndex): CrystalCell {
  return {
    a: cellNumber(index, '_cell_length_a'),
    b: cellNumber(index, '_cell_length_b'),
    c: cellNumber(index, '_cell_length_c'),
    alpha: cellNumber(index, '_cell_angle_alpha'),
    beta: cellNumber(index, '_cell_angle_beta'),
    gamma: cellNumber(index, '_cell_angle_gamma'),
  };
}

function cellNumber(index: CifIndex, tag: string): number {
  const parsed = parseCifNumber(scalarTag(index, [tag]));
  if (parsed === null) {
    throw new Error(
      `This CIF has no unit cell: ${tag} is missing or is not a number.`,
    );
  }
  return parsed.value;
}

function readSpaceGroup(index: CifIndex): CrystalSpaceGroup {
  const parsed = parseCifNumber(scalarTag(index, IT_NUMBER_TAGS));
  const number = parsed?.value ?? null;
  return {
    number:
      number !== null &&
      Number.isInteger(number) &&
      number >= 1 &&
      number <= 230
        ? number
        : null,
    hm: scalarTag(index, HM_TAGS),
    hall: scalarTag(index, HALL_TAGS),
  };
}

function readSymops(index: CifIndex): string[] {
  const rows = loopWith(index, SYMOP_TAGS);
  if (rows === null) return [];
  const operations: string[] = [];
  for (const row of rows) {
    const xyz = rowTag(row, SYMOP_TAGS);
    if (xyz !== null) operations.push(xyz);
  }
  return operations;
}

function readSites(index: CifIndex): CrystalSite[] {
  const rows = loopWith(index, FRACT_X_TAGS);
  if (rows === null) return [];
  const sites: CrystalSite[] = [];
  for (const row of rows) sites.push(readSite(row));
  return sites;
}

function readSite(row: CifRowIndex): CrystalSite {
  const typeSymbol = rowTag(row, TYPE_SYMBOL_TAGS);
  const label = rowTag(row, LABEL_TAGS) ?? typeSymbol;
  if (label === null) {
    throw new Error(
      'An atom site of this CIF carries neither a label nor a type symbol.',
    );
  }
  const occupancy = parseCifNumber(rowTag(row, OCCUPANCY_TAGS));
  return {
    label,
    element: elementOf(typeSymbol, label),
    x: siteNumber(row, FRACT_X_TAGS, label),
    y: siteNumber(row, FRACT_Y_TAGS, label),
    z: siteNumber(row, FRACT_Z_TAGS, label),
    occupancy: occupancy?.value ?? 1,
    uiso: readUiso(row),
  };
}

function siteNumber(
  row: CifRowIndex,
  aliases: readonly string[],
  label: string,
): number {
  const parsed = parseCifNumber(rowTag(row, aliases));
  if (parsed === null) {
    throw new Error(
      `Atom site "${label}" has no fractional coordinate on ${aliases[0] ?? ''}.`,
    );
  }
  return parsed.value;
}

/**
 * Read the isotropic displacement parameter, in Å².
 *
 * A file that gives `_atom_site_B_iso_or_equiv` instead is converted with
 * `U = B / 8π²`, which is the definition of the two quantities.
 * @param row - the atom-site row.
 * @returns U_iso, or `null` when the file gives neither.
 */
function readUiso(row: CifRowIndex): number | null {
  const u = parseCifNumber(rowTag(row, U_ISO_TAGS));
  if (u !== null) return u.value;
  const b = parseCifNumber(rowTag(row, B_ISO_TAGS));
  return b === null ? null : b.value / (8 * Math.PI * Math.PI);
}

function elementOf(typeSymbol: string | null, label: string): string {
  const fromType = typeSymbol === null ? null : symbolOf(typeSymbol);
  if (fromType !== null) return fromType;
  const fromLabel = symbolOf(label);
  if (fromLabel !== null) return fromLabel;
  throw new Error(
    `Atom site "${label}" names no element: neither its type symbol nor its label opens with one.`,
  );
}

/**
 * Read the chemical symbol a CIF token opens with.
 *
 * A type symbol carries the oxidation state (`Na1+`, `Cl1-`) and a label
 * carries an index in whatever case the refinement wrote it (`NA1`, `CL2`), so
 * the letters are taken, recapitalised and checked against the periodic table.
 * @param token - a type symbol or an atom-site label.
 * @returns the symbol, or `null` when the letters name no element.
 */
function symbolOf(token: string): string | null {
  const letters = /^(?<letters>[A-Za-z]{1,2})/.exec(token)?.groups?.letters;
  if (letters === undefined) return null;
  for (let length = letters.length; length >= 1; length--) {
    const symbol =
      letters.charAt(0).toUpperCase() + letters.slice(1, length).toLowerCase();
    if (elementBySymbol(symbol) !== undefined) return symbol;
  }
  return null;
}

function readSource(index: CifIndex): CrystalSource {
  const source: { doi?: string; cod?: string; note?: string } = {};
  const doi = scalarTag(index, ['_journal_paper_doi']);
  if (doi !== null) source.doi = doi;
  const cod = scalarTag(index, ['_cod_database_code']);
  if (cod !== null) source.cod = cod;
  const note = scalarTag(index, [
    '_chemical_name_mineral',
    '_chemical_name_common',
  ]);
  if (note !== null) source.note = note;
  return source;
}

const FRACT_X_TAGS = ['_atom_site_fract_x', '_atom_site.fract_x'] as const;
const FRACT_Y_TAGS = ['_atom_site_fract_y', '_atom_site.fract_y'] as const;
const FRACT_Z_TAGS = ['_atom_site_fract_z', '_atom_site.fract_z'] as const;
const LABEL_TAGS = ['_atom_site_label', '_atom_site.label'] as const;
const TYPE_SYMBOL_TAGS = [
  '_atom_site_type_symbol',
  '_atom_site.type_symbol',
] as const;
const OCCUPANCY_TAGS = [
  '_atom_site_occupancy',
  '_atom_site.occupancy',
] as const;
const U_ISO_TAGS = [
  '_atom_site_u_iso_or_equiv',
  '_atom_site.u_iso_or_equiv',
] as const;
const B_ISO_TAGS = [
  '_atom_site_b_iso_or_equiv',
  '_atom_site.b_iso_or_equiv',
] as const;
