import { formatNumber } from './number.ts';
import type { CrystalSite, CrystalStructure } from './types.ts';

/**
 * Write a CIF for a structure: the cell, the space group, the operations the
 * structure carries and the atom-site loop.
 *
 * It writes the current tag names, and `readCif` reads it back to a structure
 * that is `toStrictEqual` the one written.
 * @param structure - the structure to write. Whitespace in `name` becomes `_`,
 *   because a CIF block code carries none.
 * @returns the file content, one `data_` block, ending with a newline.
 */
export function writeCif(structure: CrystalStructure): string {
  const { cell, formula, name, sites, source, spaceGroup, symopsXyz } =
    structure;
  const lines = [`data_${name.trim().replaceAll(/\s+/g, '_')}`];

  push(lines, '_chemical_formula_sum', formula);
  push(lines, '_chemical_name_mineral', source.note ?? null);
  push(lines, '_journal_paper_doi', source.doi ?? null);
  push(lines, '_cod_database_code', source.cod ?? null);
  push(lines, '_cell_length_a', formatNumber(cell.a));
  push(lines, '_cell_length_b', formatNumber(cell.b));
  push(lines, '_cell_length_c', formatNumber(cell.c));
  push(lines, '_cell_angle_alpha', formatNumber(cell.alpha));
  push(lines, '_cell_angle_beta', formatNumber(cell.beta));
  push(lines, '_cell_angle_gamma', formatNumber(cell.gamma));
  push(
    lines,
    '_space_group_IT_number',
    spaceGroup.number === null ? null : String(spaceGroup.number),
  );
  push(lines, '_space_group_name_H-M_alt', spaceGroup.hm);
  push(lines, '_space_group_name_Hall', spaceGroup.hall);

  writeSymops(lines, symopsXyz);
  writeSites(lines, sites);
  return `${lines.join('\n')}\n`;
}

function writeSymops(lines: string[], operations: readonly string[]): void {
  if (operations.length === 0) return;
  lines.push(
    'loop_',
    '_space_group_symop_id',
    '_space_group_symop_operation_xyz',
  );
  for (let i = 0; i < operations.length; i++) {
    lines.push(`${String(i + 1)} ${value(operations[i] ?? '')}`);
  }
}

function writeSites(lines: string[], sites: readonly CrystalSite[]): void {
  if (sites.length === 0) return;
  let withUiso = false;
  for (const site of sites) {
    if (site.uiso !== null) {
      withUiso = true;
      break;
    }
  }

  lines.push(
    'loop_',
    '_atom_site_label',
    '_atom_site_type_symbol',
    '_atom_site_fract_x',
    '_atom_site_fract_y',
    '_atom_site_fract_z',
    '_atom_site_occupancy',
  );
  if (withUiso) lines.push('_atom_site_U_iso_or_equiv');

  for (const site of sites) {
    const cells = [
      value(site.label),
      value(site.element),
      formatNumber(site.x),
      formatNumber(site.y),
      formatNumber(site.z),
      formatNumber(site.occupancy),
    ];
    if (withUiso) {
      cells.push(site.uiso === null ? '?' : formatNumber(site.uiso));
    }
    lines.push(cells.join(' '));
  }
}

/**
 * Add one `tag value` line, or nothing when the value is absent.
 * @param lines - the file being written.
 * @param tag - the CIF tag.
 * @param text - the value, or `null` or `''` to write no line.
 */
function push(lines: string[], tag: string, text: string | null): void {
  if (text === null || text === '') return;
  if (text.includes('\n') || (text.includes("'") && text.includes('"'))) {
    lines.push(tag, `;${text}`, ';');
    return;
  }
  lines.push(`${tag.padEnd(32)} ${value(text)}`);
}

/**
 * Quote a value when CIF would otherwise read it as something else.
 * @param text - the value.
 * @returns the field as it goes in the file.
 */
function value(text: string): string {
  if (text === '') return '?';
  const bare =
    !/[\s'"]/.test(text) &&
    !'_#$[];'.includes(text.charAt(0)) &&
    !MISSING.has(text);
  if (bare) return text;
  return text.includes("'") ? `"${text}"` : `'${text}'`;
}

const MISSING = new Set(['.', '?']);
