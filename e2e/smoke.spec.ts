/**
 * The shell: the six pages, the four utilities, path routing, and a reload that
 * lands where the visitor left off.
 *
 * Everything is located by its place in the chrome — the page links by their
 * role inside `nav.app-header-nav`, the utilities by the `aria-label` each
 * carries, and every page root by the one `page-<tab>` marker `App` writes — so
 * a reworded heading inside a page never breaks this file.
 */

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// Playwright's stock thirty seconds is a page's own time; these run several at a
// time against the one `npm run dev` behind them, where a page that renders in
// two seconds alone takes ten while five browsers ask that server at once. The
// ceiling is the contention, not the page — a green run is nowhere near it.
test.describe.configure({ timeout: 60_000 });

/** The pages of the site, in the order the bar lists them. */
const TABS = [
  { id: 'molecules', label: 'Molecules', path: '/' },
  { id: 'crystals', label: 'Crystals', path: '/crystals' },
  { id: 'plane', label: 'Plane', path: '/plane' },
  { id: 'tutorial', label: 'Tutorial', path: '/tutorial' },
  { id: 'exercises', label: 'Exercises', path: '/exercises' },
  { id: 'cheatsheet', label: 'Cheatsheet', path: '/cheatsheet' },
] as const;

/**
 * A page link in the header bar. Scoped to `nav.app-header-nav`: the Tools menu
 * and the footer both hold links naming sibling sites, and one of them says
 * "molecules" too.
 *
 * @param page - The page under test.
 * @param label - The label of the link.
 * @returns The locator.
 */
function pageLink(page: Page, label: string) {
  return page
    .locator('nav.app-header-nav')
    .getByRole('link', { name: label, exact: true });
}

test('the app opens on the molecule workbench, with its pages and utilities', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByTestId('page-molecules')).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Point groups of molecules' }),
  ).toBeVisible();

  await expect(page.locator('nav.app-header-nav a')).toHaveText([
    'Molecules',
    'Crystals',
    'Plane',
    'Tutorial',
    'Exercises',
    'Cheatsheet',
  ]);

  // About first, then Cite, Tools and Share: the order every site of the family
  // keeps, so somebody who has learned where to cite one has learned them all.
  const utilities = await page
    .locator('.app-header-actions')
    .locator('a[aria-label], button[aria-label]')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('aria-label')),
    );
  expect(utilities).toStrictEqual(['About', 'Cite', 'Tools', 'Share']);

  // The wordmark writes the name in the two colours the site owns, split at its
  // own capital, with no domain after it.
  await expect(page.locator('.wordmark__lead')).toHaveText('Symme');
  await expect(page.locator('.wordmark__alt')).toHaveText('Try');
  await expect(page.locator('.wordmark')).toHaveText('SymmeTry');
  await expect(page.locator('a.brand')).toHaveAttribute('href', '/');
});

test('the workbench opens on water, read as C2v from its coordinates', async ({
  page,
}) => {
  await page.goto('/');

  const workbench = page.getByTestId('page-molecules');
  await expect(workbench.locator('.mol-verdict')).toHaveText('C2v4 operations');
  await expect(workbench.locator('.mol-operation')).toHaveText([
    'E',
    'C2',
    'σv(xz)',
    'σv(yz)',
  ]);
  await expect(workbench.locator('.mol-facts')).toContainText('Achiral');
  await expect(workbench.locator('.mol-facts')).toContainText('Polar');
  await expect(workbench.locator('.mol-panel__title')).toHaveText([
    'Library',
    'How it is assigned',
    'Operations, by class',
    'Character table',
  ]);
});

test('every page switches and writes its own path', async ({ page }) => {
  // Two of the six mount molstar, which is fetched on demand.
  test.setTimeout(120_000);
  await page.goto('/');

  /* eslint-disable no-await-in-loop -- one page, clicked through the nav in
     order: each tab is opened from the one before it. */
  for (const tab of TABS) {
    await pageLink(page, tab.label).click();
    await expect(page.getByTestId(`page-${tab.id}`)).toBeVisible();
    await expect(pageLink(page, tab.label)).toHaveClass(/nav-link--active/);
    await expect
      .poll(() => new URL(page.url()).pathname)
      // A page may carry its entry in a further segment, e.g.
      // `/exercises/point-group-water`.
      .toMatch(tab.path === '/' ? /^\/$/ : new RegExp(`^${tab.path}(/|$)`));
  }
  /* eslint-enable no-await-in-loop */
});

test('a reload restores the open page', async ({ page }) => {
  await page.goto('/');

  await pageLink(page, 'Cheatsheet').click();
  await expect(page.getByTestId('page-cheatsheet')).toBeVisible();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/cheatsheet');

  await page.reload();

  await expect(page.getByTestId('page-cheatsheet')).toBeVisible();
  await expect(page.getByTestId('page-molecules')).toHaveCount(0);
});

test('a deep-linked page opens directly, and an unknown path falls back', async ({
  page,
}) => {
  await page.goto('/wallpaper/p4g');
  await expect(page.getByTestId('page-wallpaper')).toBeVisible();
  await expect(page).toHaveTitle(
    'p4g — wallpaper group 12 of 17, square — SymmeTry',
  );

  await page.goto('/not-a-page');
  await expect(page.getByTestId('page-molecules')).toBeVisible();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/');
});

test('a stale catalogue id lands on its own index, not on the home page', async ({
  page,
}) => {
  await page.goto('/space-groups/999');

  await expect(page.getByTestId('page-space-groups')).toBeVisible();
  await expect(page.getByTestId('page-molecules')).toHaveCount(0);
});

test('a link written for the hash the family used to route by still opens', async ({
  page,
}) => {
  await page.goto('/#/crystals');

  await expect(page.getByTestId('page-crystals')).toBeVisible();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/crystals');
  await expect.poll(() => new URL(page.url()).hash).toBe('');
});
