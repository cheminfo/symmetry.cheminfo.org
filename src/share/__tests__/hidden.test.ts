import { formatHiddenParts, readHiddenParts } from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import { SHARE_PARTS, SHARE_PART_IDS, isSharePartId } from '../parts.ts';
import { SITE_VOCABULARY } from '../vocabulary.ts';

/** The parts a `?hide=` value leaves out, read with the site's whole list. */
function parseHidden(value: string | undefined): readonly string[] {
  return readHiddenParts(value, SITE_VOCABULARY.parts);
}

/** A `?hide=` value, written with the site's whole list. */
function serializeHidden(hidden: readonly string[]): string {
  return formatHiddenParts(hidden, SITE_VOCABULARY.parts);
}

test('an absent parameter hides nothing', () => {
  expect(parseHidden(undefined)).toStrictEqual([]);
  expect(parseHidden('')).toStrictEqual([]);
  expect(serializeHidden([])).toBe('');
});

test('a name the site does not know is dropped, not kept', () => {
  expect(parseHidden('operations,sidebar,characters')).toStrictEqual([
    'operations',
    'characters',
  ]);
  expect(parseHidden('header')).toStrictEqual([]);
  expect(isSharePartId('operations')).toBe(true);
  expect(isSharePartId('sidebar')).toBe(false);
});

test('the parameter is written in one canonical order', () => {
  expect(parseHidden('characters, operations ,tabs')).toStrictEqual([
    'tabs',
    'operations',
    'characters',
  ]);
  expect(serializeHidden(['characters', 'tabs', 'operations'])).toBe(
    'tabs,operations,characters',
  );
});

test('parse and serialize are each other, over every part at once', () => {
  const all = serializeHidden(SHARE_PART_IDS);

  expect(all).toBe(SHARE_PART_IDS.join(','));
  expect(parseHidden(all)).toStrictEqual([...SHARE_PART_IDS]);
});

test('every part describes itself for the dialog, and only the bar is chrome', () => {
  expect(SHARE_PART_IDS).toHaveLength(18);
  for (const id of SHARE_PART_IDS) {
    const part = SHARE_PARTS[id];
    expect(part.key).toBe(id);
    expect(part.label.length).toBeGreaterThan(2);
    expect(part.description.length).toBeLessThanOrEqual(80);
  }
  const inHeader = SHARE_PART_IDS.filter(
    (id) => SHARE_PARTS[id].inHeader === true,
  );

  expect(inHeader).toStrictEqual(['tabs']);
  expect(
    SHARE_PART_IDS.filter((id) => SHARE_PARTS[id].hiddenByDefault === true),
  ).toStrictEqual(['intro', 'catalogue', 'export']);
});
