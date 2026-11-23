/**
 * How the atoms are drawn, as a link carries it: the parameters every 3D viewer
 * of the family writes, so a link opens on the representation and the surface
 * it was shared with. A setting at its default is never written.
 */

import {
  applyPreferencesFromSearch,
  formatQueryString,
  parseQueryString,
  writePreferencesToSearch,
} from 'react-cheminfo/core';
import { molecule3DSettingsParams } from 'react-cheminfo/molecule3d';

import { viewer } from '../state/viewerSettings.ts';

const VIEWER_PARAMS = molecule3DSettingsParams(viewer);

/**
 * Store how a link says the atoms are drawn; what it does not name keeps its
 * value.
 * @param query - The decoded query.
 */
export function applyLinkedViewer(
  query: Readonly<Record<string, string>>,
): void {
  applyPreferencesFromSearch(
    formatQueryString(query, { keepEmptyValues: true }),
    VIEWER_PARAMS,
  );
}

/**
 * The settings away from their default, as query entries. Reads signals, so
 * the effect writing the address rewrites it when one moves.
 * @returns One decoded entry per setting away from its default.
 */
export function viewerQuery(): Record<string, string> {
  return parseQueryString(writePreferencesToSearch('', VIEWER_PARAMS));
}
