/**
 * What the catalogue draws, rendered to markup.
 *
 * This file holds the pieces the two shells arrange; the shells themselves are
 * in `shell.test.tsx` beside it.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import { characterTableOf } from '../../../data/characterTables.ts';
import {
  friezeById,
  friezeOperations,
  latticeCell,
  wallpaperById,
  wallpaperOperations,
} from '../../../symmetry/planeGroups.ts';
import { operationsOf } from '../../../symmetry/pointGroups.ts';
import { CatalogueAnchor } from '../CatalogueAnchor.tsx';
import { CharacterTableView } from '../CharacterTableView.tsx';
import { EntryBodyView } from '../EntryBodyView.tsx';
import { EntryFigureView } from '../EntryFigure.tsx';
import { FriezeDiagram } from '../FriezeDiagram.tsx';
import { descriptorFor } from '../descriptors.ts';
import type { CatalogueDescriptor } from '../types.ts';

/** How many times a tag opens in the markup. */
function count(markup: string, tag: string): number {
  return markup.split(`<${tag}`).length - 1;
}

/** Every section body of one entry, rendered. */
function bodies(
  descriptor: CatalogueDescriptor,
  id: string,
  setting = 0,
): string {
  const view = descriptor.entry(id, setting);
  if (view === null) throw new Error(`no entry ${id}`);
  return view.sections
    .map((section) =>
      renderToStaticMarkup(<EntryBodyView body={section.body} />),
    )
    .join('');
}

test('a link carries the address as its href, so a crawler follows it', () => {
  const markup = renderToStaticMarkup(
    <CatalogueAnchor
      className="catalogue-back"
      target={{ page: 'catalogue', tab: 'space-groups', id: '14', setting: 3 }}
      title="P 1 1 21/a"
    >
      P21/c
    </CatalogueAnchor>,
  );
  expect(markup).toBe(
    '<a href="/space-groups/14?setting=3" class="catalogue-back" title="P 1 1 21/a">P21/c</a>',
  );
});

test('a token list keeps a repeated operation, which Oh has twelve of', () => {
  const markup = renderToStaticMarkup(
    <EntryBodyView
      body={{
        kind: 'tokens',
        tokens: ['E', 'C3', 'C3', 'C3'],
        note: 'three axes',
      }}
    />,
  );
  expect(count(markup, 'li>')).toBe(4);
  expect(markup).toContain('<p class="catalogue-caption">three axes</p>');
});

test('a table draws one row per condition, and a note when it has one', () => {
  const markup = renderToStaticMarkup(
    <EntryBodyView
      body={{
        kind: 'table',
        headers: ['Reflections', 'Present when'],
        rows: [
          { key: 'h0l', cells: ['h0l', 'l = 2n'] },
          { key: '0k0', cells: ['0k0', 'k = 2n'] },
        ],
      }}
    />,
  );
  expect(count(markup, 'tr')).toBe(3);
  expect(count(markup, 'th scope="col"')).toBe(2);
  expect(markup).toContain('<td>l = 2n</td>');
  expect(markup).not.toContain('catalogue-caption');
});

test('a note and a link list draw their own shapes', () => {
  const note = renderToStaticMarkup(
    <EntryBodyView body={{ kind: 'note', lines: ['One.', 'Two.'] }} />,
  );
  expect(note).toBe('<div class="catalogue-note"><p>One.</p><p>Two.</p></div>');
  const links = renderToStaticMarkup(
    <EntryBodyView
      body={{
        kind: 'links',
        links: [
          {
            label: 'Water — H2O',
            detail: 'Two mirrors that cross on the axis.',
            target: { page: 'molecules', moleculeId: 'water' },
          },
        ],
      }}
    />,
  );
  expect(links).toContain('href="/?molecule=water"');
  expect(links).toContain('Two mirrors that cross on the axis.');
});

test('a character table prints one column per class and one row per irrep', () => {
  const table = characterTableOf('C2v');
  if (table === undefined) throw new Error('no C2v table');
  const markup = renderToStaticMarkup(<CharacterTableView table={table} />);
  // The header row, plus one per irreducible representation.
  expect(count(markup, 'tr')).toBe(5);
  expect(markup).toContain('C2v, order 4');
  expect(markup).toContain('A1');
  // A character of −1 prints as −1, not as −1.000.
  expect(markup).toContain('>-1</td>');
  expect(markup).not.toContain('1.000');
});

test('a complex pair prints as the one real row its sum is, and says so', () => {
  const table = characterTableOf('C3');
  if (table === undefined) throw new Error('no C3 table');
  const markup = renderToStaticMarkup(<CharacterTableView table={table} />);
  expect(markup).toContain('pair');
  expect(markup).toContain(
    'A pair of complex representations, printed as the one real row their sum is.',
  );
  // C3 has 3 classes and 2 display rows: A, and the combined E.
  expect(count(markup, 'tr')).toBe(3);
});

test('a stereogram is drawn for a point group, with a caption', () => {
  const markup = renderToStaticMarkup(
    <EntryFigureView
      symbol="C2v"
      figure={{
        kind: 'stereogram',
        operations: operationsOf('C2v'),
        caption: 'Stereogram of C2v.',
      }}
    />,
  );
  expect(count(markup, 'svg')).toBe(1);
  expect(markup).toContain('aria-label="Stereogram of C2v"');
  expect(markup).toContain('<figcaption>Stereogram of C2v.</figcaption>');
});

test('a wallpaper group is drawn over its own cell', () => {
  const group = wallpaperById('p4g');
  if (group === undefined) throw new Error('no p4g');
  const markup = renderToStaticMarkup(
    <EntryFigureView
      symbol="p4g"
      figure={{
        kind: 'wallpaper',
        operations: wallpaperOperations(group),
        cell: latticeCell(group.lattice, 100),
        caption: 'The elements of p4g.',
      }}
    />,
  );
  expect(count(markup, 'svg')).toBe(1);
  expect(markup).toContain('aria-label="Symmetry elements of p4g"');
});

test('a frieze strip draws a line per element and a glyph per centre', () => {
  const group = friezeById('p2mg');
  if (group === undefined) throw new Error('no p2mg');
  const markup = renderToStaticMarkup(
    <FriezeDiagram
      operations={friezeOperations(group)}
      title="Symmetry elements of p2mg"
    />,
  );
  expect(count(markup, 'svg')).toBe(1);
  expect(count(markup, 'path')).toBeGreaterThan(0);
  expect(markup).toContain('element-line--glide');
  // The uprights marking where one period ends: three periods, four lines.
  expect(count(markup, 'line class="element-cell--primary"')).toBe(4);
});

test('a frieze group with nothing but a glide draws no rotation glyph', () => {
  const group = friezeById('p11g');
  if (group === undefined) throw new Error('no p11g');
  const markup = renderToStaticMarkup(
    <FriezeDiagram
      operations={friezeOperations(group)}
      title="Symmetry elements of p11g"
    />,
  );
  expect(count(markup, 'path')).toBe(0);
  expect(count(markup, 'line class="element-line element-line--glide"')).toBe(
    1,
  );
});

test('every section body of every entry renders without throwing', () => {
  let rendered = 0;
  for (const tab of [
    'point-groups',
    'space-groups',
    'wallpaper',
    'frieze',
  ] as const) {
    const descriptor = descriptorFor(tab);
    for (const row of descriptor.rows) {
      expect(
        bodies(descriptor, row.id, row.setting ?? 0),
        `${tab}/${row.id}`,
      ).not.toBe('');
      rendered += 1;
    }
  }
  expect(rendered).toBe(307);
});
