import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import {
  latticeCell,
  wallpaperById,
  wallpaperOperations,
} from '../../../symmetry/planeGroups.ts';
import { operationsOf } from '../../../symmetry/pointGroups.ts';
import { ElementDiagram } from '../ElementDiagram.tsx';
import { PatternSvg } from '../PatternSvg.tsx';
import { Stereogram } from '../Stereogram.tsx';
import { MOTIFS, motifById } from '../motifs.ts';

/** The coset list of one of the seventeen, and the cell it is drawn in. */
function groupOf(id: string) {
  const group = wallpaperById(id);
  if (group === undefined) throw new Error(`no wallpaper group ${id}`);
  return {
    operations: wallpaperOperations(group),
    cell: latticeCell(group.lattice, 100),
  };
}

/** How many times a tag opens in the markup. */
function count(markup: string, tag: string): number {
  return markup.split(`<${tag}`).length - 1;
}

test('the tiling writes the motif once and references it per copy', () => {
  const { operations, cell } = groupOf('p4m');
  const markup = renderToStaticMarkup(
    <PatternSvg
      operations={operations}
      cell={cell}
      motif={motifById('flag')}
      tiles={2}
      title="p4m, tiled"
    />,
  );
  // Eight operations over four cells, and the motif drawn once in <defs>.
  expect(count(markup, 'use')).toBe(32);
  expect(count(markup, 'defs')).toBe(1);
  expect(markup).toContain('transform="matrix(100 0 0 100 0 0)"');
  expect(markup).toContain('viewBox="0 -200 200 200"');
  expect(markup).toContain('aria-label="p4m, tiled"');
  expect(markup).toContain('class="pattern-copy pattern-copy--mirrored"');
  expect(markup).toContain('data-shift="1,1"');
  expect(markup).toContain('<polygon class="pattern-cell"');
  expect(markup).not.toContain('pattern-domain');
});

test('the tiling can show the region the motif was drawn in', () => {
  const { operations, cell } = groupOf('p3');
  const markup = renderToStaticMarkup(
    <PatternSvg
      operations={operations}
      cell={cell}
      motif={motifById('comma')}
      tiles={1}
      showCell={false}
      showDomain
      title="p3, tiled"
    />,
  );
  expect(markup).toContain('points="0,0 50,0 25,43.30127 -25,43.30127"');
  expect(markup).not.toContain('pattern-cell');
});

test('a high-order group can shrink the motif into its own domain', () => {
  const { operations, cell } = groupOf('p6m');
  const markup = renderToStaticMarkup(
    <PatternSvg
      operations={operations}
      cell={cell}
      motif={motifById('wedge')}
      tiles={1}
      motifScale={0.5}
      title="p6m, tiled"
    />,
  );
  // The scale rides on the <defs> group, so every copy takes it and not one
  // transform changes. Twelve operations over the three cells a 120° rhombus
  // needs to fill its own bounding box.
  expect(markup).toContain(
    'transform="matrix(100 0 -50 86.60254 0 0) scale(0.5)"',
  );
  expect(count(markup, 'use')).toBe(36);
});

test('every motif the site ships is drawn, and an unknown id falls back', () => {
  expect(MOTIFS.map((motif) => motif.id)).toStrictEqual([
    'comma',
    'flag',
    'step',
    'wedge',
  ]);
  expect(motifById('nothing-like-this').id).toBe('comma');
  expect(motifById(null).id).toBe('comma');
  for (const motif of MOTIFS) {
    expect(motif.paths.length).toBeGreaterThanOrEqual(2);
    expect(motif.paths.some((path) => path.accent === true)).toBe(true);
  }
});

test('the element diagram draws the cell, the lines and the glyphs', () => {
  const { operations, cell } = groupOf('p4g');
  const markup = renderToStaticMarkup(
    <ElementDiagram
      operations={operations}
      cell={cell}
      cells={1}
      title="p4g, symmetry elements"
    />,
  );
  expect(count(markup, 'polygon')).toBe(1);
  expect(count(markup, 'line')).toBe(10);
  expect(count(markup, 'path')).toBe(9);
  expect(markup).toContain('class="element-line element-line--glide"');
  expect(markup).toContain('class="element-cell element-cell--primary"');
  expect(markup).toContain('data-order="4"');
  // The 8-unit padding keeps a glyph on the cell corner whole.
  expect(markup).toContain('viewBox="-8 -108 116 116"');
});

test('the stereogram draws the primitive circle heavy under a horizontal mirror', () => {
  const withMirror = renderToStaticMarkup(
    <Stereogram operations={operationsOf('D6h')} title="D6h" radius={100} />,
  );
  expect(withMirror).toContain(
    'class="stereo-primitive stereo-primitive--mirror"',
  );
  expect(withMirror).toContain('class="stereo-inversion"');
  expect(count(withMirror, 'circle class="stereo-point')).toBe(24);
  expect(count(withMirror, 'path class="stereo-comma')).toBe(12);

  const chiral = renderToStaticMarkup(
    <Stereogram operations={operationsOf('D3')} title="D3" />,
  );
  expect(chiral).toContain('class="stereo-primitive"');
  expect(chiral).not.toContain('stereo-comma');
  expect(chiral).not.toContain('stereo-inversion');
  expect(count(chiral, 'circle class="stereo-point')).toBe(6);
});

test('an inclined mirror is a circle clipped to the disc', () => {
  const markup = renderToStaticMarkup(
    <Stereogram operations={operationsOf('Oh')} title="Oh" radius={100} />,
  );
  expect(count(markup, 'circle class="stereo-mirror"')).toBe(4);
  expect(count(markup, 'line class="stereo-mirror"')).toBe(4);
  expect(markup).toContain('class="stereo-axis stereo-axis--improper"');
});
