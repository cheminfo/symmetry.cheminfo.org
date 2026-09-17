/**
 * The two shells a catalogue address lands on: the browsable index, and one
 * entry of it.
 *
 * These are the site's indexable pages, so what is asserted here is what a
 * crawler and a reader both get off the wire — the headings, the counts, the
 * hrefs and the character table — rather than that the components render.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import type { CatalogueTabId } from '../../../state/index.ts';
import { spaceGroupSettings } from '../../../symmetry/spaceGroups.ts';
import { CatalogueEntry } from '../CatalogueEntry.tsx';
import { CatalogueIndex } from '../CatalogueIndex.tsx';
import { descriptorFor } from '../descriptors.ts';
import type { CatalogueDescriptor } from '../types.ts';

/** How many times a tag opens in the markup. */
function count(markup: string, tag: string): number {
  return markup.split(`<${tag}`).length - 1;
}

/** How many times a string occurs in the markup. */
function times(markup: string, text: string): number {
  return markup.split(text).length - 1;
}

/**
 * One row of a rendered character table, symbol first then its characters — in
 * the markup the shared `<CharacterTable>` writes, which is the same markup the
 * workbench at `/` and the tutorial print.
 */
function characterRow(
  letter: string,
  subscript: string,
  characters: readonly string[],
): string {
  const cells = characters.map((value) => `<td>${value}</td>`).join('');
  return `<th scope="row" class="mol-table__irrep"><span>${letter}<sub>${subscript}</sub></span></th>${cells}`;
}

/** One entry of one catalogue, rendered. */
function entry(tab: CatalogueTabId, id: string, setting = 0): string {
  const descriptor: CatalogueDescriptor = descriptorFor(tab);
  const view = descriptor.entry(id, setting);
  if (view === null) throw new Error(`no ${tab} entry ${id}`);
  return renderToStaticMarkup(
    <CatalogueEntry descriptor={descriptor} view={view} />,
  );
}

test('the point-group index lists all 53 groups, in eleven named blocks', () => {
  const markup = renderToStaticMarkup(
    <CatalogueIndex descriptor={descriptorFor('point-groups')} />,
  );

  expect(markup).toContain('<h1>Point groups</h1>');
  expect(count(markup, 'li class="catalogue-cell"')).toBe(53);
  expect(count(markup, 'section class="catalogue-block"')).toBe(11);
  expect(markup).toContain(
    '<h2>No axis at all<span class="catalogue-block__count">3</span></h2>',
  );
  expect(markup).toContain(
    '<h2>Linear molecules<span class="catalogue-block__count">2</span></h2>',
  );
  // Nothing matched, so no "clear the search" note is on the page.
  expect(markup).not.toContain('catalogue-note');
});

test('a cell is a real link, so a crawler reaches every group', () => {
  const markup = renderToStaticMarkup(
    <CatalogueIndex descriptor={descriptorFor('point-groups')} />,
  );

  expect(markup).toContain(
    '<a href="/point-groups/c1"><span class="catalogue-cell__head"><span class="catalogue-cell__symbol"><span>C<sub>1</sub></span></span><span class="catalogue-cell__badge">1</span></span><span class="catalogue-cell__detail">1 operation, 1 class, triclinic.</span></a>',
  );
  expect(markup).toContain('<a href="/point-groups/oh">');
});

test('every capsule carries the count it would leave, over the whole set', () => {
  const markup = renderToStaticMarkup(
    <CatalogueIndex descriptor={descriptorFor('point-groups')} />,
  );

  expect(markup).toContain('Every group (53)');
  expect(markup).toContain('One of the 32 (32)');
  expect(markup).toContain('Chiral (18)');
  expect(markup).toContain('Polar (17)');
  expect(markup).toContain('Centrosymmetric (15)');
  expect(markup).toContain('Has a molecule here (28)');
});

test('an address naming nothing is said back, and the whole set is shown', () => {
  const markup = renderToStaticMarkup(
    <CatalogueIndex descriptor={descriptorFor('wallpaper')} missing="p7m" />,
  );

  expect(markup).toContain(
    '<p class="catalogue-missing">Nothing in this catalogue is called p7m. Here is the whole of it.</p>',
  );
  expect(count(markup, 'li class="catalogue-cell"')).toBe(17);
  expect(markup).toContain('Every lattice (17)');
  expect(markup).toContain('hexagonal (5)');
});

