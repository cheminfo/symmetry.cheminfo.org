/**
 * Path routing for the pages, through the History API.
 *
 * ```
 * /                      /crystals?spaceGroup=225   /plane?planeGroup=p4g
 * /point-groups/c2v      /space-groups/14?setting=1
 * /wallpaper/p4g         /frieze/p1m1
 * /tutorial/<stepId>     /exercises/<id>            /cheatsheet   /about
 * ```
 *
 * The path says which page is open and which entry of it; the query says how
 * that page is configured and which parts of it a shared link leaves out. The
 * router itself knows none of those parameter names — it carries them — so
 * `src/share` owns the meaning and this file stays a string to route mapping.
 *
 * `/` **is** the molecule workbench: there is no `/molecules`, because two
 * addresses for one page is the second front door the family forbids. A link
 * that names it anyway still opens, and the bar is rewritten to `/`.
 *
 * The parsing, the writing, the query codec (a `+` stays a plus, a comma stays
 * readable) and the adoption of `#/crystals` links are `react-cheminfo`'s
 * `createTabRouter`. What is here is the site's page list, and the shape the
 * rest of the site names a route by.
 */

import type { TabRoute } from 'react-cheminfo/core';
import {
  EMBED_PARAM,
  HIDE_PARAM,
  createTabRouter,
  formatQueryString,
  readRoute as readTabRoute,
  subscribeToRoute as subscribeToTabRoute,
  writeRoute as writeTabRoute,
} from 'react-cheminfo/core';

import { BASE_PATH } from '../state/site.ts';
import type { TabId } from '../state/tabs.ts';
import { DEFAULT_TAB, TAB_IDS } from '../state/tabs.ts';

/** Where the app is: which page, what that page has open, and how it is set up. */
export interface Route {
  tab: TabId;
  /**
   * Second path segment: a point-group slug, a space-group number, a wallpaper
   * or frieze id, a tutorial step, an exercise — or `null` for a page that
   * addresses no entry, and for a catalogue showing its index.
   */
  id: string | null;
  /** Decoded query of the address. Empty entries never survive a round trip. */
  query: Record<string, string>;
}

/** Shown when the address is empty, or names a page that does not exist. */
export const DEFAULT_ROUTE: Route = { tab: DEFAULT_TAB, id: null, query: {} };

/**
 * Parse an address into a route.
 *
 * Forgiving by design: a leading `#`, a trailing slash, an empty string, an
 * unknown page, a segment beyond an entry and a lone `%` in an encoded value
 * all resolve to something sensible rather than throwing, because the address
 * is hand-editable and arrives from bookmarks, lecture slides and course pages
 * — including ones written for the hash the tool used to route by.
 * @param address - Path and query, from the site's own root.
 * @returns The route it denotes, or {@link DEFAULT_ROUTE} when it denotes none.
 */
export function parseAddress(address: string): Route {
  return routeOf(SITE_ROUTER.parse(address));
}

/**
 * Serialise a route into the address that parses back to it.
 * @param route - Route to serialise.
 * @returns An absolute path from the site's own root, with its query when it
 * carries one.
 */
export function formatRoute(route: Route): string {
  return SITE_ROUTER.format({
    tab: route.tab,
    id: route.id,
    params: route.query,
  });
}

/**
 * The address a page answers on, with no entry and no query.
 *
 * The molecule workbench is the site's root, so it is the one page whose path
 * is not its own name.
 * @param tab - Page to address.
 * @returns Its path, from the site's own root.
 */
export function pathOf(tab: TabId): string {
  return SITE_ROUTER.format({ tab });
}

/**
 * Whether a page addresses one of its entries in the path.
 *
 * The four catalogues name the group they are showing, the tutorial names its
 * step and the exercises name the open exercise, so a lecturer can hand out a
 * deep link. The three workbenches name nothing: what they are showing is a
 * configuration — a group, a structure, a motif — and it lives in the query.
 * @param tab - Page to ask about.
 * @returns True for the catalogues, the tutorial and the exercises.
 */
export function tabTakesId(tab: TabId): boolean {
  return TABS_WITH_ID.has(tab);
}

const TABS_WITH_ID: ReadonlySet<TabId> = new Set<TabId>([
  'point-groups',
  'space-groups',
  'wallpaper',
  'frieze',
  'tutorial',
  'exercises',
]);

/**
 * Compare two routes by value.
 * @param first - One route.
 * @param second - The other.
 * @returns True when both name the same page, entry and configuration.
 */
export function routesEqual(first: Route, second: Route): boolean {
  if (first.tab !== second.tab || first.id !== second.id) return false;
  return formatQueryString(first.query) === formatQueryString(second.query);
}

/**
 * Read the route the browser is currently showing.
 *
 * A link written for the hash the tool used to route by is rewritten to its
 * path once, in place, so a course page made years ago opens the page it
 * names.
 * @returns The parsed address.
 */
export function readRoute(): Route {
  return routeOf(readTabRoute(PAGE_ROUTER));
}

/**
 * Point the browser at a route.
 *
 * Changing page pushes a history entry, so back and forward walk the pages.
 * Moving inside one — the next tutorial step, another space group — *replaces*
 * it instead: the link stays shareable, but eighteen tutorial steps do not bury
 * the back button under eighteen entries. Writing the address the location
 * already carries is skipped, so echoing state back into the URL cannot loop.
 *
 * The address written is exactly the route's: the framing and the hidden parts
 * are part of the state, so a `hide` the state dropped is dropped from the bar.
 * @param route - Route to show.
 */
export function writeRoute(route: Route): void {
  writing = true;
  try {
    writeTabRoute(PAGE_ROUTER, {
      tab: route.tab,
      id: route.id,
      params: namingShareParams(route.query),
    });
  } finally {
    writing = false;
  }
}

/**
 * Follow the browser's own navigation — back, forward, an edited address bar.
 *
 * The app's own writes are not reported: the state they come from is already
 * on screen, and applying it again would reload what the visitor is working
 * on under their hands.
 * @param listener - Called with the new route on every move of the browser.
 * @returns A function removing the listener.
 */
export function subscribeToRoute(listener: (route: Route) => void): () => void {
  return subscribeToTabRoute(PAGE_ROUTER, (route) => {
    if (!writing) listener(routeOf(route));
  });
}

const ROUTER_OPTIONS = {
  tabs: TAB_IDS.map((id) => ({ id, takesId: tabTakesId(id) })),
  home: DEFAULT_TAB,
  adoptLegacyHash: true,
};

/** Addresses from the site's own root: what the tests and the head read. */
const SITE_ROUTER = createTabRouter<TabId>(ROUTER_OPTIONS);

/** The same addresses under the mount path, as the browser shows them. */
const PAGE_ROUTER = createTabRouter<TabId>({
  ...ROUTER_OPTIONS,
  basePath: BASE_PATH,
});

/** Whether {@link writeRoute} is moving the browser right now. */
let writing = false;

function routeOf(route: TabRoute<TabId>): Route {
  return { tab: route.tab, id: route.id, query: route.params };
}

/**
 * The query with the share parameters named even when it does not carry them,
 * so the router removes them rather than keeping the ones on screen.
 */
function namingShareParams(
  query: Record<string, string>,
): Record<string, string | null> {
  const params: Record<string, string | null> = { ...query };
  for (const key of [EMBED_PARAM, HIDE_PARAM]) {
    if (!Object.hasOwn(params, key)) params[key] = null;
  }
  return params;
}
