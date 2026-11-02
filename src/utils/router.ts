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
 * that page is configured and which parts of it a shared link leaves out.
 *
 * `/` **is** the molecule workbench: there is no `/molecules`, because two
 * addresses for one page is the second front door the family forbids. A link
 * that names it anyway still opens, and the bar is rewritten to `/`.
 */

import type { SiteRoute } from 'react-cheminfo/core';
import { createSiteRouter } from 'react-cheminfo/core';

import { BASE_PATH } from '../state/site.ts';
import type { TabId } from '../state/tabs.ts';
import { DEFAULT_TAB, TAB_IDS } from '../state/tabs.ts';

/** Where the app is: which page, what that page has open, and how it is set up. */
export interface Route extends SiteRoute<TabId> {
  /**
   * Second path segment: a point-group slug, a space-group number, a wallpaper
   * or frieze id, a tutorial step, an exercise — or `null` for a page that
   * addresses no entry, and for a catalogue showing its index.
   */
  id: string | null;
}

export const {
  parse: parseAddress,
  format: formatRoute,
  pathOf,
  read: readRoute,
  write: writeRoute,
  subscribe: subscribeToRoute,
} = createSiteRouter<Route>({
  tabs: TAB_IDS,
  home: DEFAULT_TAB,
  // A lecturer hands out a deep link to a group, a step or an exercise; what
  // the three workbenches show is a configuration, in the query.
  tabsWithId: [
    'point-groups',
    'space-groups',
    'wallpaper',
    'frieze',
    'tutorial',
    'exercises',
  ],
  basePath: BASE_PATH,
});