test('the C2v entry prints its four irreps with their exact characters', () => {
  const markup = entry('point-groups', 'c2v');

  expect(markup).toContain('<h1><span>C<sub>2v</sub></span></h1>');
  // The order of the group is on the table, where a student reduces against it.
  expect(markup).toContain('<span>C<sub>2v</sub></span> (h = 4)');
  // Four classes, set as symbols — the same setting the operations panel uses.
  expect(markup).toContain('<th scope="col"><span>E</span></th>');
  expect(markup).toContain(
    '<th scope="col"><span>σ<sub>v</sub><span class="mol-operation__where">(xz)</span></span></th>',
  );
  expect(markup).toContain(
    '<th scope="col"><span>σ<sub>v′</sub><span class="mol-operation__where">(yz)</span></span></th>',
  );

  expect(markup).toContain(characterRow('A', '1', ['1', '1', '1', '1']));
  expect(markup).toContain(characterRow('A', '2', ['1', '1', '−1', '−1']));
  expect(markup).toContain(characterRow('B', '1', ['1', '−1', '1', '−1']));
  expect(markup).toContain(characterRow('B', '2', ['1', '−1', '−1', '1']));
  // The header row plus exactly four irreps, and no fifth.
  expect(count(markup, 'th scope="row" class="mol-table__irrep"')).toBe(4);
  // The basis functions, which is what the table is read for, with the powers
  // raised rather than written on the line.
  expect(markup).toContain(
    '<td class="mol-table__functions">z</td><td class="mol-table__functions">x², y², z²</td>',
  );
  expect(markup).toContain(
    '<td class="mol-table__functions">y, Rx</td><td class="mol-table__functions">yz</td>',
  );
});

test('the C2v entry says what the group is before it offers a workbench', () => {
  const markup = entry('point-groups', 'c2v');

  expect(markup).toContain(
    '<p class="catalogue-entry__lead">Order 4, 4 classes — one of the 32 crystal classes, orthorhombic. Achiral and polar.</p>',
  );
  expect(markup).toContain('<dt>Hermann-Mauguin</dt>');
  expect(markup).toContain(
    '<dt>Polarity</dt><dd class="">polar — one direction is left free</dd>',
  );
  expect(markup).toContain(
    '<a href="/point-groups" class="catalogue-back">All point groups</a>',
  );
  // The rail is the rest of the block, so the reader walks on without going back.
  expect(markup).toContain('<a href="/point-groups/c3v"');
});

test('a group with no character table prints the note, and does not crash', () => {
  for (const id of [
    'c7',
    'c8',
    'c7v',
    'c8v',
    'c5h',
    'd7',
    'd8',
    'd7h',
    'd8h',
    'd6d',
  ]) {
    const markup = entry('point-groups', id);
    expect(markup, id).toContain('<h2>Character table</h2>');
    expect(markup, id).toContain('This site ships no character table for');
    expect(count(markup, 'table class="mol-table"'), id).toBe(0);
    // The operations and the classes are still there, which is the point of
    // showing a page at all.
    expect(markup, id).toContain('<h2>Operations</h2>');
    expect(markup, id).toContain('<h2>Classes</h2>');
  }
});

test('C7 prints its seven operations and its seven one-member classes', () => {
  const markup = entry('point-groups', 'c7');

  expect(markup).toContain('<h1><span>C<sub>7</sub></span></h1>');
  // Set as symbols, so a power is above the letter rather than after a caret.
  expect(markup).toContain(
    '<li><span>E</span></li><li><span>C<sub>7</sub></span></li><li><span>C<sub>7</sub><sup>2</sup></span></li><li><span>C<sub>7</sub><sup>3</sup></span></li><li><span>C<sub>7</sub><sup>4</sup></span></li><li><span>C<sub>7</sub><sup>5</sup></span></li><li><span>C<sub>7</sub><sup>6</sup></span></li>',
  );
  expect(markup).toContain(
    'Every one of the 7 operations, closed from the generators, with the principal axis along z.',
  );
  expect(markup).toContain(
    '<dd class="">none — not one of the 32 crystal classes</dd>',
  );
  expect(markup).toContain(
    '<p>The library holds no molecule in this group.</p>',
  );
});

test('a space group with several settings offers each of them as a chip', () => {
  const markup = entry('space-groups', '14', 0);

  expect(markup).toContain('<h2>Settings</h2>');
  // Number 14 carries nine settings — three cell choices on each of three
  // unique axes — and exactly the open one is pressed.
  expect(spaceGroupSettings(14)).toHaveLength(9);
  expect(count(markup, 'button type="button" class="chip"')).toBe(9);
  expect(times(markup, 'aria-pressed="true"')).toBe(1);
  expect(markup).toContain(
    '<button type="button" class="chip" aria-pressed="true" title="unique axis b">P 1 21/c 1</button>',
  );
  expect(markup).toContain(
    '<button type="button" class="chip" aria-pressed="false" title="unique axis a">P 21/c 1 1</button>',
  );
  expect(markup).toContain(
    'The same group on other axes, at another origin, or with another unique axis.',
  );
});

test('a space group with one setting offers no settings section at all', () => {
  const markup = entry('space-groups', '225', 0);

  expect(markup).toContain('<h1>Fm-3m</h1>');
  expect(markup).not.toContain('<h2>Settings</h2>');
  expect(markup).toContain('<h2>General positions</h2>');
});
