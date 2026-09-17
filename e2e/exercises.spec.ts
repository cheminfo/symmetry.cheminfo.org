/**
 * The exercises: one answered wrongly, one answered rightly, and the exact
 * sentence each one comes back with.
 *
 * Nothing here is marked against a stored string. `point-group-water` runs the
 * detector over water's coordinates and compares what it found with what was
 * typed, so the feedback names both — which is what makes the failure teach
 * rather than scold.
 */

import { expect, test } from '@playwright/test';

import { EXERCISES } from '../src/data/exercises/index.ts';

// Playwright's stock thirty seconds is a page's own time; these run several at a
// time against the one `npm run dev` behind them, where a page that renders in
// two seconds alone takes ten while five browsers ask that server at once. The
// ceiling is the contention, not the page — a green run is nowhere near it.
test.describe.configure({ timeout: 60_000 });

/** The question the assertions below are written against. */
const WATER = '/exercises/point-group-water';

/** What the deck's progress line reads when `solved` of them are solved. */
function progress(solved: number): string {
  return `${solved} / ${EXERCISES.length} solved`;
}

test('a wrong symbol is marked against the structure, and says both', async ({
  page,
}) => {
  await page.goto(WATER);

  const card = page.locator('.exercise-card');
  await expect(card.getByRole('heading', { level: 1 })).toHaveText(
    'Assign water',
  );
  // Nothing typed, so there is nothing to mark yet.
  await expect(
    page.getByRole('button', { name: 'Check', exact: true }),
  ).toBeDisabled();

  await page.getByPlaceholder('C2v').fill('C3v');
  await page.getByRole('button', { name: 'Check', exact: true }).click();

  const verdict = page.locator('.exercise-verdict');
  await expect(verdict).toContainText('Not yet');
  await expect(verdict).toContainText(
    '1 of 4 checks below did not come out. Each one says what it got and what it wanted.',
  );
  await expect(
    verdict.getByText('you answered C3v; this structure is C2v', {
      exact: true,
    }),
  ).toBeVisible();
  // The three near misses are still right: C3v is not one of them.
  await expect(
    verdict.getByText(
      'not C2h — there is no σh: both of water’s planes contain the C2 axis, so both are σv.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.locator('.exercises-sidebar')).toContainText(progress(0));
});

test('a near miss is named as the near miss it is', async ({ page }) => {
  await page.goto(WATER);

  await page.getByPlaceholder('C2v').fill('D2h');
  await page.getByRole('button', { name: 'Check', exact: true }).click();

  const verdict = page.locator('.exercise-verdict');
  await expect(
    verdict.getByText('you answered D2h; this structure is C2v', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    verdict.getByText(
      'D2h needs two more C2 axes perpendicular to the first, and water has none.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(verdict).toContainText('2 of 4 checks below did not come out.');
});

test('the right symbol solves it, and the deck counts it', async ({ page }) => {
  await page.goto(WATER);

  await page.getByPlaceholder('C2v').fill('C2v');
  await page.getByRole('button', { name: 'Check', exact: true }).click();

  const verdict = page.locator('.exercise-verdict');
  await expect(verdict.getByText('C2v: right.', { exact: true })).toBeVisible();
  await expect(verdict).not.toContainText('Not yet');
  await expect(page.locator('.exercises-sidebar')).toContainText(progress(1));
});

test('the hints open one at a time, and the solved row says how many were used', async ({
  page,
}) => {
  await page.goto(WATER);

  const hint = page.getByRole('button', { name: /^Reveal hint/ });
  await expect(hint).toHaveText('Reveal hint (0/3)');
  await hint.click();
  await expect(hint).toHaveText('Reveal hint (1/3)');
  await expect(
    page.getByText(
      'Find the highest-order rotation axis first: everything else is named against it.',
      { exact: true },
    ),
  ).toBeVisible();
  // The second hint is not out yet.
  await expect(
    page.getByText(
      'Both mirror planes contain the C2 axis, which makes them σv rather than σh.',
      { exact: true },
    ),
  ).toHaveCount(0);

  await page.getByPlaceholder('C2v').fill('C2v');
  await page.getByRole('button', { name: 'Check', exact: true }).click();

  await expect(page.locator('.exercises-sidebar')).toContainText(
    'Solved with 1 hint',
  );
});

test('the solution is always one click away', async ({ page }) => {
  await page.goto(WATER);

  await page
    .getByRole('button', { name: 'Reveal solution', exact: true })
    .click();

  await expect(
    page.getByRole('button', { name: 'Hide solution', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.exercise-card')).toContainText('One answer');
});

test('an exercise id nobody minted opens the list', async ({ page }) => {
  await page.goto('/exercises/not-an-exercise');

  await expect(page.getByTestId('page-exercises')).toBeVisible();
  await expect(page.locator('.exercise-card')).toHaveCount(0);
  await expect(
    page.getByText('Pick a question', { exact: true }),
  ).toBeVisible();
});
