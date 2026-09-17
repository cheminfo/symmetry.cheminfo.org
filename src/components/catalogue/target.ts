/**
 * Where a catalogue link goes, written two ways that must agree.
 *
 * {@link targetHref} is the address, so an entry is a real link a crawler
 * follows and a middle click opens in a tab. {@link openTarget} is the state
 * change, so a plain click moves the page without a reload. Both go through the
 * share codecs the router writes the live address with, and a test asserts that
 * opening a target leaves the router at the address the anchor named.
 */

import { batch } from '@preact/signals-react';

import { SHARE_PARAMS } from '../../share/params.ts';
import {
  selectMolecule,
  selectPlaneGroup,
  selectSetting,
  selectSpaceGroup,
  setActiveTab,
  setCatalogueItem,
} from '../../state/index.ts';
import { withBase } from '../../state/site.ts';
import type { Route } from '../../utils/router.ts';
import { formatRoute } from '../../utils/router.ts';

import type { CatalogueTarget } from './types.ts';

/**
 * The address a target names, under this deployment's mount path.
 *
 * A setting already at its default is left out, exactly as the router leaves it
 * out, so a plain entry keeps a plain address.
 * @param target - Where the link goes.
 * @returns The address, ready for an `href`.
 */
export function targetHref(target: CatalogueTarget): string {
  return withBase(formatRoute(routeOf(target)));
}

/**
 * Move the page to a target, without a reload.
 *
 * Only the leaves the target names are written: the framing and the parts a
 * shared link switched off say how the page is being shown, not where it is, so
 * following a link inside an embedded figure keeps it embedded.
 * @param target - Where the link goes.
 */
export function openTarget(target: CatalogueTarget): void {
  batch(() => {
    switch (target.page) {
      case 'molecules': {
        selectMolecule(target.moleculeId);
        setActiveTab('molecules');
        return;
      }
      case 'crystals': {
        // The number first: it resets the setting index, which only means
        // anything inside one number's own list.
        selectSpaceGroup(target.number);
        selectSetting(target.setting);
        setActiveTab('crystals');
        return;
      }
      case 'plane': {
        selectPlaneGroup(target.planeGroup);
        setActiveTab('plane');
        return;
      }
      case 'catalogue': {
        setCatalogueItem(target.id);
        if (target.setting !== undefined) selectSetting(target.setting);
        setActiveTab(target.tab);
      }
      // no default
    }
  });
}

/** The route a target denotes, before it is written out. */
export function routeOf(target: CatalogueTarget): Route {
  switch (target.page) {
    case 'molecules': {
      const query: Record<string, string> = {};
      writeText(query, 'molecule', target.moleculeId);
      return { tab: 'molecules', id: null, query };
    }
    case 'crystals': {
      const query: Record<string, string> = {};
      writeNumber(query, 'spaceGroup', target.number);
      writeNumber(query, 'setting', target.setting);
      return { tab: 'crystals', id: null, query };
    }
    case 'plane': {
      const query: Record<string, string> = {};
      writeText(query, 'planeGroup', target.planeGroup);
      return { tab: 'plane', id: null, query };
    }
    case 'catalogue': {
      const query: Record<string, string> = {};
      if (target.setting !== undefined) {
        writeNumber(query, 'setting', target.setting);
      }
      return { tab: target.tab, id: target.id, query };
    }
    // no default
  }
}

function writeText(
  query: Record<string, string>,
  key: 'molecule' | 'planeGroup',
  value: string,
): void {
  const raw = SHARE_PARAMS[key].serialize(value);
  if (raw !== null) query[key] = raw;
}

function writeNumber(
  query: Record<string, string>,
  key: 'spaceGroup' | 'setting',
  value: number,
): void {
  const raw = SHARE_PARAMS[key].serialize(value);
  if (raw !== null) query[key] = raw;
}
