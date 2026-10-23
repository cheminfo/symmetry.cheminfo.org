/**
 * Reading and writing the `hide` parameter.
 *
 * Pure string to list: no `window`, no state, so both directions are unit
 * tested on their own. The whole site's vocabulary is read, not the open page's
 * — a link that hides the character table stays in force while the reader walks
 * to the page that has one. The reading itself — trimmed names, unknown ones dropped,
 * one canonical order — is `react-cheminfo`'s share configuration.
 */

import type { ShareVocabulary } from 'react-cheminfo/core';
import {
  applyShareConfig,
  formatQueryString,
  parseQueryString,
  parseShareConfig,
} from 'react-cheminfo/core';

import type { SharePartId } from './parts.ts';
import { HIDE_PARAM, SHARE_PARTS, SHARE_PART_IDS } from './parts.ts';

/**
 * Read the hidden parts out of a `hide` parameter.
 *
 * A name the site does not know is dropped rather than kept: the list is handed
 * to the UI, and a hand-written link must not be able to hide something it
 * cannot name.
 * @param value - Raw parameter, comma separated.
 * @returns The parts to leave out, in the canonical order.
 */
export function parseHidden(value: string | undefined): SharePartId[] {
  if (value === undefined) return [];
  const search = formatQueryString({ [HIDE_PARAM]: value });
  const hidden: SharePartId[] = [];
  for (const key of parseShareConfig(search, SITE_PARTS).hidden) {
    if (isSharePartId(key)) hidden.push(key);
  }
  return hidden;
}

/**
 * Write a `hide` parameter, in the canonical part order so one selection always
 * produces one link.
 * @param hidden - The parts to leave out.
 * @returns The parameter value, or an empty string when nothing is hidden.
 */
export function serializeHidden(hidden: readonly SharePartId[]): string {
  const search = applyShareConfig(
    '',
    { embed: false, hidden, params: {} },
    SITE_PARTS,
  );
  return parseQueryString(search)[HIDE_PARAM] ?? '';
}

/**
 * Whether a string names one of the hideable parts.
 * @param value - Candidate name.
 * @returns True when it is a {@link SharePartId}.
 */
export function isSharePartId(value: string): value is SharePartId {
  for (const id of SHARE_PART_IDS) {
    if (id === value) return true;
  }
  return false;
}

/** Every part of the site, in the order `?hide=` lists them. */
const SITE_PARTS: ShareVocabulary = {
  parts: SHARE_PART_IDS.map((id) => SHARE_PARTS[id]),
};
