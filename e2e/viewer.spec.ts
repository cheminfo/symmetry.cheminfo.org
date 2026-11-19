/**
 * The crystal viewer: a CIF opened on it is drawn with its molecules whole,
 * and the page is a figure a drawing or a document takes, and hands back to be
 * changed — framed by a stand-in for draw.cheminfo.org or write.cheminfo.org.
 *
 * Aspirin is four molecules in P2₁/c and naphthalene two, each on an inversion
 * centre: the counts are the packing, not the layout.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { FrameLocator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import {
  readClipboardFigure,
  readFigureSource,
  readFigureStates,
} from 'react-cheminfo/core';
import type { StandInHost } from 'react-cheminfo/host-testing';
import {
  readClipboardHtml,
  readStandInHostLog,
  sendStandInHostRequest,
  startStandInHost,
} from 'react-cheminfo/host-testing';

/** molstar is fetched the first time the view mounts. */
const VIEWER_TIMEOUT = 120_000;

const STRUCTURES = join(import.meta.dirname, '../src/data/structures');
const ASPIRIN = readFileSync(join(STRUCTURES, 'aspirin.cif'));
const NAPHTHALENE = readFileSync(join(STRUCTURES, 'naphthalene.cif'), 'utf8');

test.describe.configure({ timeout: 240_000 });
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

let host: StandInHost;

test.beforeAll(async () => {
  host = await startStandInHost();
});

test.afterAll(async () => {
  await host.close();
});

test('a CIF opened on the viewer is drawn with its molecules whole', async ({
  page,
}, testInfo) => {
  await page.goto('/viewer');
  await expect(page.getByTestId('page-viewer')).toBeVisible();
  await page.locator('.data-drop-zone input[type="file"]').setInputFiles({
    name: 'aspirin.cif',
    mimeType: 'chemical/x-cif',
    buffer: ASPIRIN,
  });

  const details = page.getByTestId('cif-details');
  await expect(details).toContainText('C9H8O4');
  await expect(details).toContainText('P 1 21/c 1');
  await expect(details).toContainText('84 atoms, in 4 molecules.');
  await expect(details).toContainText('7050902');
  await expect(drawn(page)).toBeAttached({ timeout: VIEWER_TIMEOUT });
  await expect(
    page.getByText('aspirin · 4 molecules per cell · 1×1×1 cell'),
  ).toBeVisible();
  // A file has no address: the link stays the page's own.
  expect(new URL(page.url()).search).toBe('');
  await page.screenshot({ path: testInfo.outputPath('viewer-aspirin.png') });
});

