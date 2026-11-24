/**
 * The reciprocal-space workbench: a picture, its transform, and the picture
 * rebuilt from what is kept of it.
 *
 * The figures are canvases, so what a unit test cannot see — that each one was
 * painted, and that a click on the transform changes what is rebuilt — is read
 * off their pixels here. A point of a field is aimed at by the pixel it is, so
 * a click on (144, 128) is a click on the spot 16 px right of the centre.
 */

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 60_000 });

/** The side of every field, in pixels. */
const FIELD = 256;

/** A 1 × 1 PNG, the smallest picture a browser decodes. */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * Where on screen a pixel of a field is.
 * @param page - The page under test.
 * @param testId - The field.
 * @param column - Its column, 0 at the left.
 * @param row - Its row, 0 at the top.
 * @returns The point at the middle of that pixel.
 */
async function pointOf(
  page: Page,
  testId: string,
  column: number,
  row: number,
): Promise<{ x: number; y: number }> {
  const box = await page.getByTestId(testId).locator('svg').boundingBox();
  if (box === null) throw new Error(`${testId} is not on screen`);
  return {
    x: box.x + ((column + 0.5) * box.width) / FIELD,
    y: box.y + ((row + 0.5) * box.height) / FIELD,
  };
}

/**
 * What a field's canvas holds, reduced to a fingerprint.
 * @param page - The page under test.
 * @param testId - The field.
 * @returns How many distinct grey levels it shows, and the sum of them all.
 */
async function painted(
  page: Page,
  testId: string,
): Promise<{ levels: number; sum: number }> {
  return page
    .getByTestId(testId)
    .locator('canvas')
    .evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d');
      if (context === null) return { levels: 0, sum: 0 };
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      const levels = new Set<number>();
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        levels.add(data[i] ?? 0);
        sum += data[i] ?? 0;
      }
      return { levels: levels.size, sum };
    });
}

async function greyLevels(page: Page, testId: string): Promise<number> {
  const { levels } = await painted(page, testId);
  return levels;
}

async function greySum(page: Page, testId: string): Promise<number> {
  const { sum } = await painted(page, testId);
  return sum;
}

function search(page: Page): string {
  return new URL(page.url()).search;
}

test('the page opens on a square lattice, its transform, and the same image back', async ({
  page,
}) => {
  await page.goto('/reciprocal');
  await expect(page.getByTestId('page-reciprocal')).toBeVisible();

  await Promise.all(
    ['reciprocal-image', 'reciprocal-transform', 'reciprocal-rebuilt'].map(
      (field) => expect.poll(() => greyLevels(page, field)).toBeGreaterThan(2),
    ),
  );
  await expect(page.getByTestId('reciprocal-notes')).toContainText(
    'Dots every 16 px give spots every 256 / 16 = 16 px',
  );
  await expect(page.getByTestId('reciprocal-notes')).toContainText(
    'a* = 1 / (a sin γ) = 0.0625 px⁻¹',
  );
  await expect(page.getByTestId('rebuilt-caption')).toContainText(
    'From every coefficient',
  );
});

test('pointing at a spot names it, and a click rebuilds the image from it alone', async ({
  page,
}) => {
  await page.goto('/reciprocal');
  const before = await greySum(page, 'reciprocal-rebuilt');
  const spot = await pointOf(page, 'reciprocal-transform', 144, 128);

  await page.mouse.move(spot.x, spot.y);
  await expect(page.getByTestId('spot-readout')).toContainText(
    'waves 16.0 px apart, at 0°',
  );
  await expect(page.getByTestId('spot-readout')).toContainText('(1 0)');

  await page.mouse.click(spot.x, spot.y);
  await expect.poll(() => search(page)).toBe('?mask=spots&spots=0,0,16,0');
  await expect(page.getByTestId('rebuilt-caption')).toContainText(
    'From 87 of 65,536 coefficients.',
  );
  await expect.poll(() => greySum(page, 'reciprocal-rebuilt')).not.toBe(before);
});

test('a low-pass disk is set from its button and sized by a click', async ({
  page,
}) => {
  await page.goto('/reciprocal?example=letter-f');
  await page.getByText('Low-pass', { exact: true }).click();
  await expect.poll(() => search(page)).toBe('?example=letter-f&mask=low');

  const edge = await pointOf(page, 'reciprocal-transform', 138, 128);
  await page.mouse.click(edge.x, edge.y);
  await expect
    .poll(() => search(page))
    .toBe('?example=letter-f&mask=low&radius=10');
});

test('a drag over the image transforms only that part', async ({ page }) => {
  await page.goto('/reciprocal');
  const start = await pointOf(page, 'reciprocal-image', 60, 60);
  const end = await pointOf(page, 'reciprocal-image', 120, 110);

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 6 });
  await page.mouse.up();

  await expect.poll(() => search(page)).toBe('?region=60,60,61,51');
  await expect(page.getByTestId('page-reciprocal')).toContainText(
    'Only the 61 × 51 px left clear is transformed',
  );
  await page.getByRole('button', { name: 'Whole image' }).click();
  await expect.poll(() => search(page)).toBe('');
});

