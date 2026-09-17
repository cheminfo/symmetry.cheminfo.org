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
import {
  Bond,
  StructureElement,
  StructureProperties,
} from 'molstar/lib/mol-model/structure.js';
import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';
import { lociLabel } from 'molstar/lib/mol-theme/label.js';

import { atomName } from './structureText.ts';

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
  if (StructureElement.Loci.is(loci)) return atomLabel(loci);
  if (Bond.isLoci(loci)) return atomLabel(Bond.toStructureElementLoci(loci));
  const label = stripMarkup(lociLabel(loci, { granularity: 'element' }));
  return label === '' ? null : label;
}

/**
 * The atoms a loci holds, in the site's own words.
 *
 * molstar names one after the row it parsed — `xyz | Model 0 | Instance 1_555 |
 * A | MOL 1 | O [idx 1]` — which is the address of a line in a file this site
 * wrote to hand it the atoms, and says nothing a student wants. The element and
 * which atom of the scene it is do: the two hydrogens of water can then be told
 * apart while an operation swaps them.
 *
 * @param loci - What the pointer rests on, an atom or the two ends of a bond.
 * @returns `O 1`, `Si 4 — O 8`, or `null` when the loci holds no atom.
 */
function atomLabel(loci: StructureElement.Loci): string | null {
  const names: string[] = [];
  StructureElement.Loci.forEachLocation(loci, (location) => {
    names.push(
      atomName(
        String(StructureProperties.atom.type_symbol(location)),
        StructureProperties.atom.sourceIndex(location),
      ),
    );
  });
  return names.length === 0 ? null : names.join(' — ');
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
