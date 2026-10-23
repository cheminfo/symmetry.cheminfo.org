import {
  holdPageAddress,
  pageLocation,
  releasePageAddress,
} from 'react-cheminfo/core';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import type { Route } from '../router.ts';
import { readRoute, subscribeToRoute, writeRoute } from '../router.ts';

let events: EventTarget;

beforeEach(() => {
  events = new EventTarget();
  vi.stubGlobal('addEventListener', events.addEventListener.bind(events));
  vi.stubGlobal('removeEventListener', events.removeEventListener.bind(events));
  vi.stubGlobal('dispatchEvent', events.dispatchEvent.bind(events));
});

afterEach(() => {
  releasePageAddress();
  vi.unstubAllGlobals();
});

function shownAddress(): string {
  const location = pageLocation();
  return `${location?.pathname ?? ''}${location?.search ?? ''}`;
}

test('a link written for the hash opens the page it names', () => {
  holdPageAddress('/#/space-groups/14?setting=1');

  expect(readRoute()).toStrictEqual({
    tab: 'space-groups',
    id: '14',
    query: { setting: '1' },
  });
  expect(shownAddress()).toBe('/space-groups/14?setting=1');
});

test('the address written is the route, and a legacy `hide` is not kept', () => {
  holdPageAddress('/?hide=header');

  writeRoute({ tab: 'molecules', id: null, query: { embed: '1' } });

  expect(shownAddress()).toBe('/?embed=1');
});

test('a plus sign in a value is written escaped and read back as itself', () => {
  holdPageAddress('/');

  writeRoute({ tab: 'plane', id: null, query: { motif: 'C+O' } });

  expect(shownAddress()).toBe('/plane?motif=C%2BO');
  expect(readRoute().query.motif).toBe('C+O');
});

test('a subscriber hears the browser move, never the app writing its state', () => {
  holdPageAddress('/point-groups/c2v');
  const heard: Route[] = [];
  const stop = subscribeToRoute((route) => {
    heard.push(route);
  });

  writeRoute({ tab: 'point-groups', id: 'd3h', query: {} });

  expect(heard).toStrictEqual([]);

  holdPageAddress('/crystals');
  events.dispatchEvent(new Event('popstate'));
  stop();
  events.dispatchEvent(new Event('popstate'));

  expect(heard).toStrictEqual([{ tab: 'crystals', id: null, query: {} }]);
});
