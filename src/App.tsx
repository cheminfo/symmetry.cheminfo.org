/**
 * The application shell: the header the whole family carries, and the path
 * routing that makes every page a shareable link.
 *
 * The page a visitor is on is state, not a prop — `state.view.activeTab` — and
 * the address is a mirror of it. `useRouteSync` keeps the two in step in both
 * directions: the address is applied to the state on load and on every
 * back/forward, and any state change is written back to it. What the two carry
 * is `src/share/route.ts`, so this file stays the shell.
 *
 * A link carrying `?embed` drops the header, its page bar and the footer, and
 * the shell renders the tool alone — which is what an embedded frame loads.
 */

import { effect } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { startDocumentMeta } from 'react-cheminfo/core';
import {
  CiteButton,
  EcosystemButton,
  HiddenPartsProvider,
  NavLink,
  SiteFooter,
  SiteHeader,
  SiteTheme,
} from 'react-cheminfo/ui';

import { ABOUT } from './about.ts';
import { About } from './pages/About.tsx';
import { Catalogue } from './pages/Catalogue.tsx';
import { Cheatsheet } from './pages/Cheatsheet.tsx';
import { Crystals } from './pages/Crystals.tsx';
import { Exercises } from './pages/Exercises.tsx';
import { Molecules } from './pages/Molecules.tsx';
import { Plane } from './pages/Plane.tsx';
import { Tutorial } from './pages/Tutorial.tsx';
import { PAGE_ROUTES } from './seo/routes.ts';
import { ShareButton } from './share/ShareButton.tsx';
import { applyRoute, currentRoute } from './share/route.ts';
import type { TabId } from './state/index.ts';
import {
  DEFAULT_TAB,
  NAV_TAB_IDS,
  TAB_LABELS,
  isCatalogueTab,
  setActiveTab,
  state,
} from './state/index.ts';
import { absoluteUrl, withBase } from './state/site.ts';
import {
  formatRoute,
  pathOf,
  readRoute,
  subscribeToRoute,
  writeRoute,
} from './utils/router.ts';

/**
 * The whole application: the header, the page the address names, and the
 * footer under it.
 * @returns The shell, with exactly one page mounted — the pages that show no 3D
 * never mount the viewer, and so never download molstar.
 */
export function App(): ReactElement {
  useSignals();
  const activeTab = state.view.activeTab.value;

  useRouteSync();

  const framed = state.view.embedded.value;
  const hidden = state.view.hidden.value;
  const navItems = NAV_TAB_IDS.map((tab) => ({
    id: tab,
    label: TAB_LABELS[tab],
    href: withBase(pathOf(tab)),
    onSelect: () => {
      setActiveTab(tab);
    },
  }));

  return (
    <>
      <SiteTheme siteId="symmetry" />
      <div className={screenClassName(activeTab)}>
        <SiteHeader
          siteId="symmetry"
          width="full"
          embedded={framed}
          nav={hidden.includes('tabs') ? [] : navItems}
          activeId={activeTab}
          homeHref={withBase('/')}
          onHome={() => {
            setActiveTab(DEFAULT_TAB);
          }}
          markSize={24}
          actions={
            <>
              <NavLink
                item={{
                  id: 'about',
                  label: 'About',
                  href: withBase('/about'),
                  icon: 'info-sign',
                  title: 'What this site computes, and what it borrows',
                  onSelect: () => {
                    setActiveTab('about');
                  },
                }}
                active={activeTab === 'about'}
              />
              <CiteButton works={ABOUT.cite ?? []} />
              <EcosystemButton currentSiteId="symmetry" />
              <ShareButton />
            </>
          }
        />

        {/*
          The one `page-<tab>` marker the end-to-end tests locate a page by. It
          lives on the shell, where exactly one exists at a time — a page adding
          its own would make the locator ambiguous and fail Playwright's strict
          mode.
        */}
        <main
          className={mainClassName(activeTab)}
          data-testid={`page-${activeTab}`}
        >
          <HiddenPartsProvider hidden={hidden}>
            <PageBody tab={activeTab} />
          </HiddenPartsProvider>
        </main>
      </div>

      <SiteFooter siteId="symmetry" width="full" embedded={framed} />
    </>
  );
}

/**
 * The classes of the block the header and the page share: one screen tall, and
 * exactly one screen tall for the three workbenches, whose panes scroll on
 * their own.
 * @param tab - The open page.
 * @returns The class attribute.
 */
function screenClassName(tab: TabId): string {
  return hasPanes(tab) ? 'app-screen app-screen--panes' : 'app-screen';
}

/**
 * The classes the page body carries: the shell's own, plus the three-pane one
 * for the workbenches that fill the screen instead of stretching the document.
 * @param tab - The open page.
 * @returns The class attribute.
 */
function mainClassName(tab: TabId): string {
  return hasPanes(tab) ? 'app-main app-main--panes' : 'app-main';
}

function hasPanes(tab: TabId): boolean {
  return PANE_TABS.has(tab);
}

const PANE_TABS: ReadonlySet<TabId> = new Set<TabId>([
  'molecules',
  'crystals',
  'plane',
]);

function PageBody(props: { tab: TabId }): ReactElement {
  const { tab } = props;
  if (tab === 'crystals') return <Crystals />;
  if (tab === 'plane') return <Plane />;
  if (tab === 'tutorial') return <Tutorial />;
  if (tab === 'exercises') return <Exercises />;
  if (tab === 'cheatsheet') return <Cheatsheet />;
  if (tab === 'about') return <About />;
  if (isCatalogueTab(tab)) return <Catalogue tab={tab} />;
  return <Molecules />;
}

/**
 * Two-way binding between the address and the view state.
 *
 * The signal `effect` is created *after* the initial route has been applied, so
 * it runs with the state the address just set and can never overwrite a deep
 * link with the defaults it captured a render earlier — the classic bug of a
 * `useEffect` whose dependencies are one render behind the signals.
 */
function useRouteSync(): void {
  useEffect(() => {
    function follow(): void {
      applyRoute(readRoute());
    }
    follow();
    const stopFollowing = subscribeToRoute(follow);
    const stopWriting = effect(() => {
      writeRoute(currentRoute());
    });
    const stopTitling = startDocumentMeta({
      site: 'symmetry',
      routes: PAGE_ROUTES,
      url: () => formatRoute(currentRoute()),
      // Read off the page rather than off the build: the origin is whichever
      // host answered and the mount is the one stamped into the page, so a
      // deployment under `/symmetry` describes itself instead of claiming an
      // address it does not serve.
      origin: absoluteUrl('/'),
      follow: effect,
    });
    return () => {
      stopFollowing();
      stopWriting();
      stopTitling();
    };
  }, []);
}
