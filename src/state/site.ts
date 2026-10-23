/**
 * Where this deployment answers, and the address it names as its own.
 *
 * Two questions that look alike and are not. The **mount** is where the browser
 * is: the empty string on a host of its own, `/symmetry` as one tool among
 * several on a shared one. It is read off the page rather than off the build —
 * vite writes the assets relative, so the build carries no mount at all, and
 * what tells two deployments apart is the `<base>` the container stamps in when
 * it starts. One image therefore serves both addresses.
 *
 * The **site URL** is what the canonical link, the social card and the sitemap
 * are written from, so it survives being mirrored: a deployment serving the
 * same build under a second address still points a crawler back here, and the
 * two never compete for one search result.
 *
 * Both are `react-cheminfo`'s `createSiteAddresses`; this module only names the
 * site once.
 */

import { createSiteAddresses } from 'react-cheminfo/core';

const ADDRESSES = createSiteAddresses('symmetry');

/** What the tab, the social card and the sitemap call this site. */
export const SITE_NAME = ADDRESSES.siteName;

/** The path this deployment is mounted at, read off the page it is on. */
export const BASE_PATH = ADDRESSES.basePath;

/**
 * The address this build names as its own: what `SITE_URL` says, or the
 * site's own host when it says nothing.
 */
export const { configuredSiteUrl } = ADDRESSES;

/** One of the site's own addresses, as the browser has to write it. */
export const { withBase } = ADDRESSES;

/** The site's own address behind a browser path. */
export const { pathWithoutBase } = ADDRESSES;

/**
 * One of the site's addresses written out in full, for a share dialog or a
 * canonical link, on the origin the page is served from.
 */
export const { absoluteUrl } = ADDRESSES;
