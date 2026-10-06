/**
 * The splitter between a tutorial step's prose and its live view, and the share
 * it comes to rest at travelling in the address.
 *
 * What a link opens has to be what it was shared from, so the share is read off
 * the rendered widths rather than off the state: a parameter that lands in the
 * URL and divides nothing would pass every unit test there is.
 */

import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// The dialog hands the iframe snippet over through the clipboard, which is the
// only place it is ever written.
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

// Playwright's stock thirty seconds is a page's own time; these run several at a
// time against the one preview server behind them, where a page that renders in
// two seconds alone takes ten while five browsers ask that server at once. The
// ceiling is the contention, not the page — a green run is nowhere near it.
test.describe.configure({ timeout: 60_000 });

/** A lecture-hall screen: wide enough for the prose and the view at once. */
const WIDE = { width: 1512, height: 900 };

/** One column of page: there is no room for two, so the panes stack. */
const NARROW = { width: 800, height: 1000 };

/**
 * A step whose object is a plane group, so the stage is two SVGs rather than a
 * WebGL context: the row is the same row, and nothing here waits on molstar.
 */
const STEP = '/tutorial/plane-groups';

test('the row opens at the share the page chose, and the link stays plain', async ({
  page,
}) => {
  await page.setViewportSize(WIDE);
  await page.goto(STEP);

  // A step is read before it is turned, so the two halves start level.
  expect(await shareOfRow(page)).toBeCloseTo(48, -0.5);
  expect(page.url()).not.toContain('split');
});

test('the share a splitter is dragged to lands in the address', async ({
  page,
}) => {
  await page.setViewportSize(WIDE);
  await page.goto(STEP);
  const before = await shareOfRow(page);

  await dragSplitter(page, -260);

  const after = await shareOfRow(page);
  expect(after).toBeLessThan(before - 10);
  await expect(page).toHaveURL(/[?&]split=\d+/);
  const named = Number(new URL(page.url()).searchParams.get('split'));
  expect(named).toBeCloseTo(after, -0.5);
});

test('a double click on the splitter puts the row back where the page had it', async ({
  page,
}) => {
  await page.setViewportSize(WIDE);
  await page.goto(`${STEP}?split=70`);
  expect(await shareOfRow(page)).toBeCloseTo(70, -0.5);

  await splitter(page).dblclick();

  expect(await shareOfRow(page)).toBeCloseTo(48, -0.5);
  await expect(page).not.toHaveURL(/[?&]split=/);
});

test('a link that names a share opens the row divided at it', async ({
  page,
}) => {
  await page.setViewportSize(WIDE);
  await page.goto(`${STEP}?split=30`);

  expect(await shareOfRow(page)).toBeCloseTo(30, -0.5);
  // The step itself is untouched by the share it is read at.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'The two-dimensional rehearsal',
  );
});

test('a share nobody could drag to still opens the page', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto(`${STEP}?split=995`);

  // Brought back inside the range rather than taken literally, and the address
  // is rewritten to the share actually drawn.
  expect(await shareOfRow(page)).toBeCloseTo(80, -0.5);
  await expect(page).toHaveURL(/[?&]split=80/);
  await expect(page.getByTestId('page-tutorial')).toBeVisible();
});