test('the packing and the cells are in the address', async ({ page }) => {
  await page.goto('/viewer?structure=naphthalene');
  await expect(drawn(page)).toBeAttached({ timeout: VIEWER_TIMEOUT });
  await expect(
    page.getByText('Naphthalene · 2 molecules per cell · 1×1×1 cell'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Atoms in the cell' }).click();
  await expect(
    page.getByText('Naphthalene · 36 atoms per cell · 1×1×1 cell'),
  ).toBeVisible();
  await page.getByRole('button', { name: '2×2×2' }).click();
  await expect
    .poll(() => new URL(page.url()).search)
    .toBe('?structure=naphthalene&supercell=2&packing=cell');
});

test('a framed viewer hands back its crystal as a figure that opens again', async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  await page.goto(
    host.pageUrl(`${baseURL}/viewer?structure=naphthalene&embed=1`, []),
  );
  await expect(drawn(page.frameLocator('#tool'))).toBeAttached({
    timeout: VIEWER_TIMEOUT,
  });

  const svg = await getFigure(page, 'get-1');
  expect(svg).toContain('data:image/jpeg;base64,');
  expect(readFigureSource(svg)?.site).toBe('symmetry');
  expect(readFigureSource(svg)?.href).toMatch(/\/viewer\b/);
  const carried = await readFigureStates(svg, 'symmetry');
  expect(carried?.data).toStrictEqual({
    version: 1,
    value: {
      name: 'Naphthalene',
      cif: NAPHTHALENE,
      structureId: 'naphthalene',
    },
  });
  const view = carried?.view?.value as Record<string, unknown>;
  expect(view.supercell).toBe(1);
  expect(view.packing).toBe('molecules');
  expect(view.unitCell).toBe(true);
  const camera = cameraOf(view.camera);

  // A new frame in another browser, handed the figure: what the host does to
  // change it again. Nothing of the first visit is stored there.
  const reader = await browser.newPage();
  await reader.goto(
    host.pageUrl(`${baseURL}/viewer?embed=1`, [
      {
        type: 'load',
        id: 'load-1',
        document: 'figure:1',
        items: [{ key: 'figure', kind: 'image.svg', value: { svg } }],
      },
    ]),
  );
  expect(await answerTo(reader, 'load-1')).toStrictEqual({
    type: 'result',
    id: 'load-1',
    ok: true,
    used: [{ key: 'figure', kind: 'image.svg' }],
  });
  const framed = reader.frameLocator('#tool');
  await expect(framed.getByTestId('cif-details')).toContainText('C10H8');
  await expect(drawn(framed)).toBeAttached({ timeout: VIEWER_TIMEOUT });

  await reader
    .locator('#tool')
    .screenshot({ path: testInfo.outputPath('viewer-framed.png') });
  const reopened = await getFigure(reader, 'get-2');
  const reopenedStates = await readFigureStates(reopened, 'symmetry');
  expect(reopenedStates?.data).toStrictEqual(carried?.data);
  const again = cameraOf(
    (reopenedStates?.view?.value as Record<string, unknown>).camera,
  );
  for (let index = 0; index < camera.length; index++) {
    expect(again[index]).toBeCloseTo(camera[index] ?? 0, 2);
  }
  await reader.close();
});

test('Ctrl+C copies the crystal as a figure that opens here again', async ({
  page,
}) => {
  await page.goto('/viewer?structure=aspirin');
  await expect(drawn(page)).toBeAttached({ timeout: VIEWER_TIMEOUT });

  await page.keyboard.press('ControlOrMeta+c');
  await expect(page.locator('.clipboard-notice')).toBeVisible();

  const figure = readClipboardFigure(await readClipboardHtml(page)) ?? '';
  expect(readFigureSource(figure)?.site).toBe('symmetry');
  const carried = await readFigureStates(figure, 'symmetry');
  expect((carried?.data?.value as Record<string, unknown>).structureId).toBe(
    'aspirin',
  );
});

/** The canvas, once the structure asked for last is drawn. */
function drawn(scope: Page | FrameLocator) {
  return scope.locator('[data-testid="crystal-3d"][data-drawn="true"]');
}

/** A camera as a figure writes it, as numbers. */
function cameraOf(value: unknown): number[] {
  expect(typeof value).toBe('string');
  return String(value).split(',').map(Number);
}

async function getFigure(page: Page, id: string): Promise<string> {
  await page.evaluate(sendStandInHostRequest, {
    type: 'get',
    id,
    keys: ['figure'],
  });
  const answer = (await answerTo(page, id)) as {
    ok: boolean;
    items: Array<{ value: { svg: string } }>;
  };
  expect(answer.ok).toBe(true);
  return answer.items[0]?.value.svg ?? '';
}

async function answerTo(page: Page, id: string): Promise<unknown> {
  const find = async () => {
    const { results } = await page.evaluate(readStandInHostLog);
    return results.find((message) => (message as { id?: string }).id === id);
  };
  await expect
    .poll(async () => (await find()) !== undefined, {
      timeout: VIEWER_TIMEOUT,
    })
    .toBe(true);
  return find();
}

test('an empty viewer asks for a file, and offers the structures it ships', async ({
  page,
}, testInfo) => {
  await page.goto('/viewer');
  const zone = page.locator('.data-drop-zone');
  await expect(zone).toContainText('Open a crystal structure');
  await expect(zone.getByRole('button')).toContainText([
    'Copper',
    'Naphthalene',
    'Aspirin',
  ]);
  await page.screenshot({ path: testInfo.outputPath('viewer-empty.png') });

  await zone.getByRole('button', { name: 'α-Quartz', exact: true }).click();
  await expect.poll(() => new URL(page.url()).search).toBe('?structure=quartz');
  await expect(page.getByTestId('cif-details')).toContainText(
    'bonded into one network through the crystal.',
  );
});
