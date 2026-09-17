/**
 * The proof that the 3D view drew something, and that a symmetry element is
 * really on it.
 *
 * Every unit test in `src/` stops at the boundary of the GPU: the atoms, the
 * drawings and the scene object are all checked there, and all of them are
 * correct on a canvas that never painted. So the canvas is reduced to a
 * luminance fingerprint — a blank one is a single flat colour — and a layer
 * switched off has to move a measurable share of the samples.
 */

import { expect, test } from '@playwright/test';

import {
  changedFraction,
  distinctLevels,
  spread,
  waitForChange,
  waitForPaint,
  waitForStable,
} from './canvasSignature.ts';

// Playwright's stock thirty seconds is a page's own time; these run several at a
// time against the one `npm run dev` behind them, where a page that renders in
// two seconds alone takes ten while five browsers ask that server at once. The
// ceiling is the contention, not the page — a green run is nowhere near it.
test.describe.configure({ timeout: 60_000 });

/** molstar is 2.8 MB, fetched the first time a viewer pane mounts. */
const VIEWER_TIMEOUT_MS = 120_000;

/** Share of the samples a real change moves. A redraw of the same scene is 0. */
const MINIMUM_CHANGE = 0.02;

test('the viewer draws the structure, and a layer switched off changes it', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await page.goto('/?molecule=benzene');

  const workbench = page.getByTestId('page-molecules');
  await expect(workbench.locator('.mol-verdict')).toHaveText(
    'D6h24 operations',
  );

  const canvas = page.getByTestId('symmetry-3d').locator('canvas');
  await expect(canvas).toBeVisible({ timeout: VIEWER_TIMEOUT_MS });

  const painted = await waitForPaint(page, canvas, VIEWER_TIMEOUT_MS);
  expect(
    distinctLevels(painted),
    'a canvas that never painted is one flat colour',
  ).toBeGreaterThan(6);
  expect(spread(painted)).toBeGreaterThan(20);

  const settled = await waitForStable(page, canvas, painted);

  // Benzene carries seven mirror planes, so switching them off is the largest
  // change any single chip on this page can make.
  const mirrors = workbench.getByRole('button', {
    name: 'Mirrors',
    exact: true,
  });
  await expect(mirrors).toHaveAttribute('aria-pressed', 'true');
  await mirrors.click();
  await expect(mirrors).toHaveAttribute('aria-pressed', 'false');

  const without = await waitForChange(page, canvas, settled, 60_000);
  expect(
    changedFraction(settled, without),
    'switching the mirrors off must change what the canvas shows',
  ).toBeGreaterThan(MINIMUM_CHANGE);

  // And back: the drawing returns, so the change was the layer and not a camera
  // that happened to be moving.
  await mirrors.click();
  const again = await waitForChange(page, canvas, without, 60_000);
  expect(changedFraction(without, again)).toBeGreaterThan(MINIMUM_CHANGE);
});

test('pressing an operation writes it into the address and says what it does', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto('/?molecule=ammonia');

  const workbench = page.getByTestId('page-molecules');
  await expect(workbench.locator('.mol-verdict')).toHaveText('C3v6 operations');
  await expect(workbench.locator('.mol-operation')).toHaveCount(6);

  const rotation = workbench.locator('.mol-operation').nth(1);
  await expect(rotation).toHaveText('C3');
  await rotation.click();

  await expect(rotation).toHaveAttribute('aria-pressed', 'true');
  await expect(
    workbench.getByText('Turns by 120° about z.', { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => new URL(page.url()).searchParams.get('operation'))
    .toBe('C3');
  await expect
    .poll(() => new URL(page.url()).searchParams.get('molecule'))
    .toBe('ammonia');
});

test('a link naming a molecule and an operation opens on both', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto('/?molecule=allene&operation=S4');

  const workbench = page.getByTestId('page-molecules');
  await expect(workbench.locator('.mol-verdict')).toHaveText('D2d8 operations');
  await expect(
    workbench.locator('.mol-operation[aria-pressed="true"]'),
  ).toHaveText('S4');

  const canvas = page.getByTestId('symmetry-3d').locator('canvas');
  await expect(canvas).toBeVisible({ timeout: VIEWER_TIMEOUT_MS });
  const painted = await waitForPaint(page, canvas, VIEWER_TIMEOUT_MS);
  expect(distinctLevels(painted)).toBeGreaterThan(6);
});

test('a molecule nobody minted opens the workbench rather than an error', async ({
  page,
}) => {
  await page.goto('/?molecule=nonesuch');

  // It falls back to the molecule the site opens on, water, rather than to an
  // empty workbench: a link from a course made two years ago still teaches.
  const workbench = page.getByTestId('page-molecules');
  await expect(workbench.locator('.mol-verdict')).toHaveText('C2v4 operations');
});
