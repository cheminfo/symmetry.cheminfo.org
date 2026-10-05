/**
 * What is under the pointer, as a line of text.
 *
 * Every axis, plane and centre is drawn with a label already — `C3 along
 * [111]`, `n glide at x = ¼` — but molstar's own UI is not mounted, so nothing
 * showed them. This turns the plugin's hover behaviour into that one string,
 * which the canvas renders itself.
 */

import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';
import {
  atomText,
  lociText,
  subscribeHover,
} from 'react-cheminfo/molstar/core';

/**
 * Report the label of whatever the pointer rests on.
 *
 * @param plugin - The molstar context.
 * @param listener - Called with the label, or `null` when the pointer leaves
 *   everything.
 * @returns The unsubscribe function.
 */
export function subscribeViewerHover(
  plugin: PluginContext,
  listener: (label: string | null) => void,
): () => void {
  return subscribeHover(plugin, (loci) => {
    // An atom is named `O 1` rather than by the row molstar parsed it from:
    // what it writes is the address of a line in a file this site handed it.
    listener(loci === null ? null : (atomText(loci) ?? lociText(loci)));
  });
}
