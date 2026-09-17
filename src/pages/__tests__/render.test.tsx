/**
 * The three pages that have no canvas: the catalogue shell, the plane
 * workbench and the cheatsheet.
 *
 * Each is rendered at the address the state puts it at, so what is asserted is
 * the page a reader is served — the entries under a catalogue, the motif copies
 * a group makes, the blocks that go on paper — and not that the component
 * mounts.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, test } from 'vitest';

import {
  REFERENCE_ROW_COUNT,
  REFERENCE_SECTIONS,
} from '../../data/reference/index.ts';
import {
  selectMotif,
  selectPlaneGroup,
  setCatalogueItem,
  setTiles,
} from '../../state/index.ts';
import { Catalogue } from '../Catalogue.tsx';
import { Cheatsheet } from '../Cheatsheet.tsx';
import { Plane } from '../Plane.tsx';

/** How many times a string occurs in the markup. */
function times(markup: string, text: string): number {
  return markup.split(text).length - 1;
}

beforeEach(() => {
  setCatalogueItem(null);
  selectMotif(null);
});

test('a catalogue address naming no entry serves the index of that catalogue', () => {
  const markup = renderToStaticMarkup(<Catalogue tab="wallpaper" />);

  expect(markup).toContain('<h1>Wallpaper groups</h1>');
  expect(times(markup, 'class="catalogue-cell"')).toBe(17);
  expect(markup).toContain('<a href="/wallpaper/p1">');
  expect(markup).toContain('<a href="/wallpaper/p6m">');
  expect(markup).toContain('Every lattice (17)');
  expect(markup).not.toContain('catalogue-entry');
});

test('a catalogue address naming an entry serves that entry, not the index', () => {
  setCatalogueItem('p31m');
  const markup = renderToStaticMarkup(<Catalogue tab="wallpaper" />);

  expect(markup).toContain('<h1>p31m</h1>');
  expect(markup).toContain(
    '<p class="catalogue-entry__lead">Wallpaper group 15 of 17 — hexagonal lattice, point group 3m, 6 operations per cell.</p>',
  );
  expect(markup).toContain('<h2>General positions</h2>');
  expect(markup).toContain('<h2>Symmetry elements</h2>');
  // The rail is the rest of its lattice block, and p31m is not in it.
  expect(markup).toContain('<h2>Hexagonal — equal axes at 120°</h2>');
  expect(times(markup, 'class="catalogue-index"')).toBe(0);
});

test('an entry id the catalogue does not hold falls back to its index', () => {
  // p4m is a wallpaper group, and the two namespaces are deliberately apart.
  setCatalogueItem('p4m');
  const markup = renderToStaticMarkup(<Catalogue tab="frieze" />);

  expect(markup).toContain('<h1>Frieze groups</h1>');
  expect(markup).toContain(
    '<p class="catalogue-missing">Nothing in this catalogue is called p4m. Here is the whole of it.</p>',
  );
  expect(times(markup, 'class="catalogue-cell"')).toBe(7);
  expect(markup).toContain('<a href="/frieze/p2mg">');
});

test('the plane workbench draws one motif copy per operation per cell', () => {
  selectPlaneGroup('p4m');
  setTiles(4);
  const markup = renderToStaticMarkup(<Plane />);

  expect(markup).toContain('<h1>Plane patterns</h1>');
  expect(markup).toContain(
    'aria-label="Wallpaper group p4m, tiled with comma"',
  );
  // p4m has 8 operations, and 4 × 4 cells are on screen: 128 copies.
  expect(markup).toContain(
    '8 copies per cell. Point at one to read the element that made it.',
  );
  expect(times(markup, '<use ')).toBe(128);
  // The element diagram never runs past three cells, however many are tiled.
  expect(markup).toContain('Symmetry elements, over 3 × 3 cells');
});

test('fewer tiles means fewer copies, and the group decides how many per cell', () => {
  selectPlaneGroup('p4g');
  setTiles(2);
  const p4g = renderToStaticMarkup(<Plane />);
  expect(p4g).toContain('aria-label="Wallpaper group p4g, tiled with comma"');
  expect(p4g).toContain('8 copies per cell.');
  expect(times(p4g, '<use ')).toBe(32);
  expect(p4g).toContain('Symmetry elements, over 2 × 2 cells');

  selectPlaneGroup('p1');
  const p1 = renderToStaticMarkup(<Plane />);
  expect(p1).toContain('aria-label="Wallpaper group p1, tiled with comma"');
  expect(p1).toContain('<dt>Operations</dt><dd>1 per cell</dd>');
  // p1 has one operation, so every copy on screen is the identity slid to
  // another cell. The oblique cell is sheared, so the tiler covers eight cell
  // positions to fill the same rectangle four square ones would.
  expect(times(p1, 'data-operation="0"')).toBe(8);
  expect(times(p1, 'data-operation="1"')).toBe(0);
  expect(times(p1, '<use ')).toBe(8);
});

test('a frieze group is drawn along a strip, and counted per period', () => {
  selectPlaneGroup('f:p2mg');
  setTiles(3);
  const markup = renderToStaticMarkup(<Plane />);

  expect(markup).toContain(
    'aria-label="Frieze group p2mg, repeated along its strip"',
  );
  // 4 operations over 3 periods.
  expect(markup).toContain(
    '4 copies per period. Point at one to read the element that made it.',
  );
  expect(times(markup, '<use ')).toBe(12);
  expect(markup).toContain('Symmetry elements, over 3 periods');
  expect(markup).toContain(
    '<h2 class="plane-panel-title">Operations of one period</h2>',
  );
  expect(markup).toContain(
    '<p class="plane-triplets">x,y · -x,y · x+1/2,-y · -x+1/2,-y</p>',
  );
});

test('an unknown plane group opens the workbench rather than an empty page', () => {
  selectPlaneGroup('p7m');
  setTiles(2);
  const markup = renderToStaticMarkup(<Plane />);

  expect(markup).toContain(
    'aria-label="Wallpaper group p4m, tiled with comma"',
  );
  expect(times(markup, '<use ')).toBe(32);
});

test('the cheatsheet prints eleven blocks and every one of its 121 lines', () => {
  const markup = renderToStaticMarkup(<Cheatsheet />);

  expect(REFERENCE_SECTIONS).toHaveLength(11);
  expect(REFERENCE_ROW_COUNT).toBe(121);
  expect(times(markup, 'class="reference-section')).toBe(11);
  expect(markup).toContain(
    '11 blocks, 121 lines: the operations, the flowchart, the character tables,',
  );
  // The chrome is kept off the paper, and the line that replaces it is not.
  expect(markup).toContain('<header class="sheet-head no-print">');
  expect(markup).toContain(
    '<p class="sheet-print-line">SymmeTry · symmetry.cheminfo.org — Beginner: operations and point groups · Intermediate: character tables · Advanced: crystals and patterns</p>',
  );
});
