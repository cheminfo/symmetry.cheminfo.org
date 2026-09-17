/**
 * Reading one part of an entry, for the tests that check what a catalogue page
 * puts on screen. Two files share them, so they live beside both.
 */

import type { CatalogueEntryView, EntryBody } from '../types.ts';

/** One section of an entry, by the id the page anchors it on. */
export function section(view: CatalogueEntryView, id: string): EntryBody {
  const found = view.sections.find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`no section ${id}`);
  return found.body;
}

/** The value of one definition row. */
export function fact(
  view: CatalogueEntryView,
  label: string,
): string | undefined {
  return view.facts.find((entry) => entry.label === label)?.value;
}
