import react from '@vitejs/plugin-react';
import { cheminfoBuildInfo, cheminfoPrerender } from 'react-cheminfo/vite';
import { defineConfig } from 'vite';

import { NOSCRIPT_ROUTES, PAGE_ROUTES } from './src/seo/routes.ts';
import { configuredSiteUrl } from './src/state/site.ts';

// The site's own port, never Vite's stock 5173: two checkouts must not fight
// over the same one. It is the number compose publishes as well — this site has
// no backend to leave room for, so there is one number, not two.
const port = Number(process.env.PORT ?? 10_917);

export default defineConfig({
  // The build carries no mount path. Every asset is written relative, so the
  // one `dist` serves the site's own host and a path of a shared one without
  // being rebuilt: the `<base>` the container stamps in at startup is what
  // resolves them, and the page reads its mount back off that.
  base: './',
  resolve: {
    // `react-cheminfo` is linked from the checkout next door, so without this
    // its own `node_modules` gives the page a second React: every component it
    // exports then calls hooks against a dispatcher the active renderer never
    // populated, and the first render dies on `Cannot read properties of null`.
    // Blueprint holds context of its own and duplicates the same way.
    dedupe: ['react', 'react-dom', '@blueprintjs/core'],
  },
  plugins: [
    react(),
    cheminfoBuildInfo(),
    cheminfoPrerender({
      site: 'symmetry',
      routes: PAGE_ROUTES,
      // The published address, mount path included, so every canonical link,
      // `og:url`, card and sitemap entry starts where the site is served.
      origin: configuredSiteUrl(),
      operatingSystem: 'Any browser with WebGL2',
      description:
        'Symmetry in chemistry, hands on: assign a molecular point group, read its character table, build a crystal from any of the 230 space groups, and name the symmetry of a repeating pattern.',
      noscript: {
        heading: 'SymmeTry — symmetry and group theory in chemistry',
        intro:
          'Molecular point groups with their operations and character tables, the 230 space groups with a cell builder, and the 17 wallpaper and 7 frieze groups drawn live. The tool needs JavaScript, and WebGL2 for the 3D views; these are the pages it offers:',
        // The build bakes in no mount, so the crawl path is written against the
        // `<base>` the container stamps in at startup rather than the root of a
        // host this deployment may only share.
        hrefs: 'relative',
        // A crawl path is a menu: it names the space groups, not all 230.
        routes: NOSCRIPT_ROUTES,
        ecosystem: { taglines: false },
      },
    }),
  ],
  server: {
    port,
    // Fail loudly rather than drifting to the next free port, which would leave
    // the Playwright base URL, the dev script and the README disagreeing.
    strictPort: true,
  },
  preview: { port, strictPort: true },
  build: {
    // molstar is large and does not tree-shake; the viewers are lazy-loaded so
    // only the pages that need 3D pay for them.
    chunkSizeWarningLimit: 4096,
  },
});
