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
  SIGNATURE_SIZE,
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

/** Luminance a sample has to fall below to count as painted, on a white scene. */
const PAINTED_BELOW = 250;

/**
 * Share of the frame that is not bare background.
 *
 * @param signature - A fingerprint.
 * @returns A fraction between 0 and 1.
 */
function paintedFraction(signature: number[]): number {
  if (signature.length === 0) return 0;
  let painted = 0;
  for (const value of signature) {
    if (value < PAINTED_BELOW) painted++;
  }
  return painted / signature.length;
}

/**
 * How many of the fingerprint's columns hold anything at all — how wide what is
 * drawn actually is.
 *
 * @param signature - A fingerprint.
 * @returns A count out of {@link SIGNATURE_SIZE}.
 */
function paintedColumns(signature: number[]): number {
  const columns = new Set<number>();
  for (let index = 0; index < signature.length; index++) {
    if ((signature[index] ?? 255) < PAINTED_BELOW) {
      columns.add(index % SIGNATURE_SIZE);
    }
  }
  return columns.size;
}

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

test('the front page opens on a view where the symmetry is visible', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await page.goto('/');

  const workbench = page.getByTestId('page-molecules');
  await expect(workbench.locator('.mol-verdict')).toHaveText('C2v4 operations');

  const canvas = page.getByTestId('symmetry-3d').locator('canvas');
  await expect(canvas).toBeVisible({ timeout: VIEWER_TIMEOUT_MS });
  const settled = await waitForStable(
    page,
    canvas,
    await waitForPaint(page, canvas, VIEWER_TIMEOUT_MS),
  );

  // Measured on this scene, in this browser, at this window size. Opened down
  // the C2 — molstar's own direction — water is a column of three balls with
  // both σv exactly edge-on: 3.4% of the samples painted, across 8 of the 32
  // columns. Opened off the axis, the planes are two broad translucent squares
  // and the rod crosses them: 14.4%, across 13 columns. The thresholds sit
  // between the two, so a camera that goes back end-on fails here.
  expect(
    paintedColumns(settled),
    'the scene must be wider than the column an end-on view draws',
  ).toBeGreaterThanOrEqual(11);
  expect(
    paintedFraction(settled),
    "a plane seen edge-on paints nothing: both of water's must show",
  ).toBeGreaterThan(0.08);
});

/** Everything the front page can name: three atoms, the axis, the two planes. */
const WATER_LABELS = ['C2', 'σv(xz)', 'σv(yz)', 'O 1', 'H 2', 'H 3'];

test('the pointer names what the site drew, never what molstar parsed', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await page.goto('/');
  const canvas = page.getByTestId('symmetry-3d').locator('canvas');
  await expect(canvas).toBeVisible({ timeout: VIEWER_TIMEOUT_MS });
  await waitForPaint(page, canvas, VIEWER_TIMEOUT_MS);

  const frame = await canvas.boundingBox();
  const seen = new Set<string>();
  /* eslint-disable no-await-in-loop -- there is one pointer: a move has to land
     before whatever it came to rest under can be read. */
  for (let row = 1; row < 10; row++) {
    for (let column = 1; column < 10; column++) {
      await page.mouse.move(
        (frame?.x ?? 0) + ((frame?.width ?? 0) * column) / 10,
        (frame?.y ?? 0) + ((frame?.height ?? 0) * row) / 10,
      );
      await page.waitForTimeout(80);
      const label = await page.evaluate(
        () =>
          document.querySelector('[data-testid="symmetry-3d-readout"]')
            ?.textContent ?? '',
      );
      if (label !== '') seen.add(label);
    }
  }
  /* eslint-enable no-await-in-loop */

  // molstar names an atom after the row it parsed — `xyz | Model 0 | Instance
  // 1_555 | A | MOL 1 | O [idx 1]` — which is what this page used to show.
  expect(
    [...seen],
    'a sweep that rests on nothing would prove nothing',
  ).not.toHaveLength(0);
  for (const label of seen) expect(WATER_LABELS).toContain(label);
  expect(
    [...seen].some((label) => /^[A-Z][a-z]? \d+$/.test(label)),
    'the sweep must land on an atom, which is the label that was wrong',
  ).toBe(true);
});
