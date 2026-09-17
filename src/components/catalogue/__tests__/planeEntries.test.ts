import { expect, test } from 'vitest';

import { friezeEntry, wallpaperEntry } from '../planeEntry.ts';
import { spaceGroupEntry } from '../spaceGroupEntry.ts';

import { fact, section } from './entryReaders.ts';

test('p4g lists the elements of one cell, each once', () => {
  const view = wallpaperEntry('p4g');
  if (view === null) throw new Error('no p4g');
  expect(fact(view, 'Point group')).toBe('4mm');
  expect(fact(view, 'Lattice')).toBe('square lattice');
  const elements = section(view, 'elements');
  if (elements.kind !== 'tokens') throw new Error('not tokens');
  expect(elements.tokens).toStrictEqual([
    '4 at (0, 0)',
    '2 at (0, 1/2)',
    '2 at (1/2, 0)',
    '4 at (1/2, 1/2)',
    'g: y = 1/4, glide (1/2, 0)',
    'g: y = 3/4, glide (1/2, 0)',
    'm: x - y = -1/2',
    'g: x - y = 0, glide (1/2, 1/2)',
    'g: x = 1/4, glide (0, 1/2)',
    'g: x = 3/4, glide (0, 1/2)',
    'm: x + y = 1/2',
    'g: x + y = 1, glide (1/2, -1/2)',
  ]);
  const positions = section(view, 'positions');
  if (positions.kind !== 'tokens') throw new Error('not tokens');
  expect(positions.tokens).toHaveLength(8);
});

test('p1 has nothing but its translations, and the page says that', () => {
  const view = wallpaperEntry('p1');
  if (view === null) throw new Error('no p1');
  const elements = section(view, 'elements');
  if (elements.kind !== 'note') throw new Error('not a note');
  expect(elements.lines).toStrictEqual([
    'Only the translations: nothing is left fixed anywhere in the cell.',
  ]);
});

test('p11g draws its one glide line along the strip', () => {
  const view = friezeEntry('p11g');
  if (view === null) throw new Error('no p11g');
  expect(view.figure?.kind).toBe('frieze');
  expect(fact(view, 'Strip of')).toBe('wallpaper group pg');
  const elements = section(view, 'elements');
  if (elements.kind !== 'tokens') throw new Error('not tokens');
  expect(elements.tokens).toStrictEqual(['g: y = 0, glide (1/2, 0)']);
});

test('a frieze page opens the wallpaper group its strip belongs to', () => {
  const view = friezeEntry('p2mg');
  if (view === null) throw new Error('no p2mg');
  expect(view.open).toStrictEqual([
    {
      label: 'Draw wallpaper group pmg',
      detail: 'Its strip along one direction is p2mg.',
      target: { page: 'plane', planeGroup: 'pmg' },
    },
  ]);
});

test('a space group links to the cell builder and to its crystal class', () => {
  const view = spaceGroupEntry('225', 0);
  if (view === null) throw new Error('no 225');
  expect(view.open.map((link) => link.target)).toStrictEqual([
    { page: 'crystals', number: 225, setting: 0 },
    { page: 'catalogue', tab: 'point-groups', id: 'oh' },
  ]);
});
