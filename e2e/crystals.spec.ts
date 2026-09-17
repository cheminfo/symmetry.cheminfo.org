/**
 * The crystal workbench: a library structure, the group it is written in, and
 * the cell the two of them generate.
 *
 * The numbers asserted here are the chemistry, not the layout. Halite is two
 * atoms in the file and eight in the cell because F centring quadruples an
 * orbit of one; rewriting the same two atoms in the primitive group of the same
 * class drops the cell to two, and that factor of four is the whole content of
 * the word "centring".
 */

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import {
  changedFraction,
  distinctLevels,
  waitForChange,
  waitForPaint,
  waitForStable,
} from './canvasSignature.ts';

// Playwright's stock thirty seconds is a page's own time; these run several at a
// time against the one `npm run dev` behind them, where a page that renders in
// two seconds alone takes ten while five browsers ask that server at once. The
// ceiling is the contention, not the page — a green run is nowhere near it.
test.describe.configure({ timeout: 60_000 });

/** molstar is fetched the first time the middle pane mounts. */
const VIEWER_TIMEOUT_MS = 120_000;

/**
 * One of the six facts the readout prints over the cell.
 *
 * @param page - The page under test.
 * @param label - The fact's own label, e.g. `Atoms`.
 * @returns The locator of its value.
 */
function fact(page: Page, label: string) {
  return page
    .locator('.xtl-fact', {
      has: page.locator('.xtl-fact__label', { hasText: label }),
    })
    .locator('.xtl-fact__value');
}

test('a library structure fills its cell, and the sites read back exactly', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto('/crystals?structure=halite');

  await expect(page.getByTestId('page-crystals')).toBeVisible();
  await expect(fact(page, 'Group')).toHaveText('225 · F 4/m -3 2/m');
  await expect(fact(page, 'System')).toHaveText('cubic');
  await expect(fact(page, 'Class')).toHaveText('m-3m');
  await expect(fact(page, 'Operations')).toHaveText('192');
  await expect(fact(page, 'Atoms')).toHaveText('8');

  // Multiplicity and site symmetry, never a Wyckoff letter: the letter cannot
  // be derived from the operation list, and these two can.
  const sites = page.locator('.xtl-row').filter({ hasText: 'multiplicity' });
  await expect(sites).toHaveCount(2);
  await expect(sites.nth(0)).toContainText('Na1');
  await expect(sites.nth(0)).toContainText(
    'multiplicity 4, site symmetry m-3m',
  );
  await expect(sites.nth(1)).toContainText('Cl1');
  await expect(sites.nth(1)).toContainText(
    'multiplicity 4, site symmetry m-3m',
  );
  await expect(page.getByText('4b', { exact: true })).toHaveCount(0);

  await expect(
    page.getByText('Halite — 8 atoms in the cell, drawn over one cell.'),
  ).toBeVisible();
  await expect(page.locator('.xtl-panel__title')).toHaveText([
    'Structures',
    'Space group',
    'Cell',
    'Asymmetric unit',
    'This cell',
    'Elements in the cell',
    'Sites',
    'General positions · 192',
    'Symmetry elements · 147',
  ]);
});

test('writing the same two atoms in a primitive group divides the cell by four', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto('/crystals?structure=halite');
  await expect(fact(page, 'Atoms')).toHaveText('8');

  // 225 is Fm-3m and 221 is Pm-3m: the same crystal class m-3m, one F-centred
  // and one primitive. So the operations and the cell contents both fall by the
  // four lattice points of the F cell.
  await page.locator('select[aria-label="Space group"]').selectOption('221');

  await expect(fact(page, 'Group')).toHaveText('221 · P 4/m -3 2/m');
  await expect(fact(page, 'Operations')).toHaveText('48');
  await expect(fact(page, 'Atoms')).toHaveText('2');
  const sites = page.locator('.xtl-row').filter({ hasText: 'multiplicity' });
  await expect(sites.nth(0)).toContainText(
    'multiplicity 1, site symmetry m-3m',
  );

  // Editing detaches the page from the library entry: a link saying
  // `structure=halite` must always open halite.
  await expect
    .poll(() => new URL(page.url()).searchParams.get('spaceGroup'))
    .toBe('221');
  await expect
    .poll(() => new URL(page.url()).searchParams.get('structure'))
    .toBeNull();
});

test('asking for more cells redraws the stack and says so', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await page.goto('/crystals?structure=halite');

  const canvas = page.getByTestId('symmetry-3d').locator('canvas');
  await expect(canvas).toBeVisible({ timeout: VIEWER_TIMEOUT_MS });
  const painted = await waitForPaint(page, canvas, VIEWER_TIMEOUT_MS);
  expect(distinctLevels(painted)).toBeGreaterThan(6);
  const settled = await waitForStable(page, canvas, painted);

  await page.getByRole('button', { name: '2×2×2', exact: true }).click();

  // Eight cells of eight atoms: sixty-four drawn where there were eight.
  await expect(
    page.getByText('Halite — 8 atoms in the cell, drawn over 2×2×2 cells.'),
  ).toBeVisible();
  await expect
    .poll(() => new URL(page.url()).searchParams.get('supercell'))
    .toBe('2');

  const stacked = await waitForChange(page, canvas, settled, 60_000);
  expect(changedFraction(settled, stacked)).toBeGreaterThan(0.02);
});

test('a link asking for more cells than the page will draw comes back clamped', async ({
  page,
}) => {
  await page.goto('/crystals?structure=halite&supercell=9');

  await expect(page.getByTestId('page-crystals')).toBeVisible();
  await expect
    .poll(() => new URL(page.url()).searchParams.get('supercell'))
    .toBe('4');
});
