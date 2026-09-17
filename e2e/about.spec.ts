/**
 * `/about`: a routed page, in the family's own shape, saying which build is
 * running.
 *
 * A tool nobody can attribute is a tool nobody cites, and a bug report that
 * cannot name the build it was seen on costs more to reproduce than to fix. So
 * the sections, the licence, the repository and the version line are all
 * asserted here, and the prose is read out of the record rather than retyped.
 */

import { expect, test } from '@playwright/test';

import { ABOUT } from '../src/about.ts';

// Playwright's stock thirty seconds is a page's own time; these run several at a
// time against the one `npm run dev` behind them, where a page that renders in
// two seconds alone takes ten while five browsers ask that server at once. The
// ceiling is the contention, not the page — a green run is nowhere near it.
test.describe.configure({ timeout: 60_000 });

test('/about is a routed page, with the family sections in order', async ({
  page,
}) => {
  await page.goto('/about');

  const about = page.getByTestId('page-about');
  await expect(about).toBeVisible();
  await expect(about.getByRole('heading', { level: 1 })).toHaveText('SymmeTry');
  await expect(about.locator('.about-hero')).toContainText(
    'Find the symmetry of a molecule, a crystal or a pattern.',
  );
  await expect(about.getByText(ABOUT.what, { exact: true })).toBeVisible();

  await expect(about.getByRole('heading', { level: 2 })).toHaveText([
    'Provided by',
    'What you can do here',
    'Built on',
    'How to cite',
    'Licence and source',
    'Found a problem?',
  ]);

  // Every line of the record is on the page, and nothing else is.
  await expect(about.locator('.about-can li')).toHaveText([...ABOUT.can]);

  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);
});

test('the About names the licence, the repository and the build running', async ({
  page,
}) => {
  await page.goto('/about');

  const licence = page.locator('.about-licence');
  await expect(licence).toContainText('MIT, © cheminfo.');
  await expect(
    licence.getByRole('link', {
      name: 'github.com/cheminfo/symmetry.cheminfo.org',
    }),
  ).toBeVisible();

  // Written by the build, never by hand: a version typed into a record is wrong
  // by the next release. The commit joins it once the repository has one.
  await expect(licence).toContainText(
    /Running version \d+\.\d+\.\d+, built \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC/,
  );

  await expect(
    page
      .locator('.about-issues')
      .getByRole('link', { name: /symmetry\.cheminfo\.org\/issues/ }),
  ).toBeVisible();
});

test('the About credits every borrowed work, and offers a citation', async ({
  page,
}) => {
  await page.goto('/about');

  const credits = page.locator('.about-credits');
  await expect(credits).toContainText('Mol*');
  await expect(credits).toContainText('React');
  await expect(credits).toContainText('Vite');

  const cite = ABOUT.cite?.[0];
  expect(cite, 'the About record must cite a work').toBeDefined();
  const citeButton = page
    .locator('.about-cite')
    .getByRole('button', { name: `Cite ${cite?.what}`, exact: true });
  await expect(citeButton).toBeVisible();
  await citeButton.click();
  await expect(page.locator('.citation-menu')).toContainText(
    cite?.reference.doi ?? '',
  );
});
