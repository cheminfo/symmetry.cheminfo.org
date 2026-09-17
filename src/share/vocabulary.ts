/**
 * What a link to one page of this site can say: the parts it can switch off,
 * and the settings it can pin.
 */

import type { ShareVocabulary } from 'react-cheminfo/core';

import type { TabId } from '../state/tabs.ts';

import type { ShareParams } from './params.ts';
import { SHARE_PARAMS } from './params.ts';
import { SHARE_PARTS, partsOf } from './parts.ts';

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
  return { parts, params: SHARE_PARAMS };
}
