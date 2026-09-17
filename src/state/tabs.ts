/**
 * Every page the site routes to, and what each is called.
 *
 * The bar lists six; the four catalogues and the About are routed pages that it
 * does not. Kept apart from the state bucket so the router can name a page
 * without pulling the signals in with it.
 */

/**
 * The pages the header lists, in its own order: the three workbenches first —
 * a molecule, then a crystal, then a pattern, which is the order the subject
 * itself grows in — then the guided tour, the practice and the reference.
 */
export const NAV_TAB_IDS = [
  'molecules',
  'crystals',
  'plane',
  'tutorial',
  'exercises',
  'cheatsheet',
] as const;

/**
 * The four catalogues: one page per point group, per space group, per wallpaper
 * group and per frieze group, under an index each.
 *
 * They are routed pages with a title and a description of their own — that is
 * the whole point, since a search for a space-group symbol has to land on ours
 * — but they are reached from the workbench they belong to rather than from the
 * bar, which stays six items wide.
 *
 * Wallpaper and frieze are separate namespaces on purpose: `p1`, `p2` and
 * `p1m1` each name a group in *both* sets, so one `/plane/<id>` namespace would
 * collide.
 */
export const CATALOGUE_TAB_IDS = [
  'point-groups',
  'space-groups',
  'wallpaper',
  'frieze',
] as const;

/**
 * Every routed page: the six of the bar, the four catalogues, and the About.
 *
 * The About is a page like any other — a real address, indexed and printable —
 * but it is about the site rather than a place in the tool, so it sits with the
 * utilities at the right of the bar and never among {@link NAV_TAB_IDS}.
 */
export const TAB_IDS = [...NAV_TAB_IDS, ...CATALOGUE_TAB_IDS, 'about'] as const;

/** One of {@link TAB_IDS}. */
export type TabId = (typeof TAB_IDS)[number];

/** One of {@link CATALOGUE_TAB_IDS}. */
export type CatalogueTabId = (typeof CATALOGUE_TAB_IDS)[number];

/** What the bar, the share dialog and the crawl path call each page. */
export const TAB_LABELS: Record<TabId, string> = {
  molecules: 'Molecules',
  crystals: 'Crystals',
  plane: 'Plane',
  tutorial: 'Tutorial',
  exercises: 'Exercises',
  cheatsheet: 'Cheatsheet',
  'point-groups': 'Point groups',
  'space-groups': 'Space groups',
  wallpaper: 'Wallpaper groups',
  frieze: 'Frieze groups',
  about: 'About',
};

/**
 * The page shown when the address is empty or unknown: the molecule workbench,
 * which is what a first-year course links to and what `/` renders.
 */
export const DEFAULT_TAB: TabId = 'molecules';

/**
 * Narrow an arbitrary string — a path segment — to a page.
 * @param value - Candidate page name.
 * @returns True when it is one of {@link TAB_IDS}.
 */
export function isTabId(value: string): value is TabId {
  for (const tab of TAB_IDS) {
    if (tab === value) return true;
  }
  return false;
}

/**
 * Whether a page is one of the four catalogues.
 * @param tab - Page to ask about.
 * @returns True when it is one of {@link CATALOGUE_TAB_IDS}.
 */
export function isCatalogueTab(tab: TabId): tab is CatalogueTabId {
  for (const id of CATALOGUE_TAB_IDS) {
    if (id === tab) return true;
  }
  return false;
}
