import { expect, test } from 'vitest';

import {
  SPACE_GROUP_SETTINGS,
  SPACE_GROUP_SETTINGS_BY_NUMBER,
} from '../spaceGroups.ts';

test('the table holds 521 settings of 230 numbers and 7244 operations', () => {
  expect(SPACE_GROUP_SETTINGS).toHaveLength(521);
  expect(SPACE_GROUP_SETTINGS_BY_NUMBER.size).toBe(230);
  let operations = 0;
  for (const setting of SPACE_GROUP_SETTINGS) {
    operations += setting.operations.length;
  }
  expect(operations).toBe(7244);
});

test('the numbers run 1 to 230 and the variants are dense from 0', () => {
  for (let number = 1; number <= 230; number++) {
    const settings = SPACE_GROUP_SETTINGS_BY_NUMBER.get(number);
    expect(settings, `space group ${number}`).toBeDefined();
    for (let index = 0; index < (settings?.length ?? 0); index++) {
      expect(settings?.[index]?.variant).toBe(index);
      expect(settings?.[index]?.number).toBe(number);
    }
  }
});

test('the settings per crystal system are the International Tables counts', () => {
  const counts = new Map<string, number>();
  for (const setting of SPACE_GROUP_SETTINGS) {
    counts.set(
      setting.crystalSystem,
      (counts.get(setting.crystalSystem) ?? 0) + 1,
    );
  }
  expect(Object.fromEntries(counts)).toStrictEqual({
    triclinic: 2,
    monoclinic: 105,
    orthorhombic: 232,
    tetragonal: 81,
    trigonal: 32,
    hexagonal: 27,
    cubic: 42,
  });
});

test('339 settings carry a Hall symbol and 182 carry none', () => {
  const withHall = SPACE_GROUP_SETTINGS.filter(
    (setting) => setting.hall !== null,
  );
  expect(withHall).toHaveLength(339);
  expect(SPACE_GROUP_SETTINGS.length - withHall.length).toBe(182);
  // The gap is exactly the tetragonal, trigonal, hexagonal and cubic groups.
  for (const setting of SPACE_GROUP_SETTINGS) {
    expect(setting.hall === null, setting.hmSetting).toBe(setting.number > 74);
  }
});

test('92 numbers are centrosymmetric, 65 Sohncke and 73 symmorphic', () => {
  const centrosymmetric = new Set<number>();
  const sohncke = new Set<number>();
  const symmorphic = new Set<number>();
  for (const setting of SPACE_GROUP_SETTINGS) {
    if (setting.centrosymmetric) centrosymmetric.add(setting.number);
    if (setting.sohncke) sohncke.add(setting.number);
    if (setting.symmorphic) symmorphic.add(setting.number);
  }
  expect(centrosymmetric.size).toBe(92);
  expect(sohncke.size).toBe(65);
  expect(symmorphic.size).toBe(73);
});

test('every derived flag is the same on every setting of a number', () => {
  for (const settings of SPACE_GROUP_SETTINGS_BY_NUMBER.values()) {
    const first = settings[0];
    for (const setting of settings) {
      expect({
        crystalClass: setting.crystalClass,
        laueClass: setting.laueClass,
        crystalSystem: setting.crystalSystem,
        centrosymmetric: setting.centrosymmetric,
        sohncke: setting.sohncke,
        symmorphic: setting.symmorphic,
        hmShort: setting.hmShort,
        hmFull: setting.hmFull,
      }).toStrictEqual({
        crystalClass: first?.crystalClass,
        laueClass: first?.laueClass,
        crystalSystem: first?.crystalSystem,
        centrosymmetric: first?.centrosymmetric,
        sohncke: first?.sohncke,
        symmorphic: first?.symmorphic,
        hmShort: first?.hmShort,
        hmFull: first?.hmFull,
      });
    }
  }
});

