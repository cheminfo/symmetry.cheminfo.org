/**
 * The plane workbench: a group, a motif, and the tiling the two of them make.
 *
 * The number of copies on the page is the group's order times the number of
 * cells covered, and that is the one thing about a wallpaper group a picture
 * can be wrong about while every unit test passes. Each copy is a `<use>`
 * carrying the operation that made it and the cell it landed in, so both
 * factors can be counted apart.
 *
 * The orders below are the International Tables' own, in the order the picker
 * lists the seventeen: 1, 2, 2, 2, 4, 4, 4, 4, 8, 4, 8, 8, 3, 6, 6, 6, 12.
 */

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// Playwright's stock thirty seconds is a page's own time; these run several at a
// time against the one `npm run dev` behind them, where a page that renders in
// two seconds alone takes ten while five browsers ask that server at once. The
// ceiling is the contention, not the page — a green run is nowhere near it.
test.describe.configure({ timeout: 60_000 });

/** A wallpaper group, the cells it is drawn over, and its order. */
const SQUARE_CASES = [
  { id: 'p4', tiles: 2, order: 4 },
  { id: 'p4m', tiles: 4, order: 8 },
  { id: 'p4g', tiles: 3, order: 8 },
] as const;

/** Groups whose lattice is not square, so the covering is counted, not assumed. */
const OTHER_CASES = [
  { id: 'p1', tiles: 4, order: 1 },
  { id: 'p2', tiles: 4, order: 2 },
  { id: 'p3', tiles: 3, order: 3 },
  { id: 'cmm', tiles: 3, order: 8 },
  { id: 'p6m', tiles: 4, order: 12 },
] as const;

/**
 * How many copies the tiling holds, over how many operations and how many
 * cells.
 *
 * @param page - The page under test.
 * @returns The three counts.
 */
async function tiling(
  page: Page,
): Promise<{ copies: number; operations: number; cells: number }> {
  const uses = page.locator('use.pattern-copy');
  await expect(uses.first()).toBeAttached();
  return uses.evaluateAll((nodes) => ({
    copies: nodes.length,
    operations: new Set(nodes.map((node) => node.dataset.operation)).size,
    cells: new Set(nodes.map((node) => node.dataset.shift)).size,
  }));
}

for (const { id, tiles, order } of SQUARE_CASES) {
  test(`${id} tiles ${tiles}×${tiles} cells with ${order} copies in each`, async ({
    page,
  }) => {
    await page.goto(`/plane?planeGroup=${id}&tiles=${tiles}`);
    await expect(page.getByTestId('page-plane')).toBeVisible();

    // A square cell is covered by exactly tiles² lattice translates, so the
    // whole count is known ahead of time rather than read off the page.
    expect(await tiling(page)).toStrictEqual({
      copies: order * tiles * tiles,
      operations: order,
      cells: tiles * tiles,
    });
    await expect(page.locator('.plane-caption')).toHaveText(
      `${order} copies per cell. Point at one to read the element that made it.`,
    );
  });
}

for (const { id, tiles, order } of OTHER_CASES) {
  test(`${id} puts all ${order} of its operations in every cell it covers`, async ({
    page,
  }) => {
    await page.goto(`/plane?planeGroup=${id}&tiles=${tiles}`);
    await expect(page.getByTestId('page-plane')).toBeVisible();

    const { copies, operations, cells } = await tiling(page);
    expect(operations).toBe(order);
    // An oblique or hexagonal cell needs more translates than tiles² to cover a
    // square frame, so the covering is counted; what must hold exactly is that
    // every cell carries the whole group and nothing else.
    expect(cells).toBeGreaterThanOrEqual(tiles * tiles);
    expect(copies).toBe(order * cells);
    await expect(page.locator('.plane-caption')).toHaveText(
      `${order} copies per cell. Point at one to read the element that made it.`,
    );
  });
}

test('the picker switches between the seventeen and the seven', async ({
  page,
}) => {
  await page.goto('/plane?planeGroup=p4m');

  const plane = page.getByTestId('page-plane');
  await expect(
    plane.getByRole('radio', { name: 'Wallpaper · 17', exact: true }),
  ).toBeChecked();
  await expect(plane.locator('.plane-groups .chip')).toHaveCount(17);
  await expect(
    plane.locator('.plane-groups .chip[aria-pressed="true"]'),
  ).toHaveText('p4m');

  await plane.getByRole('radio', { name: 'Frieze · 7', exact: true }).click();

  await expect(plane.locator('.plane-groups .chip')).toHaveCount(7);
  await expect(plane.locator('.plane-caption')).toContainText('per period');
  await expect
    .poll(() => new URL(page.url()).searchParams.get('planeGroup'))
    .not.toBe('p4m');
});

test('a plane group nobody minted opens the group the site starts on', async ({
  page,
}) => {
  await page.goto('/plane?planeGroup=nope');

  await expect(page.getByTestId('page-plane')).toBeVisible();
  await expect(
    page.locator('.plane-groups .chip[aria-pressed="true"]'),
  ).toHaveText('p4m');
});
