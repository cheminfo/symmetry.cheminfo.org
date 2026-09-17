/**
 * What the catalogue draws, rendered to markup.
 *
 * This file holds the pieces the two shells arrange; the shells themselves are
 * in `shell.test.tsx` beside it.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import { requireCharacterTable } from '../../../symmetry/characterTables.ts';
import {
  friezeById,
  friezeOperations,
  latticeCell,
  wallpaperById,
  wallpaperOperations,
} from '../../../symmetry/planeGroups.ts';
import { operationDisplayNames } from '../../../symmetry/point/naming.ts';
import { operationsOf } from '../../../symmetry/pointGroups.ts';
import { analyseMolecule } from '../../molecules/assignment.ts';
import { CharacterTable, NoCharacterTable } from '../../molecules/index.ts';
import { resolveMolecule } from '../../molecules/library.ts';
import { CatalogueAnchor } from '../CatalogueAnchor.tsx';
import { EntryBodyView } from '../EntryBodyView.tsx';
import { EntryFigureView } from '../EntryFigure.tsx';
import { FriezeDiagram } from '../FriezeDiagram.tsx';
import { descriptorFor } from '../descriptors.ts';
import type { CatalogueDescriptor, EntryBody } from '../types.ts';

/** How many times a tag opens in the markup. */
function count(markup: string, tag: string): number {
  return markup.split(`<${tag}`).length - 1;
}

/** The character-table section of one point group, as its page holds it. */
function charactersOf(slug: string): EntryBody {
  const view = descriptorFor('point-groups').entry(slug, 0);
  if (view === null) throw new Error(`no point group ${slug}`);
  const found = view.sections.find((section) => section.id === 'characters');
  if (found === undefined) throw new Error(`no character section for ${slug}`);
  return found.body;
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
            label: 'Water',
            formula: 'H2O',
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

test('the catalogue prints the character table the workbench prints, byte for byte', () => {
  // What `/` renders for water, built the way `Molecules.tsx` builds it.
  const analysis = analyseMolecule(resolveMolecule('water'));
  const workbench = renderToStaticMarkup(
    <CharacterTable
      table={requireCharacterTable(analysis.detection.group)}
      schoenflies={analysis.group?.schoenflies ?? analysis.detection.group}
    />,
  );
  const catalogue = renderToStaticMarkup(
    <EntryBodyView body={charactersOf('c2v')} />,
  );

  expect(catalogue).toBe(workbench);
  // And it is the typeset table, not a second spelling of it: the order in the
  // header, the typographic minus, the raised powers of a basis function.
  expect(catalogue).toContain('<span>C<sub>2v</sub></span> (h = 4)');
  expect(catalogue).toContain('<td>\u22121</td>');
  expect(catalogue).toContain(
    '<td class="mol-table__functions">x², y², z²</td>',
  );
  expect(catalogue).not.toContain('catalogue-table--characters');
});

test('a complex pair carries the same footnote on both pages', () => {
  const catalogue = renderToStaticMarkup(
    <EntryBodyView body={charactersOf('c3')} />,
  );

  expect(catalogue).toBe(
    renderToStaticMarkup(
      <CharacterTable table={requireCharacterTable('C3')} schoenflies="C3" />,
    ),
  );
  expect(catalogue).toContain('<sup>‡</sup>');
  expect(catalogue).toContain(
    '‡ Two irreducible representations, complex conjugates of each other, printed as one row.',
  );
});

test("a group with no table says so in the site's one sentence", () => {
  const markup = renderToStaticMarkup(
    <EntryBodyView body={charactersOf('d6d')} />,
  );

  expect(markup).toBe(
    renderToStaticMarkup(<NoCharacterTable group="D6d" schoenflies="D6d" />),
  );
  expect(markup).toContain('This site ships no character table for D6d.');
});

test('an operation is set as a symbol, and never as a Cartesian axis', () => {
  const markup = renderToStaticMarkup(
    <EntryBodyView
      body={{
        kind: 'operations',
        names: operationDisplayNames(operationsOf('D6d')),
      }}
    />,
  );

  // S₁₂¹¹ and C₃², with the order below the letter and the power above it.
  expect(markup).toContain('<span>S<sub>12</sub><sup>11</sup></span>');
  expect(markup).toContain('<span>C<sub>3</sub><sup>2</sup></span>');
  // The six σd are numbered, because their axes lie at 15° to the cell and
  // have no direction indices. What they are never printed as is a vector.
  expect(markup).toContain('σ<sub>d</sub>');
  expect(markup).toContain('(6)</span>');
  expect(markup).not.toContain('0.259');
  expect(markup).not.toContain('⊥');
});

test('a cubic group names its axes by their direction indices', () => {
  const markup = renderToStaticMarkup(
    <EntryBodyView
      body={{
        kind: 'operations',
        names: operationDisplayNames(operationsOf('Td')),
      }}
    />,
  );

  expect(markup).toContain('>(111)</span>');
  expect(markup).toContain('>(11\u03040)</span>');
  expect(markup).not.toContain('0.577');
});

test('a molecule link sets its formula rather than writing it flat', () => {
  const markup = renderToStaticMarkup(
    <EntryBodyView
      body={{
        kind: 'links',
        links: [
          {
            label: 'Water',
            formula: 'H2O',
            detail: 'Two mirrors that cross on the axis.',
            target: { page: 'molecules', moleculeId: 'water' },
          },
        ],
      }}
    />,
  );

  expect(markup).toContain('Water — ');
  expect(markup).toContain('<sub>2</sub>');
  expect(markup).not.toContain('>H2O<');
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
  // Three hundred entries, each building its operations, its elements and its
  // table: it is the slowest test of the suite and needs longer than the
  // default when the machine is busy.
}, 30_000);
