import type { CifNumber } from './types.ts';

/**
 * Read a CIF numeric token.
 *
 * `cif-to-json` never converts anything: every field arrives as a string, with
 * the standard uncertainty still attached and with `.` and `?` already
 * collapsed to the empty string.
 * @param token - the raw field, e.g. `0.30475(3)`, `90`, `.5`, `-1.5e2`, `.`, `?` or ``.
 * @returns the number, or `null` when the field is absent, unknown or not a number.
 */
export function parseCifNumber(
  token: string | null | undefined,
): CifNumber | null {
  if (token === null || token === undefined) return null;
  const raw = token.trim();
  if (MISSING.has(raw)) return null;
  const match = NUMBER.exec(raw);
  if (match?.groups === undefined) return null;

  const { sign, mantissa, digits, exponent } = match.groups;
  if (mantissa === undefined) return null;
  const power = exponent === undefined ? 0 : Number(exponent);
  const value = Number(`${sign ?? ''}${mantissa}e${power}`);
  if (!Number.isFinite(value)) return null;

  const dot = mantissa.indexOf('.');
  const decimals = dot === -1 ? 0 : mantissa.length - dot - 1;
  const su =
    digits === undefined ? null : Number(`${digits}e${power - decimals}`);
  return { value, su, raw };
}

/**
 * Write a CIF numeric token, re-attaching the standard uncertainty.
 * @param number - the value to write.
 * @returns `0.30475(3)` for `{ value: 0.30475, su: 0.00003 }`.
 */
export function formatCifNumber(number: CifNumber): string {
  const text = formatNumber(number.value);
  if (number.su === null) return text;
  const dot = text.indexOf('.');
  const decimals = dot === -1 ? 0 : text.length - dot - 1;
  return `${text}(${Math.round(number.su * 10 ** decimals)})`;
}

/**
 * Write a plain number the way a CIF field wants it.
 *
 * `String` gives the shortest text that reads back as the same double, so a
 * value written here and read by `parseCifNumber` is bit-identical.
 * @param value - the value to write.
 * @returns the field text.
 */
export function formatNumber(value: number): string {
  return Object.is(value, -0) ? '0' : String(value);
}

const MISSING = new Set(['', '.', '?']);

const NUMBER =
  /^(?<sign>[+-]?)(?<mantissa>\d+\.?\d*|\.\d+)(?:\((?<digits>\d+)\))?(?:[Ee](?<exponent>[+-]?\d+))?$/;
