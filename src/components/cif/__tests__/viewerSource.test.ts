import { afterEach, expect, test, vi } from 'vitest';

import { structureCif } from '../../../data/structures/index.ts';
import { state } from '../../../state/index.ts';
import { cifFileName, openViewerFile, openViewerUrl } from '../viewerSource.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('a CIF fetched by address is shown, and the address is kept', async () => {
  const url = 'https://crystals.cheminfo.org/v1/entries/7050902/cif';
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(structureCif('aspirin'))),
  );

  await openViewerUrl(url);

  expect(state.data.crystal.status.value).toBe('ready');
  expect(state.data.crystal.id.value).toBe(url);
  expect(state.data.crystal.name.value).toBe('7050902');
  expect(state.view.viewer.cifUrl.value).toBe(url);
  expect(state.view.viewer.structureId.value).toBeNull();
});

test('an address that answers with an error says so, and shows nothing', async () => {
  const url = 'https://example.org/missing.cif';
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('gone', { status: 404 })),
  );

  await openViewerUrl(url);

  expect(state.data.crystal.status.value).toBe('error');
  expect(state.data.crystal.error.value).toBe(
    `The CIF could not be fetched: ${url} answered 404.`,
  );
  expect(state.data.crystal.text.value).toBe('');
});

test('a dropped file takes over from an address', () => {
  state.view.viewer.cifUrl.value = 'https://example.org/x.cif';

  expect(openViewerFile(structureCif('halite'), 'halite.cif')).toBeNull();
  expect(state.view.viewer.cifUrl.value).toBeNull();
});

test('a CIF fetched by address is named by its path', () => {
  expect(
    cifFileName('https://crystals.cheminfo.org/v1/entries/7050902/cif'),
  ).toBe('7050902.cif');
  expect(cifFileName('https://example.org/files/quartz.cif')).toBe(
    'quartz.cif',
  );
  expect(cifFileName('not an address')).toBe('structure.cif');
});
