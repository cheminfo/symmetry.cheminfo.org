/** A CIF rewritten so that `cifParser` reads every value whole. */
export interface NormalizedCif {
  /** The text after `data_`; `''` when the file carries no block header. */
  readonly name: string;
  /** The same CIF, with the quoting `cif-to-json` mis-reads rewritten. */
  readonly text: string;
}

/**
 * Name the file's one data block, and repair the two quoting cases
 * `cif-to-json@2.0.0` reads wrong.
 *
 * It ends a quoted string at the first delimiter rather than at a delimiter
 * followed by whitespace, and it ends an unquoted value at any `#` rather than
 * at a `#` that opens a comment. Both drop the rest of the value silently, and
 * inside a loop that shortens a row, which makes the parser discard it. Both
 * are fixed by re-quoting the value here, before the parser sees it.
 * @param text - CIF file content.
 * @returns the block name and the rewritten text.
 * @throws when the file holds more than one `data_` block, which the parser
 *   would merge into one structure without saying so.
 */
export function normalizeCif(text: string): NormalizedCif {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  const names: string[] = [];
  let inTextField = false;

  for (const line of lines) {
    if (inTextField) {
      if (line.startsWith(';')) inTextField = false;
      out.push(line);
      continue;
    }
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      out.push(line);
      continue;
    }
    if (line.startsWith(';')) {
      inTextField = true;
      out.push(line);
      continue;
    }
    const header = /^data_(?<name>\S*)/i.exec(trimmed);
    if (header !== null) {
      const name = header.groups?.name ?? '';
      names.push(name);
      out.push(`data_${name}`);
      const rest = trimmed.slice(header[0].length).trim();
      if (rest !== '') {
        for (const rewritten of rewriteLine(rest)) out.push(rewritten);
      }
      continue;
    }
    for (const rewritten of rewriteLine(line)) out.push(rewritten);
  }

  if (names.length > 1) {
    throw new Error(
      `This file holds ${names.length} data blocks (${names.join(', ')}). Split it and load one structure at a time.`,
    );
  }
  return { name: names[0] ?? '', text: out.join('\n') };
}

/**
 * Rewrite one line so every value survives the parser.
 * @param line - the line, outside any text field.
 * @returns the lines to write in its place; more than one when a value had to
 *   become a semicolon text field.
 */
function rewriteLine(line: string): string[] {
  const lines: string[] = [];
  let result = '';
  let index = 0;

  while (index < line.length) {
    const char = line[index];
    if (char === ' ' || char === '\t') {
      result += char;
      index++;
      continue;
    }
    if (char === '#') {
      result += line.slice(index);
      break;
    }
    if (char === "'" || char === '"') {
      const close = closingQuote(line, index);
      if (close === -1) {
        result += line.slice(index);
        break;
      }
      const content = line.slice(index + 1, close);
      index = close + 1;
      const quoted = quote(content);
      if (quoted === null) {
        if (result.trim() !== '') lines.push(result.trimEnd());
        lines.push(`;${content}`, ';');
        result = '';
        continue;
      }
      result += quoted;
      continue;
    }
    let end = index;
    while (end < line.length && line[end] !== ' ' && line[end] !== '\t') end++;
    const token = line.slice(index, end);
    index = end;
    result += token.includes('#') ? (quote(token) ?? token) : token;
  }

  if (result.trim() !== '') lines.push(result);
  return lines.length > 0 ? lines : [line];
}

/**
 * Find where a quoted string ends, by the CIF 1.1 rule.
 * @param line - the line being read.
 * @param start - the index of the opening delimiter.
 * @returns the index of the closing delimiter, or -1 when the string is unclosed.
 */
function closingQuote(line: string, start: number): number {
  const delimiter = line[start];
  for (let i = start + 1; i < line.length; i++) {
    if (line[i] !== delimiter) continue;
    const next = line[i + 1];
    if (next === undefined || WHITESPACE.has(next)) return i;
  }
  return -1;
}

const WHITESPACE = new Set([' ', '\t']);

/**
 * Quote a value so the parser reads it whole.
 * @param content - the value, unquoted.
 * @returns the quoted value, or `null` when it carries both delimiters and only
 *   a semicolon text field can hold it.
 */
function quote(content: string): string | null {
  if (!content.includes("'")) return `'${content}'`;
  if (!content.includes('"')) return `"${content}"`;
  return null;
}
