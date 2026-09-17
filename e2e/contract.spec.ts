/**
 * Every routed address loads, and loads clean.
 *
 * The table is `src/seo/routes.ts` — the one the build writes an HTML file per
 * entry from and the sitemap lists — so a page added there is walked here
 * without this file changing. Nothing below asserts what is on a page, only
 * that the shell mounted the page the address names and that the console stayed
 * silent: a page that throws is a page a visitor sees half of.
 *
 * The 365 addresses are walked in chunks rather than in one test, so they run
 * side by side on the workers and a failure names a range instead of a
 * catalogue.
 */

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { FIXED_ROUTES, PAGE_ROUTES } from '../src/seo/routes.ts';

// The two tests here that do not set their own ceiling still walk a dozen
// addresses each, which Playwright's stock thirty seconds does not cover.
test.describe.configure({ timeout: 60_000 });

/**
 * How long one address is allowed, on top of a minute of start-up.
 *
 * Twenty seconds is far above the two an address costs on its own, and that
 * headroom is the point: several of these walks run at once against the single
 * `npm run dev` behind them, and a page that renders in two seconds alone takes
 * ten when five browsers are asking the same server at the same time. The
 * number is a ceiling, not a cost — a green run is nowhere near it.
 */
const PER_PATH_BUDGET_MS = 20_000;

/** How long one address may take to arrive before it is asked for again. */
const NAVIGATION_TIMEOUT_MS = 20_000;

/** How many times an address is asked for before it counts as a failure. */
const ATTEMPTS = 3;

/** What the last address of a walk is given to throw in, as the others are. */
const SETTLE_MS = 1000;

/**
 * The most addresses one test walks.
 *
 * Each test gets its own browser page, and a page that has walked a few dozen
 * addresses of `npm run dev` stops answering: every one of them is hundreds of
 * module requests down six connections, and the pool eventually does not come
 * back — the renderer then sits at no CPU while the server answers a fresh
 * connection in a quarter of a second. Twenty-five keeps every walk inside that,
 * and a failure names a range of twenty-five rather than a catalogue.
 */
const CHUNK = 25;

/**
 * The addresses, grouped by what they are: the fixed pages, then each
 * catalogue. One browser page walks a whole chunk, so the dev server's modules
 * come from the browser cache after its first address.
 */
const ROUTE_GROUPS = new Map<string, string[]>();
for (const route of PAGE_ROUTES) {
  const segments = route.path.split('/').filter((segment) => segment !== '');
  const group = segments.length > 1 ? `/${segments[0]}/<id>` : 'the pages';
  const paths = ROUTE_GROUPS.get(group) ?? [];
  paths.push(route.path);
  ROUTE_GROUPS.set(group, paths);
}

test('the table holds every fixed page and every catalogue entry', () => {
  // A route table that silently shrank would make every walk below pass while
  // covering nothing, so the counts are pinned: 11 pages, 53 point groups, 230
  // space groups, 17 wallpaper groups, 7 frieze groups, 18 tutorial steps and
  // 29 exercises.
  expect(FIXED_ROUTES).toHaveLength(11);
  expect(
    [...ROUTE_GROUPS].map(([group, paths]) => `${group}: ${paths.length}`),
  ).toStrictEqual([
    'the pages: 11',
    '/point-groups/<id>: 53',
    '/space-groups/<id>: 230',
    '/wallpaper/<id>: 17',
    '/frieze/<id>: 7',
    '/tutorial/<id>: 18',
    '/exercises/<id>: 29',
  ]);
  expect(PAGE_ROUTES).toHaveLength(365);
});

for (const [group, paths] of ROUTE_GROUPS) {
  for (let first = 0; first < paths.length; first += CHUNK) {
    walk(group, paths, first);
  }
}

/**
 * One test walking at most {@link CHUNK} addresses of a group.
 *
 * @param group - What the addresses are, for the test's name.
 * @param paths - Every address of the group.
 * @param first - Where this chunk starts in it.
 */
