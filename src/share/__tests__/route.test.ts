import { beforeEach, expect, test } from 'vitest';

import { state } from '../../state/index.ts';
import { formatRoute, parseAddress } from '../../utils/router.ts';
import { defaultFlagsValue } from '../flags.ts';
import { applyRoute, currentRoute } from '../route.ts';

/** The address the state says it is on, in its canonical form. */
function address(): string {
  return formatRoute(currentRoute());
}

/** Apply an address exactly as the shell does on load or on a back button. */
function open(value: string): string {
  applyRoute(parseAddress(value));
  return address();
}

beforeEach(() => {
  // The layers are stored preferences, so one test's link would otherwise be
  // in force in the next.
  open(`/?flags=${defaultFlagsValue()}`);
});

test('a plain visit keeps a plain address', () => {
  expect(open('/')).toBe('/');
  expect(open('/crystals')).toBe('/crystals');
  expect(open('/plane')).toBe('/plane');
  expect(open('/cheatsheet')).toBe('/cheatsheet');
  expect(open('/about')).toBe('/about');
});

test('a link naming a setting already at its default writes it no more', () => {
  expect(open('/crystals?spaceGroup=225&setting=0&supercell=1')).toBe(
    '/crystals',
  );
  expect(open('/plane?planeGroup=p4m&tiles=4')).toBe('/plane');
  expect(open(`/?flags=${defaultFlagsValue()}`)).toBe('/');
});

test('what each workbench is showing survives parse, apply and parse', () => {
  expect(open('/?molecule=ammonia&operation=C3')).toBe(
    '/?molecule=ammonia&operation=C3',
  );
  expect(
    open('/crystals?spaceGroup=14&setting=1&structure=urea&supercell=2'),
  ).toBe('/crystals?spaceGroup=14&setting=1&structure=urea&supercell=2');
  expect(open('/plane?planeGroup=p4g&motif=comma&tiles=6')).toBe(
    '/plane?planeGroup=p4g&motif=comma&tiles=6',
  );
});

test('an entry in the path survives it too', () => {
  expect(open('/point-groups/c2v')).toBe('/point-groups/c2v');
  expect(open('/space-groups/225')).toBe('/space-groups/225');
  expect(open('/space-groups/14?setting=2')).toBe('/space-groups/14?setting=2');
  expect(open('/wallpaper/p4g')).toBe('/wallpaper/p4g');
  expect(open('/frieze/p1m1')).toBe('/frieze/p1m1');
  expect(open('/tutorial/mirror-planes')).toBe('/tutorial/mirror-planes');
  expect(open('/exercises/assign-c2v')).toBe('/exercises/assign-c2v');
});

test('a number a link asks for beyond the ceiling opens clamped', () => {
  expect(open('/crystals?spaceGroup=999&supercell=40')).toBe(
    '/crystals?spaceGroup=230&supercell=4',
  );
  expect(state.view.crystals.spaceGroupNumber.value).toBe(230);
  expect(state.view.crystals.supercell.value).toBe(4);
});

test('another space group drops the setting the last one was on', () => {
  open('/crystals?spaceGroup=15&setting=7');

  expect(state.view.crystals.settingIndex.value).toBe(7);

  expect(open('/crystals?spaceGroup=14')).toBe('/crystals?spaceGroup=14');
  expect(state.view.crystals.settingIndex.value).toBe(0);
});

test('the layers a link pins are the layers the class sees', () => {
  expect(open('/?flags=axes,labels')).toBe('/?flags=axes,labels');
  expect(state.preferences.flags.axes.value).toBe(true);
  expect(state.preferences.flags.mirrors.value).toBe(false);
  expect(state.preferences.flags.labels.value).toBe(true);

  expect(open('/?flags=none')).toBe('/?flags=none');
  expect(state.preferences.flags.axes.value).toBe(false);
});

test('a link that says nothing about the layers leaves them alone', () => {
  open('/?flags=axes');

  expect(open('/crystals')).toBe('/crystals?flags=axes');
  expect(state.preferences.flags.axes.value).toBe(true);
  expect(state.preferences.flags.mirrors.value).toBe(false);
});

test('an embedded link keeps its configuration across the round trip', () => {
  expect(open('/?embed=1&hide=intro,export')).toBe(
    '/?embed=1&hide=intro,export',
  );
  expect(state.view.embedded.value).toBe(true);
  expect(state.view.hidden.value).toStrictEqual(['intro', 'export']);

  // A bare switch, as a teacher retypes it, and a key the site cannot name.
  expect(open('/crystals?embed&hide=positions,sidebar')).toBe(
    '/crystals?embed=1&hide=positions',
  );
});

test('a page with no chrome is left with none when the link says so', () => {
  open('/about?embed=1');

  expect(state.view.embedded.value).toBe(true);
  expect(state.view.activeTab.value).toBe('about');

  open('/about');

  expect(state.view.embedded.value).toBe(false);
});

test('a structure named alone opens in the group its own file names', () => {
  open('/crystals?structure=quartz');

  expect(state.view.crystals.structureId.value).toBe('quartz');
  expect(state.view.crystals.spaceGroupNumber.value).toBe(154);
  expect(address()).toBe('/crystals?spaceGroup=154&structure=quartz');
});

test('a group named beside a structure is the one that is built', () => {
  open('/crystals?spaceGroup=221&structure=halite');

  expect(state.view.crystals.structureId.value).toBe('halite');
  expect(state.view.crystals.spaceGroupNumber.value).toBe(221);
});
