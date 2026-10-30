/**
 * What a link to this site can say: the parts it can switch off, and the
 * settings it can pin. Reading `?embed`, `?hide=` and the settings — trimmed
 * names, unknown ones dropped, one canonical order, numbers clamped — is
 * `react-cheminfo`'s share configuration; what is here is the site's words.
 */

import type { ShareConfig, ShareVocabulary } from 'react-cheminfo/core';
import { formatQueryString, parseShareConfig } from 'react-cheminfo/core';

import type { TabId } from '../state/tabs.ts';

import type { ShareParams } from './params.ts';
import { SHARE_PARAMS } from './params.ts';
import { SHARE_PARTS, SHARE_PART_IDS, partsOf } from './parts.ts';

/**
 * The part older links dropped the chrome with, before `?embed` existed. Such
 * a link still opens framed, and the name is never offered or written back.
 */
const LEGACY_EMBED_PARTS = ['header'];

/**
 * Everything any page of the site can say, so a link hiding the character
 * table stays in force while the reader walks to the page that has one.
 */
export const SITE_VOCABULARY: ShareVocabulary<ShareParams> = {
  parts: SHARE_PART_IDS.map((id) => SHARE_PARTS[id]),
  params: SHARE_PARAMS,
  legacyEmbedParts: LEGACY_EMBED_PARTS,
};

/**
 * The vocabulary the share dialog offers on a page.
 *
 * Only the parts that page actually has, in the canonical order of `?hide=`, so
 * one selection always produces one link. The settings are the site's whole
 * set: a page that is not showing one leaves it at its default, and a default
 * is deleted from the address rather than written.
 * @param tab - Page the link points at.
 * @returns What its links can say.
 */
export function shareVocabularyOf(tab: TabId): ShareVocabulary<ShareParams> {
  const parts = partsOf(tab).map((id) => SHARE_PARTS[id]);
  return { parts, params: SHARE_PARAMS, legacyEmbedParts: LEGACY_EMBED_PARTS };
}

/**
 * Read what a link says: whether it is framed, the parts it leaves out, and
 * every setting it carries, each clamped or cut to what the tool can serve.
 * @param query - Decoded query of the address.
 * @returns The configuration in force.
 */
export function readShareConfig(
  query: Readonly<Record<string, string>>,
): ShareConfig<ShareParams> {
  return parseShareConfig(
    formatQueryString(query, { keepEmptyValues: true }),
    SITE_VOCABULARY,
  );
}
