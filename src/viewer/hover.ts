/**
 * What is under the pointer, as a line of text.
 *
 * Every axis, plane and centre is drawn with a label already — `C3 along
 * [111]`, `n glide at x = ¼` — but molstar's own UI is not mounted, so nothing
 * showed them. This turns the plugin's hover behaviour into that one string,
 * which the canvas renders itself.
 */

import type { Loci } from 'molstar/lib/mol-model/loci.js';
import { isEmptyLoci, isEveryLoci } from 'molstar/lib/mol-model/loci.js';
import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';
import { lociLabel } from 'molstar/lib/mol-theme/label.js';

/**
 * Report the label of whatever the pointer rests on.
 *
 * @param plugin - The molstar context.
 * @param listener - Called with the label, or `null` when the pointer leaves
 *   everything.
 * @returns The unsubscribe function.
 */
export function subscribeHover(
  plugin: PluginContext,
  listener: (label: string | null) => void,
): () => void {
  const subscription = plugin.behaviors.interaction.hover.subscribe((event) => {
    listener(labelOf(event.current.loci));
  });
  return () => {
    subscription.unsubscribe();
  };
}

/** The one line a loci is worth, or `null` when it is the background. */
function labelOf(loci: Loci): string | null {
  // The pointer over nothing reports an empty loci, whose label is the word
  // "Nothing" — a sentence, not an absence.
  if (isEmptyLoci(loci) || isEveryLoci(loci)) return null;
  const label = stripMarkup(lociLabel(loci, { granularity: 'element' }));
  return label === '' ? null : label;
}

/** Molstar's label providers return HTML, and the readout is plain text. */
function stripMarkup(label: string): string {
  return label
    .replaceAll(/<[^>]*>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll(/\s+/g, ' ')
    .trim();
}
