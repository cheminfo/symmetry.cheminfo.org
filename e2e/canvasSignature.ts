/**
 * Reading what a WebGL canvas is actually showing, from an end-to-end test.
 *
 * Every unit test in `src/` stops at the boundary of the GPU, so nothing else
 * can tell a correctly-built scene from a blank rectangle. These helpers reduce
 * the canvas to a small luminance fingerprint: a canvas that never painted is
 * one flat colour, and an orbital that changed must move a measurable share of
 * the samples.
 *
 * The screenshot goes through the compositor, so it works whether or not
 * molstar keeps its drawing buffer — `toDataURL()` on a WebGL canvas created
 * without `preserveDrawingBuffer` returns a blank frame and would make every
 * test using it lie.
 */

import type { Locator, Page } from '@playwright/test';

/** The canvas is reduced to this many luminance samples per side. */
export const SIGNATURE_SIZE = 32;

/** Luminance steps (0–255) two samples must differ by to count as changed. */
export const CHANGE_THRESHOLD = 6;

/**
 * A 32×32 luminance fingerprint of what the canvas is showing.
 *
 * @param page - The page the canvas lives in.
 * @param canvas - The canvas element.
 * @returns One luminance value per sample, row by row.
 */
export async function signatureOf(
  page: Page,
  canvas: Locator,
): Promise<number[]> {
  const shot = await canvas.screenshot();
  return page.evaluate(
    async ([dataUrl, size]) => {
      const response = await fetch(dataUrl as string);
      const bitmap = await createImageBitmap(await response.blob());
      const side = Number(size);
      const surface = document.createElement('canvas');
      surface.width = side;
      surface.height = side;
      const context = surface.getContext('2d');
      if (context === null) return [];
      context.drawImage(bitmap, 0, 0, side, side);
      const { data } = context.getImageData(0, 0, side, side);
      const luminance: number[] = [];
      for (let index = 0; index < data.length; index += 4) {
        luminance.push(
          0.2126 * (data[index] ?? 0) +
            0.7152 * (data[index + 1] ?? 0) +
            0.0722 * (data[index + 2] ?? 0),
        );
      }
      return luminance;
    },
    [
      `data:image/png;base64,${shot.toString('base64')}`,
      String(SIGNATURE_SIZE),
    ],
  );
}

/**
 * Poll until the canvas shows more than one colour.
 *
 * @param page - The page the canvas lives in.
 * @param canvas - The canvas element.
 * @param timeoutMs - How long to keep waiting.
 * @returns The last fingerprint taken, painted or not.
 */
export async function waitForPaint(
  page: Page,
  canvas: Locator,
  timeoutMs: number,
): Promise<number[]> {
  const deadline = Date.now() + timeoutMs;
  let signature = await signatureOf(page, canvas);
  /* eslint-disable no-await-in-loop -- polling: each fingerprint is taken only
     after waiting on the one before it, so the reads cannot be concurrent. */
  while (Date.now() < deadline && distinctLevels(signature) < 6) {
    await page.waitForTimeout(1000);
    signature = await signatureOf(page, canvas);
  }
  /* eslint-enable no-await-in-loop */
  return signature;
}

/**
 * Poll until two consecutive fingerprints agree, so a camera transition is not
 * mistaken for the effect of a click.
 *
 * @param page - The page the canvas lives in.
 * @param canvas - The canvas element.
 * @param start - The fingerprint to start comparing from.
 * @returns The settled fingerprint.
 * @throws When the scene never settles.
 */
export async function waitForStable(
  page: Page,
  canvas: Locator,
  start: number[],
): Promise<number[]> {
  let previous = start;
  /* eslint-disable no-await-in-loop -- polling: a frame is compared with the
     one before it, so the attempts are sequential by definition. */
  for (let attempt = 0; attempt < 15; attempt++) {
    await page.waitForTimeout(1000);
    const current = await signatureOf(page, canvas);
    if (changedFraction(previous, current) < 0.01) return current;
    previous = current;
  }
  /* eslint-enable no-await-in-loop */
  throw new Error(
    'The scene kept moving on its own, so the effect of a click cannot be told apart from an animation.',
  );
}

/**
 * Poll until the canvas differs from `before`, or the deadline passes.
 *
 * @param page - The page the canvas lives in.
 * @param canvas - The canvas element.
 * @param before - The fingerprint to differ from.
 * @param timeoutMs - How long to keep waiting.
 * @returns The last fingerprint taken.
 */
export async function waitForChange(
  page: Page,
  canvas: Locator,
  before: number[],
  timeoutMs: number,
): Promise<number[]> {
  const deadline = Date.now() + timeoutMs;
  let current = await signatureOf(page, canvas);
  /* eslint-disable no-await-in-loop -- polling: the canvas is read again only
     after waiting, until it differs from `before` or the deadline passes. */
  while (Date.now() < deadline && changedFraction(before, current) <= 0.02) {
    await page.waitForTimeout(500);
    current = await signatureOf(page, canvas);
  }
  /* eslint-enable no-await-in-loop */
  return current;
}

/**
 * How many distinct luminance steps the frame holds.
 *
 * @param signature - A fingerprint.
 * @returns The count; 1 means a blank canvas.
 */
export function distinctLevels(signature: number[]): number {
  const levels = new Set<number>();
  for (const value of signature) {
    levels.add(Math.round(value / 4));
  }
  return levels.size;
}

/**
 * Peak-to-peak luminance.
 *
 * @param signature - A fingerprint.
 * @returns The range, 0 on a uniform frame.
 */
export function spread(signature: number[]): number {
  if (signature.length === 0) return 0;
  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  for (const value of signature) {
    if (value < low) low = value;
    if (value > high) high = value;
  }
  return high - low;
}

/**
 * Share of samples that moved by more than {@link CHANGE_THRESHOLD}.
 *
 * @param before - Fingerprint taken first.
 * @param after - Fingerprint taken second.
 * @returns A fraction between 0 and 1.
 */
export function changedFraction(before: number[], after: number[]): number {
  if (before.length === 0 || before.length !== after.length) return 1;
  let changed = 0;
  for (let index = 0; index < before.length; index++) {
    if (
      Math.abs((before[index] ?? 0) - (after[index] ?? 0)) > CHANGE_THRESHOLD
    ) {
      changed++;
    }
  }
  return changed / before.length;
}
