/**
 * The guided tour: eighteen steps in three coloured strips, each opening its
 * own address and lighting the layers that step is about.
 *
 * The strip, the pager and a pasted link all arrive as one write to the
 * address, so what is checked here is that the three agree: the step on screen,
 * the `aria-current="step"` button, and the path in the bar.
 */

import { expect, test } from '@playwright/test';

// Playwright's stock thirty seconds is a page's own time; these run several at a
// time against the one `npm run dev` behind them, where a page that renders in
// two seconds alone takes ten while five browsers ask that server at once. The
// ceiling is the contention, not the page — a green run is nowhere near it.
test.describe.configure({ timeout: 60_000 });

test('the tour opens on its first step, with all eighteen in three strips', async ({
  page,
}) => {
  await page.goto('/tutorial');

  await expect(page.getByTestId('page-tutorial')).toBeVisible();
  await expect(page.locator('[aria-label^="Step "]')).toHaveCount(18);
  await expect(page.locator('[aria-current="step"]')).toHaveAttribute(
    'aria-label',
    'Step 1: The simplest operation: a mirror plane',
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'The simplest operation: a mirror plane',
  );
  const strips = page.locator('.tutorial__steps');
  await expect(strips).toContainText('Operations, elements and point groups');
  await expect(strips).toContainText('Characters, and what they predict');
  await expect(strips).toContainText('Lattices, plane groups, space groups');
  await expect(strips).toContainText('Step 1 of 18');
});

test('a step opens its own address, and the pager and the strip agree', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto('/tutorial');

  await page.locator('[aria-label^="Step 5:"]').click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Rotate, then reflect: the improper axis',
  );
  await expect
    .poll(() => new URL(page.url()).pathname)
    .toBe('/tutorial/improper-allene');
  await expect(page.locator('[aria-current="step"]')).toHaveText('5');

  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('[aria-current="step"]')).toHaveText('6');

  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(page.locator('[aria-current="step"]')).toHaveText('5');
  await expect
    .poll(() => new URL(page.url()).pathname)
    .toBe('/tutorial/improper-allene');
});

test('a deep-linked step opens with exactly the layers it is about', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto('/tutorial/glide-and-screw');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'What translation adds',
  );
  await expect(page.locator('[aria-current="step"]')).toHaveText('17');
  // The step is about the two elements translation adds, so those are the
  // layers it lights and no others.
  await expect(page.locator('.chip[aria-pressed="true"]')).toHaveText([
    'Unit cell',
    'Glides',
    'Screw axes',
    'Labels',
  ]);
});

test('a step id nobody minted opens the tour rather than an error', async ({
  page,
}) => {
  await page.goto('/tutorial/no-such-step');

  await expect(page.getByTestId('page-tutorial')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'The simplest operation: a mirror plane',
  );
});
