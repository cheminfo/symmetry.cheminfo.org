/**
 * An operation's name as a canvas can draw it.
 *
 * The site holds a raised part behind a caret — `C3^2`, `σv^′`, `C2^″(1)` —
 * because the panels beside the view typeset what follows it above the line.
 * A molstar label is plain text and typesets nothing, so the caret is drawn as
 * itself: benzene's two-folds read `C2^′(1)` on the canvas while the list next
 * to them reads C₂′(1). Raising the characters here is what makes the two
 * agree, and it is the last step before the name leaves for the scene — the
 * names the rest of the site matches on are untouched.
 */

/**
 * Raise what a caret marks, and drop the caret.
 *
 * @param label - The name as the site holds it.
 * @returns The same name with each raised run set above the line: `C3²`,
 *   `σv′`, `C2″(1)`.
 */
export function plainName(label: string): string {
  return label.replaceAll(RAISED, (_match, raised: string) => raise(raised));
}

/** A caret and the run it raises: digits, and the primes already drawn high. */
const RAISED = /\^(?<raised>[\d′″]+)/gu;

/** The digits, above the line. A prime is already a raised glyph. */
const ABOVE: Record<string, string> = {
  0: '⁰',
  1: '¹',
  2: '²',
  3: '³',
  4: '⁴',
  5: '⁵',
  6: '⁶',
  7: '⁷',
  8: '⁸',
  9: '⁹',
};

function raise(run: string): string {
  let raised = '';
  for (const character of run) raised += ABOVE[character] ?? character;
  return raised;
}