test('there are 32 crystal classes and 11 Laue classes', () => {
  const crystalClasses = new Set(
    SPACE_GROUP_SETTINGS.map((setting) => setting.crystalClass),
  );
  const laueClasses = new Set(
    SPACE_GROUP_SETTINGS.map((setting) => setting.laueClass),
  );
  expect(crystalClasses.size).toBe(32);
  expect([...laueClasses].toSorted()).toStrictEqual([
    '-1',
    '-3',
    '-3m',
    '2/m',
    '4/m',
    '4/mmm',
    '6/m',
    '6/mmm',
    'm-3',
    'm-3m',
    'mmm',
  ]);
});

test('the seven R groups carry one hexagonal and one rhombohedral setting', () => {
  const rhombohedral = SPACE_GROUP_SETTINGS.filter(
    (setting) => setting.axes === 'rhombohedral',
  );
  expect(rhombohedral.map((setting) => setting.number)).toStrictEqual([
    146, 148, 155, 160, 161, 166, 167,
  ]);
  for (const setting of rhombohedral) {
    expect(setting.variant).toBe(1);
    expect(setting.centring).toBe('R');
  }
  const hexagonal = SPACE_GROUP_SETTINGS.filter(
    (setting) => setting.axes === 'hexagonal',
  );
  expect(hexagonal.map((setting) => setting.number)).toStrictEqual([
    146, 148, 155, 160, 161, 166, 167,
  ]);
});

test('60 settings name an origin choice, and Fd-3m opens on origin 2', () => {
  const withOrigin = SPACE_GROUP_SETTINGS.filter(
    (setting) => setting.originChoice !== null,
  );
  expect(withOrigin).toHaveLength(60);
  expect(new Set(withOrigin.map((setting) => setting.number)).size).toBe(24);
  const diamond = SPACE_GROUP_SETTINGS_BY_NUMBER.get(227);
  expect(diamond?.[0]?.originChoice).toBe(2);
  expect(diamond?.[1]?.originChoice).toBe(1);
  // Pnnn is the other way round: the source orders it origin 1 first.
  const pnnn = SPACE_GROUP_SETTINGS_BY_NUMBER.get(48);
  expect(pnnn?.[0]?.originChoice).toBe(1);
  expect(pnnn?.[1]?.originChoice).toBe(2);
});

test('the 105 monoclinic settings split 35 / 35 / 35 over a, b and c', () => {
  const counts = { a: 0, b: 0, c: 0 };
  for (const setting of SPACE_GROUP_SETTINGS) {
    if (setting.crystalSystem !== 'monoclinic') {
      expect(setting.uniqueAxis).toBeNull();
      continue;
    }
    counts[setting.uniqueAxis ?? 'a']++;
  }
  expect(counts).toStrictEqual({ a: 35, b: 35, c: 35 });
});

test('the origin strings and the e-glide aliases are repaired', () => {
  const pnnn = SPACE_GROUP_SETTINGS_BY_NUMBER.get(48)?.[0];
  expect(pnnn?.hmShort).toBe('P n n n');
  expect(pnnn?.hmSetting).toBe('P n n n');
  const ccce = SPACE_GROUP_SETTINGS_BY_NUMBER.get(68)?.[0];
  expect(ccce?.hmShort).toBe('C c c e');
  expect(ccce?.hmLegacy).toBe('C c c a');
  const legacy = SPACE_GROUP_SETTINGS.filter(
    (setting) => setting.hmLegacy !== null,
  );
  expect(new Set(legacy.map((setting) => setting.number))).toStrictEqual(
    new Set([39, 41, 64, 67, 68]),
  );
});

test('P 21/c carries the International Tables general positions', () => {
  const setting = SPACE_GROUP_SETTINGS_BY_NUMBER.get(14)?.[0];
  expect(setting?.hmSetting).toBe('P 1 21/c 1');
  expect(setting?.hall).toBe('-P 2ybc');
  expect(setting?.uniqueAxis).toBe('b');
  expect(setting?.multiplicity).toBe(4);
  expect(setting?.operations).toStrictEqual([
    'x,y,z',
    '-x,y+1/2,-z+1/2',
    '-x,-y,-z',
    'x,-y+1/2,z+1/2',
  ]);
});