test('an example opens from its chip, and the address names it', async ({
  page,
}) => {
  await page.goto('/reciprocal');
  const slit = page.locator('[data-example="slit"]');

  await slit.click();
  await expect.poll(() => search(page)).toBe('?example=slit');
  await expect(slit).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('reciprocal-notes')).toContainText(
    'spreads into a streak across it',
  );
  // A drawing has no lattice, so there are no lattice settings to show.
  await expect(page.getByTestId('reciprocal-lattice')).toHaveCount(0);
});

test('a lattice setting builds a crystal the address names whole', async ({
  page,
}) => {
  await page.goto('/reciprocal');
  const a = page.getByTestId('lattice-a');

  await a.fill('20');
  await a.press('Tab');
  await expect
    .poll(() => search(page))
    .toBe(
      '?example=square-lattice&a=20&b=16&gamma=90&basis=dot&crystal=90&noise=0',
    );
  await expect(page.getByTestId('reciprocal-notes')).toContainText(
    'a* = 1 / (a sin γ) = 0.0500 px⁻¹',
  );
});

test('another picture’s phases take over the rebuilt image', async ({
  page,
}) => {
  await page.goto('/reciprocal?example=letter-f');
  await page.getByText('Phases of…', { exact: true }).click();

  await expect.poll(() => search(page)).toBe('?example=letter-f&phase=swap');
  await expect(page.getByTestId('rebuilt-caption')).toContainText(
    'looks like the picture lending the phases',
  );
  await page
    .getByRole('combobox', { name: 'The picture lending its phases' })
    .selectOption('three-blades');
  await expect
    .poll(() => search(page))
    .toBe('?example=letter-f&phase=swap&phaseFrom=three-blades');
});

test('a picture opened from a file is what gets transformed', async ({
  page,
}) => {
  await page.goto('/reciprocal?example=slit');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'dot.png',
    mimeType: 'image/png',
    buffer: TINY_PNG,
  });

  await expect(page.getByRole('button', { name: 'dot.png' })).toBeVisible();
  // No address can name a picture of one's own, so none is written.
  await expect.poll(() => search(page)).toBe('');
  await expect(page.getByTestId('reciprocal-notes')).toContainText(
    'Your picture, cut to its central square',
  );
});

test('a framed link drops the chrome, and hiding the rebuilt image leaves two', async ({
  page,
}) => {
  await page.goto('/reciprocal?embed=1&hide=rebuilt,notes');

  await expect(page.getByTestId('reciprocal-transform')).toBeVisible();
  await expect(page.locator('.app-header')).toHaveCount(0);
  await expect(page.getByTestId('reciprocal-rebuilt')).toHaveCount(0);
  await expect(page.getByTestId('reciprocal-notes')).toHaveCount(0);
  const image = await page.getByTestId('reciprocal-image').boundingBox();
  const transform = await page
    .getByTestId('reciprocal-transform')
    .boundingBox();
  if (image === null || transform === null) throw new Error('not on screen');
  // Side by side, the transform taking the rest of the row.
  expect(image.x + image.width).toBeLessThanOrEqual(transform.x);
  expect(transform.width).toBeGreaterThan(image.width);
});

test('the Share dialog hands out any example, whatever is on screen', async ({
  page,
}) => {
  await page.goto('/reciprocal?example=slit');
  await page.getByRole('button', { name: 'Share' }).click();

  const dialog = page.locator('.share-dialog');
  const href = () => dialog.locator('.share-linkbar a').getAttribute('href');
  const opensOn = dialog.getByRole('radiogroup', { name: 'Opens on' });
  const example = opensOn.getByRole('combobox', { name: 'Example' });

  await expect(
    opensOn.getByRole('radio', { name: 'An example' }),
  ).toBeChecked();
  await expect(example).toHaveValue('slit');
  await example.selectOption('glide');
  await expect.poll(href).toMatch(/\/reciprocal\?(?:.+&)?example=glide(?:&|$)/);

  // A crystal changed from an example is carried whole.
  await page.keyboard.press('Escape');
  await page.goto('/reciprocal?example=glide&a=20');
  await page.getByRole('button', { name: 'Share' }).click();
  // Changed since it opened, so what is on screen is the link offered first.
  await expect(
    opensOn.getByRole('radio', { name: 'What is on screen' }),
  ).toBeChecked();
  await expect
    .poll(href)
    .toMatch(/a=20&b=32&gamma=90&basis=glide&crystal=90&noise=0/);
});

test('on a phone the figures stack and nothing scrolls sideways', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/reciprocal?example=glide&phase=swap');
  await expect(page.getByTestId('reciprocal-rebuilt')).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBe(0);
  const image = await page.getByTestId('reciprocal-image').boundingBox();
  const transform = await page
    .getByTestId('reciprocal-transform')
    .boundingBox();
  if (image === null || transform === null) throw new Error('not on screen');
  expect(transform.y).toBeGreaterThan(image.y + image.height);
});
