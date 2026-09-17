/**
 * Sharing: `?embed` drops the chrome, `?hide=` drops the part it names, and the
 * link the dialog writes reopens exactly what it describes.
 *
 * The round trip is the test that matters. A dialog that writes a link nobody
 * can open again is worse than no dialog, and nothing below a browser can tell
 * the two apart: the link is read out of the dialog, navigated to, and the page
 * it lands on is checked against the boxes that were ticked.
 */

import { expect, test } from '@playwright/test';

// Playwright's stock thirty seconds is a page's own time; these run several at a
// time against the one `npm run dev` behind them, where a page that renders in
// two seconds alone takes ten while five browsers ask that server at once. The
// ceiling is the contention, not the page — a green run is nowhere near it.
test.describe.configure({ timeout: 60_000 });

for (const search of ['?embed', '?embed=1']) {
  test(`/plane${search} renders no header, no footer, and the tool still works`, async ({
    page,
  }) => {
    await page.goto(`/plane${search}&planeGroup=p4m&tiles=2`);

    await expect(page.getByTestId('page-plane')).toBeVisible();
    await expect(page.getByRole('banner')).toHaveCount(0);
    await expect(page.getByRole('contentinfo')).toHaveCount(0);
    await expect(page.locator('nav.app-header-nav')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Share' })).toHaveCount(0);

    // The tool itself is untouched: p4m over 2×2 square cells is 8 × 4 copies.
    await expect(page.locator('use.pattern-copy')).toHaveCount(32);
  });
}

test('?hide= drops the part it names and leaves the rest standing', async ({
  page,
}) => {
  await page.goto('/cheatsheet');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Cheatsheet' }),
  ).toBeVisible();

  await page.goto('/cheatsheet?hide=intro');

  await expect(page.getByTestId('page-cheatsheet')).toBeVisible();
  await expect(page.locator('main h1')).toHaveCount(0);
  // Hidden is the heading, not the reference: the page is still the page.
  await expect(page.locator('main')).not.toBeEmpty();
  // The chrome is untouched — only `?embed` drops that.
  await expect(page.getByRole('banner')).toHaveCount(1);
});

test('an unknown hide key is ignored rather than thrown on', async ({
  page,
}) => {
  await page.goto('/cheatsheet?hide=intro,nosuchpart');

  await expect(page.getByTestId('page-cheatsheet')).toBeVisible();
  await expect(page.locator('main h1')).toHaveCount(0);
});

test('hiding the exercise list leaves the open question alone', async ({
  page,
}) => {
  await page.goto('/exercises/point-group-water?embed=1&hide=list,hints');

  await expect(page.locator('.exercises-sidebar')).toHaveCount(0);
  await expect(
    page.locator('.exercise-card').getByRole('heading', { level: 1 }),
  ).toHaveText('Assign water');
  await expect(
    page.getByRole('button', { name: /^Reveal hint/ }),
  ).toBeVisible();
});

test('the dialog writes a link and an iframe, and the link reopens the page', async ({
  page,
}) => {
  await page.goto('/plane?planeGroup=p4g&tiles=3');
  await page.getByRole('button', { name: 'Share' }).click();

  const dialog = page.locator('.share-dialog');
  const link = dialog.locator('.code-block pre').nth(0);
  const frame = dialog.locator('.code-block pre').nth(1);

  // The address bar contributes the tool's settings, the dialog the rest.
  await expect(link).toHaveText(/\/plane\?planeGroup=p4g&tiles=3$/);
  await expect(frame).toHaveText(/^<iframe src="http.+\/plane\?planeGroup=p4g/);
  await expect(frame).toHaveText(/height="640"/);
  await expect(frame).toHaveText(/title="symmetry\.cheminfo\.org — Plane"/);

  await dialog.getByText('Embed in another page', { exact: true }).click();
  await expect(link).toHaveText(/\/plane\?embed=1&planeGroup=p4g&tiles=3$/);

  await dialog.getByText('Motif editor', { exact: true }).click();
  const shared = (await link.textContent()) ?? '';
  expect(shared).toMatch(/\/plane\?embed=1&hide=motif&planeGroup=p4g&tiles=3$/);

  await page.goto(shared);

  await expect(page.getByTestId('page-plane')).toBeVisible();
  await expect(page.getByRole('banner')).toHaveCount(0);
  await expect(page.locator('.plane-groups')).toHaveCount(0);
  // p4g over 3×3 square cells, unchanged by the framing: 8 × 9.
  await expect(page.locator('use.pattern-copy')).toHaveCount(72);
});

test('a framed page that carries a molecule still assigns it', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto('/?embed=1&hide=picker,characters&molecule=benzene');

  const workbench = page.getByTestId('page-molecules');
  await expect(workbench.locator('.mol-verdict')).toHaveText(
    'D6h24 operations',
  );
  await expect(page.getByRole('banner')).toHaveCount(0);
  await expect(workbench.locator('.mol-panel__title')).toHaveText([
    'How it is assigned',
    'Operations, by class',
  ]);
  // The library column goes with the library, so the two panes left share the
  // width rather than leaving a third of the frame empty.
  await expect(page.locator('.pane-grid')).toHaveAttribute('data-panes', 'two');
});
