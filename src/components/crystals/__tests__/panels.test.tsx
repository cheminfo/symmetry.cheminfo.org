/**
 * The two panes around the crystal canvas: the controls under it, and CIF in
 * and out beside it.
 *
 * `probeViewerCapability` finds no browser window under vitest, so the canvas
 * itself is the no-WebGL message — which is exactly what a locked-down school
 * machine shows, and the reason everything else on the pane has to keep
 * working. The stack control and the layer chips are asserted here; the canvas
 * is the e2e suite's.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import { draftOf } from '../../../crystal/draft.ts';
import { structureOf } from '../../../data/structures/index.ts';
import { setDisplayFlag } from '../../../state/index.ts';
import { spaceGroup } from '../../../symmetry/spaceGroups.ts';
import type { ViewerScene } from '../../viewer/index.ts';
import { CifPanel } from '../CifPanel.tsx';
import { CrystalView } from '../CrystalView.tsx';
import { CRYSTAL_LAYERS } from '../crystalLabels.ts';

const FM3M = spaceGroup(225);
const HALITE = draftOf(structureOf('halite'), FM3M, 'Halite');

/** Nothing for a static render to draw: the canvas is not reached anyway. */
const EMPTY_SCENE: ViewerScene = {
  atoms: [],
  cell: null,
  repeat: [1, 1, 1],
  elements: [],
  labels: false,
};

/** How many times a string occurs in the markup. */
function times(markup: string, text: string): number {
  return markup.split(text).length - 1;
}

/** Nobody clicks a string. */
function ignore(): void {
  // Nothing.
}

test('the stack control offers one to four cells, and marks the one drawn', () => {
  const markup = renderToStaticMarkup(
    <CrystalView
      scene={EMPTY_SCENE}
      caption="Halite, 8 atoms per cell."
      supercell={2}
      onSupercell={ignore}
    />,
  );

  expect(markup).toContain('<span class="chip-row__label">Cells</span>');
  expect(markup).toContain('<span class="bp6-button-text">1×1×1</span>');
  expect(markup).toContain('<span class="bp6-button-text">4×4×4</span>');
  expect(times(markup, 'class="bp6-button-text">')).toBe(4);
  // Exactly the one on screen is active — 2×2×2, and not 1×1×1.
  expect(times(markup, 'bp6-button bp6-active')).toBe(1);
  expect(markup).toContain(
    '<button type="button" class="bp6-button bp6-active"><span class="bp6-button-text">2×2×2</span></button>',
  );
});

test('every layer of the crystal pane is a chip that says what it draws', () => {
  setDisplayFlag('screws', true);
  setDisplayFlag('glides', false);

  const markup = renderToStaticMarkup(
    <CrystalView
      scene={EMPTY_SCENE}
      caption="Halite, 8 atoms per cell."
      supercell={1}
      onSupercell={ignore}
    />,
  );

  expect(CRYSTAL_LAYERS).toStrictEqual([
    'unitCell',
    'axes',
    'screws',
    'mirrors',
    'glides',
    'inversion',
    'improper',
    'asymmetricUnit',
    'labels',
  ]);
  // Nine layers, plus the chip that switches every one of them off.
  expect(times(markup, '<button type="button" class="chip"')).toBe(9);
  expect(markup).toContain('>All off</button>');
  expect(markup).toContain(
    'aria-pressed="true" title="Screw axes, with the arrow of their translation.">Screw axes</button>',
  );
  expect(markup).toContain(
    'aria-pressed="false" title="Glide planes, dashed, with the translation they carry.">Glides</button>',
  );
  expect(markup).toContain(
    'aria-pressed="false" title="The part of the cell the symmetry generates the rest from.">Asymmetric unit</button>',
  );
});

test('a machine with no 3D is told so, and keeps every other control', () => {
  const markup = renderToStaticMarkup(
    <CrystalView
      scene={EMPTY_SCENE}
      caption="Halite, 8 atoms per cell."
      supercell={1}
      onSupercell={ignore}
    />,
  );

  expect(markup).toContain(
    '<h5 class="bp6-heading">No 3D on this machine</h5>',
  );
  expect(markup).toContain(
    'The operations, the character tables, the exercises and the cheatsheet all work without it.',
  );
  expect(markup).toContain('<span class="bp6-button-text">1×1×1</span>');
  expect(markup).toContain('>All off</button>');
});

test('the CIF panel takes a file by drop or by picker, and writes one back', () => {
  const markup = renderToStaticMarkup(
    <CifPanel draft={HALITE} setting={FM3M} onFile={ignore} problem={null} />,
  );

  expect(markup).toContain('<div class="xtl-drop">');
  expect(markup).toContain('<span>Drop a CIF here to build it.</span>');
  expect(markup).toContain(
    '<input type="file" accept=".cif,chemical/x-cif,text/plain" style="display:none" aria-label="Choose a CIF file"/>',
  );
  expect(markup).toContain(
    '<span class="bp6-button-text">or choose a file</span>',
  );
  expect(markup).toContain('<span class="bp6-button-text">Download CIF</span>');
  // Nothing went wrong, so nothing is said about it.
  expect(markup).not.toContain('bp6-intent-danger');
});

test('a file that could not be read says why, in the words the reader gets', () => {
  const markup = renderToStaticMarkup(
    <CifPanel
      draft={HALITE}
      setting={FM3M}
      onFile={ignore}
      problem="That file carries more than one data block."
    />,
  );

  expect(markup).toContain(
    '<h5 class="bp6-heading">That file could not be read</h5>That file carries more than one data block.',
  );
  expect(times(markup, 'bp6-intent-danger')).toBe(1);
  // The drop target is still there: the reader fixes the file and drops again.
  expect(markup).toContain('<span>Drop a CIF here to build it.</span>');
});