function walk(group: string, paths: readonly string[], first: number): void {
  const slice = paths.slice(first, first + CHUNK);
  const range =
    paths.length <= CHUNK
      ? `${paths.length}`
      : `${first + 1}–${first + slice.length} of ${paths.length}`;

  test(`every address of ${group} loads without an error (${range})`, async ({
    page,
  }) => {
    test.setTimeout(60_000 + slice.length * PER_PATH_BUDGET_MS);

    let current = '';
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(`${current}: ${error.message}`);
    });
    page.on('console', (message) => {
      if (message.type() === 'error' && !isDevServerNoise(message.text())) {
        errors.push(`${current}: ${message.text()}`);
      }
    });

    /* eslint-disable no-await-in-loop -- the slice is walked one address at a
       time on purpose: opening 365 pages at once would starve the dev server
       and lose which address an error came from. */
    for (const path of slice) {
      current = path;
      await openAddress(page, path);
    }
    /* eslint-enable no-await-in-loop */

    // The listeners live for the whole walk, so an address that throws a moment
    // after it mounted is caught while the next one is loading. The last one
    // has nothing after it, so it is given the same moment here.
    await page.waitForTimeout(SETTLE_MS);

    expect(errors).toStrictEqual([]);
  });
}

test('every page carries its own title, and no two are the same', async ({
  page,
}) => {
  // Twelve addresses, one per kind, rather than all 365: what a crawler reads
  // off the served HTML is `src/__tests__/routes.test.ts`, and what matters here
  // is that the running app retitles the tab after a move.
  const sample = [
    '/',
    '/crystals',
    '/plane',
    '/tutorial',
    '/exercises',
    '/cheatsheet',
    '/about',
    '/point-groups/c2v',
    '/point-groups/oh',
    '/space-groups/225',
    '/wallpaper/p4g',
    '/frieze/p2mg',
  ];
  test.info().annotations.push({
    type: 'sampled',
    description: `${sample.length} of ${PAGE_ROUTES.length} addresses: ${sample.join(' ')}`,
  });

  const titles: string[] = [];
  /* eslint-disable no-await-in-loop -- one page, moved from address to address:
     the title is read after each move, so the moves are sequential. */
  for (const path of sample) {
    await openAddress(page, path);
    const title = await page.title();
    expect(title, path).toMatch(/ — SymmeTry$/);
    titles.push(title);
  }
  /* eslint-enable no-await-in-loop */
  expect(new Set(titles).size).toBe(sample.length);
});

/**
 * Open an address and wait for the page it names to mount, asking again if the
 * attempt does not arrive.
 *
 * `npm run dev` is what serves these, and it pre-bundles a dependency the first
 * time something imports one it has not seen — then reloads the page, which
 * aborts the navigation in flight with `ERR_ABORTED`. Walking 365 addresses
 * against a server that started a minute ago sets that off a few times, always
 * on the first pass and never on the second. So the address is asked for again,
 * and every retry is written onto the test: a page that genuinely never loads
 * fails all {@link ATTEMPTS} of them, and one that needed two says so in the
 * report rather than passing quietly.
 *
 * @param page - The page under test.
 * @param path - The address to open.
 */
async function openAddress(page: Page, path: string): Promise<void> {
  /* eslint-disable no-await-in-loop -- a retry: the next attempt only happens
     because the one before it threw. */
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    try {
      // `domcontentloaded` rather than `load`: under `npm run dev` a page is
      // hundreds of module requests, and one of them stalling would hold the
      // load event open for ever. That the shell mounted the page the address
      // names is the stronger signal anyway, and it is the next line.
      await page.goto(path, {
        timeout: NAVIGATION_TIMEOUT_MS,
        waitUntil: 'domcontentloaded',
      });
      await expect(page.getByRole('main'), path).toBeVisible();
      await expect(page.getByTestId(`page-${tabOf(path)}`), path).toBeVisible();
      return;
    } catch (error) {
      if (attempt === ATTEMPTS - 1) throw error;
      test.info().annotations.push({
        type: 'asked again',
        description: `${path}: ${String(error).split('\n', 1)[0]}`,
      });
    }
  }
  /* eslint-enable no-await-in-loop */
}

/**
 * Whether a console error came from Vite rather than from the site.
 *
 * `npm run dev` is what serves these addresses, and its client keeps a
 * hot-reload socket open: when that socket drops — a dependency re-bundled, a
 * linked package rebuilt under the server — the client says so. That is the dev
 * server talking about itself, and the built site carries none of it.
 *
 * @param text - What was logged.
 * @returns Whether to ignore it.
 */
function isDevServerNoise(text: string): boolean {
  return text.includes('WebSocket connection to') || text.includes('[vite]');
}

/**
 * The tab an address opens: its first segment, or the molecule workbench at
 * `/`. There is no `/molecules` — the tool is the root address.
 *
 * @param path - A routed address.
 * @returns The id the shell's `page-<tab>` marker carries.
 */
function tabOf(path: string): string {
  const first = path.split('/').find((segment) => segment !== '');
  return first ?? 'molecules';
}
