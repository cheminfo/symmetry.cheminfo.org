/**
 * What the Share dialog can hand out of the reciprocal-space workbench: the
 * example on screen while it is as it opened, any other example, a crystal of
 * the lattice generator carried whole, or the page alone. A picture somebody
 * opened is too large for any link.
 */

import type { ShareExample, ShareOnScreen } from 'react-cheminfo/core';

import { RECIPROCAL_EXAMPLES } from '../reciprocal/examples.ts';
import { state } from '../state/index.ts';

/** The examples, as the dialog lists them, under the rows the picker shows. */
export const RECIPROCAL_SHARE_EXAMPLES: readonly ShareExample[] =
  RECIPROCAL_EXAMPLES.map((example) => ({
    id: example.id,
    name: example.name,
    group: example.group,
  }));

/**
 * What is on screen as the dialog opens.
 * @returns The example it opened on, whether it changed, and how a link
 * carries it.
 */
export function reciprocalOnScreen(): ShareOnScreen {
  const source = state.view.reciprocal.source.peek();
  if (source.kind === 'example') return { example: source.id, changed: false };
  if (source.kind === 'photo') {
    return { example: null, changed: true, screen: 'too-large' };
  }
  const { lattice } = source;
  return {
    example: source.from,
    changed: true,
    screen: {
      entries: [
        ['a', String(lattice.a)],
        ['b', String(lattice.b)],
        ['gamma', String(lattice.gamma)],
        ['basis', lattice.basis],
        ['crystal', String(lattice.crystal)],
        ['noise', String(lattice.noise)],
      ],
    },
  };
}