test('the share a splitter was left at is in the link the dialog hands out', async ({
  page,
}) => {
  await page.setViewportSize(WIDE);
  await page.goto(STEP);
  await dragSplitter(page, -260);
  const named = new URL(page.url()).searchParams.get('split');
  expect(named).not.toBeNull();

  await page.getByRole('button', { name: 'Share' }).click();
  const dialog = page.locator('.share-dialog');
  const href = () => dialog.locator('.share-linkbar a').getAttribute('href');

  await expect.poll(href).toContain(`split=${named}`);

  await dialog.getByRole('button', { name: 'Copy the iframe' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    `split=${named}`,
  );
});

test('a narrow screen stacks the two and draws no splitter', async ({
  page,
}) => {
  await page.setViewportSize(NARROW);
  await page.goto(STEP);

  const prose = await box(page.getByTestId('split-start'));
  const stage = await box(page.getByTestId('split-end'));
  expect(stage.y).toBeGreaterThan(prose.y + prose.height - 1);
  await expect(splitter(page)).toHaveCount(0);
});

test('a link that left nothing in the prose gives the view the whole width', async ({
  page,
}) => {
  await page.setViewportSize(WIDE);
  await page.goto(`${STEP}?hide=text,demos`);

  // This step draws no panel, so its text and its demo button were the whole
  // of that half: there is no share of the row left to give it.
  await expect(page.getByTestId('split-start')).toHaveCount(0);
  await expect(splitter(page)).toHaveCount(0);
  const stage = await box(page.getByTestId('split-end'));
  expect(stage.width).toBeGreaterThan(WIDE.width - 60);
});

test('a step that draws a panel keeps its half of the row', async ({
  page,
}) => {
  await page.setViewportSize(WIDE);
  await page.goto('/tutorial/order-and-closure?hide=text,demos');

  // The multiplication table is what that step is about, so the half it sits
  // in stays, and the splitter with it.
  await expect(page.getByTestId('split-start')).toBeVisible();
  await expect(page.locator('.product-table table')).toBeVisible();
  expect(await shareOfRow(page)).toBeCloseTo(48, -0.5);

  // The pane the splitter puts the prose in clips what overflows it, so a
  // half it cannot hold would lose the end of the table with nothing on screen
  // to say so. Nothing in either half may overflow the width it was given.
  expect(await overflowOf(page, 'split-start')).toBeLessThanOrEqual(1);
  expect(await overflowOf(page, 'split-end')).toBeLessThanOrEqual(1);
});

test('a table wider than the half it was given scrolls rather than losing a column', async ({
  page,
}) => {
  await page.setViewportSize(WIDE);
  // The narrowest half a splitter can be dragged to, under the widest table of
  // the tour: before the row could be dragged this width was a phone's, and a
  // student on a laptop can now reach it in one gesture.
  await page.goto('/tutorial/character-table-c2v?split=20');

  const table = page.locator('.mol-table-scroll');
  await expect(table).toBeVisible();
  expect(
    await table.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    ),
  ).toBeGreaterThan(0);

  // The quadratic functions are the last column, and what a character table is
  // consulted for: scrolled to, they are whole and inside the box.
  const reached = await table.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
    const cells = [...element.querySelectorAll('.mol-table__functions')];
    const last = cells.at(-1);
    if (last === undefined) return null;
    return (
      last.getBoundingClientRect().right - element.getBoundingClientRect().right
    );
  });
  expect(reached).not.toBeNull();
  expect(reached).toBeLessThanOrEqual(1);
});

/**
 * How much wider than the pane it sits in the content of one half is.
 * @param page - The page under test.
 * @param testId - Which half to measure.
 * @returns The overflow in pixels; anything above zero is cut off on screen.
 */
async function overflowOf(page: Page, testId: string): Promise<number> {
  return page
    .getByTestId(testId)
    .evaluate((element) => element.scrollWidth - element.clientWidth);
}

/** The splitter: the bar react-science draws between the two panes. */
function splitter(page: Page): Locator {
  return page.locator(
    'xpath=//*[@data-testid="split-start"]/../following-sibling::div[1]',
  );
}

/**
 * Take the splitter and let it go somewhere else.
 * @param page - The page under test.
 * @param by - How far to drag it, in pixels; negative is left.
 */
async function dragSplitter(page: Page, by: number): Promise<void> {
  const bar = await box(splitter(page));
  await page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);
  await page.mouse.down();
  await page.mouse.move(bar.x + bar.width / 2 + by, bar.y + bar.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
}

/**
 * The share of the row the prose actually takes, as drawn.
 * @param page - The page under test.
 * @returns The percentage, read off the two panes themselves.
 */
async function shareOfRow(page: Page): Promise<number> {
  const prose = await box(page.getByTestId('split-start'));
  const stage = await box(page.getByTestId('split-end'));
  return (prose.width / (prose.width + stage.width)) * 100;
}

async function box(locator: Locator) {
  await expect(locator).toBeVisible();
  const rect = await locator.boundingBox();
  expect(rect).not.toBeNull();
  return rect ?? { x: 0, y: 0, width: 0, height: 0 };
}
