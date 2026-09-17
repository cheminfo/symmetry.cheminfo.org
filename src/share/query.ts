/**
 * A decoded query written back as a query string, for the `react-cheminfo`
 * readers that take one.
 *
 * Every entry is percent-encoded: `URLSearchParams` writes a space as `+`, and
 * the share helpers read a `+` back as a literal one on purpose.
 * @param query - Decoded query of the address.
 * @returns The query string, without its leading `?`.
 */
export function toSearch(query: Readonly<Record<string, string>>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  return parts.join('&');
}
