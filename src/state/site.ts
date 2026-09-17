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
 */

import {
  joinBasePath,
  readMountPath,
  siteById,
  siteDisplayName,
  siteUrl,
  stripBasePath,
} from 'react-cheminfo/core';

const SITE = siteById('symmetry');

/** What the tab, the social card and the sitemap call this site. */
export const SITE_NAME = siteDisplayName(SITE);

/** The path this deployment is mounted at, read off the page it is on. */
export const BASE_PATH = readMountPath();

/**
 * The address this build names as its own.
 *
 * Read through `globalThis` so the one module type-checks in a page, in a vite
 * config and in a build script alike.
 * @returns What `SITE_URL` says, or the site's own host when it says nothing.
 */
export function configuredSiteUrl(): string {
  const environment = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env?.SITE_URL;
  return environment || siteUrl(SITE);
}

/**
 * One of the site's own addresses, as the browser has to write it.
 * @param path - An address from the site's own root.
 * @returns The same address under the mount path.
 */
export function withBase(path: string): string {
  return joinBasePath(BASE_PATH, path);
}

/**
 * The site's own address behind a browser path.
 * @param pathname - What `location.pathname` reads.
 * @returns The address from the site's own root.
 */
export function pathWithoutBase(pathname: string): string {
  return stripBasePath(BASE_PATH, pathname);
}

/**
 * One of the site's addresses written out in full, for a share dialog or a
 * canonical link. The origin comes from the page rather than from the build, so
 * a deployment answering on another host describes itself.
 * @param path - An address from the site's own root.
 * @returns The absolute address.
 */
export function absoluteUrl(path: string): string {
  const origin = globalThis.location?.origin ?? new URL(siteUrl(SITE)).origin;
  return `${origin}${withBase(path)}`;
}
