/**
 * The printable sheet.
 *
 * The blocks themselves are `src/data/reference/`'s and are checked there; what
 * is checked here is the painting — that every block reaches `ReferenceGrid`
 * with a colour, that the colour comes from the shared level palette rather
 * than from a hex typed into this site, and that the chrome never prints.
 */

import { TUTORIAL_LEVEL_COLOURS } from 'react-cheminfo/ui';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import {
  REFERENCE_ROW_COUNT,
  REFERENCE_SECTIONS,
} from '../../../data/reference/index.ts';
import { CheatsheetHeader } from '../CheatsheetHeader.tsx';
import {
  LEVEL_LEGEND,
  colouredSections,
  levelColour,
  printedLegend,
} from '../levels.ts';

test('every block reaches the grid with the colour of its level', () => {
  const coloured = colouredSections(REFERENCE_SECTIONS);
  expect(coloured).toHaveLength(11);
  expect(coloured.every((section) => section.color !== undefined)).toBe(true);
  expect(coloured[0]?.id).toBe('operations');
  expect(coloured[0]?.color).toBe(levelColour('beginner'));
  expect(coloured[3]?.id).toBe('character-tables');
  expect(coloured[3]?.color).toBe(levelColour('intermediate'));
  expect(coloured[10]?.id).toBe('numbers');
  expect(coloured[10]?.color).toBe(levelColour('advanced'));
});

test('colouring copies the block and changes nothing else', () => {
  const [first] = colouredSections(REFERENCE_SECTIONS);
  const [source] = REFERENCE_SECTIONS;
  expect(first?.title).toBe(source?.title);
  expect(first?.rows).toBe(source?.rows);
  expect(source).not.toHaveProperty('color');
});

test('the three colours are mixed from the shared palette, not typed here', () => {
  expect(levelColour('beginner')).toBe(
    `color-mix(in oklab, ${TUTORIAL_LEVEL_COLOURS.beginner.activeBackground} 45%, black)`,
  );
  const colours = new Set([
    levelColour('beginner'),
    levelColour('intermediate'),
    levelColour('advanced'),
  ]);
  expect(colours.size).toBe(3);
});

test('the legend runs beginner to advanced and prints as one line', () => {
  expect(LEVEL_LEGEND.map((entry) => entry.level)).toStrictEqual([
    'beginner',
    'intermediate',
    'advanced',
  ]);
  expect(printedLegend()).toBe(
    'Beginner: operations and point groups · Intermediate: character tables · Advanced: crystals and patterns',
  );
});

test('the heading, the legend and the print button never reach the paper', () => {
  const markup = renderToStaticMarkup(
    <CheatsheetHeader
      blocks={REFERENCE_SECTIONS.length}
      lines={REFERENCE_ROW_COUNT}
    />,
  );
  expect(markup).toContain('class="sheet-head no-print"');
  expect(markup).toContain('<h1>Cheatsheet</h1>');
  expect(markup).toContain('11 blocks, 121 lines');
  expect(markup).toContain('Beginner');
  expect(markup).toContain('Print');
  // One swatch per level, each painted by `levelColour` and nothing else.
  expect(markup.split('sheet-legend__swatch').length - 1).toBe(3);
  expect(markup).toContain(`background:${levelColour('advanced')}`);
});

test('the sheet is short enough to print on two sides', () => {
  // Eleven blocks and 121 lines, flowed into three columns at ~17px a line:
  // about 820px of column, where an A4 side at 10mm margins holds ~1040px.
  expect(REFERENCE_SECTIONS.length).toBe(11);
  expect(REFERENCE_ROW_COUNT).toBe(121);
  const tallest = Math.max(
    ...REFERENCE_SECTIONS.map((section) => section.rows.length),
  );
  expect(tallest).toBe(17);
  // No block may be dropped from the printed sheet: every one is exam material.
  expect(REFERENCE_SECTIONS.some((section) => section.noPrint === true)).toBe(
    false,
  );
});
