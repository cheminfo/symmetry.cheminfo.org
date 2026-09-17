/**
 * The printable reference: eleven blocks, and nothing missing from the 17 or
 * the 7.
 *
 * A row is enriched with a tooltip or it is plain text; a half-written tooltip
 * would render as a chip that opens nothing, so every one present is complete.
 */

import { expect, test } from 'vitest';

import { FRIEZE_GROUPS } from '../friezeGroups.ts';
import { WALLPAPER_GROUPS } from '../planeGroups.ts';
import {
  FRIEZE_NOTES,
  REFERENCE_SECTIONS,
  WALLPAPER_NOTES,
} from '../reference/index.ts';

test('the cheatsheet is eleven blocks, and covers all 17 and all 7', () => {
  expect(REFERENCE_SECTIONS).toHaveLength(11);
  const ids = REFERENCE_SECTIONS.map((section) => section.id);
  expect(new Set(ids).size).toBe(11);
  for (const section of REFERENCE_SECTIONS) {
    expect(section.rows.length, section.id).toBeGreaterThanOrEqual(7);
    for (const row of section.rows) {
      expect(row.syntax.length, section.id).toBeGreaterThan(0);
      expect(
        row.description.length,
        `${section.id}: ${row.syntax}`,
      ).toBeLessThanOrEqual(120);
      if (row.tooltip === undefined) continue;
      expect(row.tooltip.detail.length, row.syntax).toBeGreaterThan(40);
      expect(row.tooltip.example.code.length, row.syntax).toBeGreaterThan(0);
    }
  }
  for (const group of WALLPAPER_GROUPS) {
    expect(WALLPAPER_NOTES[group.id], group.id).toBeDefined();
  }
  for (const group of FRIEZE_GROUPS) {
    expect(FRIEZE_NOTES[group.id], group.id).toBeDefined();
  }
});
