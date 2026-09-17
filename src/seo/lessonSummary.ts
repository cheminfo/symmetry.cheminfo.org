/**
 * The one sentence a tutorial step or an exercise is indexed under.
 *
 * Teaching prose carries `[[glossary]]` markers, which are for a reader hovering
 * a word and mean nothing to a crawler: a description that shipped them would
 * show the brackets in the search result. The markers are read with
 * `react-cheminfo`'s own parser rather than a second regular expression here,
 * so the two can never disagree about what a marker is.
 */

import { parseGlossaryMarkers } from 'react-cheminfo/core';

/**
 * Authored prose with its `[[term]]` and `[[term|text]]` markers unwrapped.
 * @param text - The prose as the step or exercise writes it.
 * @returns The same sentence, with every marker replaced by the words it shows.
 */
export function plainProse(text: string): string {
  let plain = '';
  for (const segment of parseGlossaryMarkers(text)) {
    plain += segment.text;
  }
  return plain.trim();
}

/**
 * The first sentence of a passage, for a page that is described by prose
 * written to be read in full on the page itself.
 * @param text - The prose, markers and all.
 * @returns Its first sentence, markers unwrapped, or the whole of it when it
 * carries no sentence end.
 */
export function firstSentence(text: string): string {
  const plain = plainProse(text);
  const end = /[.!?](?=\s|$)/.exec(plain);
  return end === null ? plain : plain.slice(0, end.index + 1);
}
