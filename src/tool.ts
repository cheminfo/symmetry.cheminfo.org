/**
 * What the site is to a page that frames its viewer — a drawing on
 * draw.cheminfo.org, a document on write.cheminfo.org — in the terms of the
 * host protocol (`react-cheminfo/host`).
 *
 * One value goes back, when a host asks: the figure, the crystal as it stands
 * on screen. One comes in: one of those figures, handed back on
 * `FIGURE_INPUT`, which opens on the viewer with its file, its cells and its
 * camera.
 */

import type {
  HostOutputs,
  LoadedInput,
  ToolInterface,
} from 'react-cheminfo/host';
import { FIGURE_INPUT, loadedFigureStates } from 'react-cheminfo/host';

import { openViewerFigure } from './components/cif/viewerSource.ts';
import { readCrystalFigure } from './figure/crystalFigure.ts';
import { pageFigureSvg } from './figure/figurePage.ts';

/** What every picture the site hands back carries, so it opens again. */
export { pageFigureStates as toolFigureStates } from './figure/figurePage.ts';

/** The site, as `hello` announces it. */
export const TOOL: ToolInterface = {
  name: 'symmetry',
  inputs: [FIGURE_INPUT],
  outputs: [{ key: 'figure', kind: 'image.svg' }],
};

/** What the site hands back: the figure, rendered the moment a host asks. */
export const TOOL_OUTPUTS: HostOutputs = {
  read: () => [],
  subscribe: () => stopListening,
  render: {
    figure: async () => {
      const svg = await pageFigureSvg();
      return svg === undefined
        ? undefined
        : { key: 'figure', kind: 'image.svg', value: { svg } };
    },
  },
};

/**
 * Take a document a host sends: one of the site's figures opens on the viewer
 * as it was drawn; a document without one changes nothing.
 * @param inputs - What the host's document gave the inputs.
 * @throws {Error} When the figure carries no crystal this version reads:
 * nothing changes then.
 */
export async function loadFromHost(
  inputs: readonly LoadedInput[],
): Promise<void> {
  const carried = await loadedFigureStates(inputs, TOOL.name);
  if (carried === undefined) return;
  openViewerFigure(readCrystalFigure(carried));
}

function stopListening(): void {
  // Nothing is ever sent unasked: the figure is made when a host asks.
}
