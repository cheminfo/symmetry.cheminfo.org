import { expect, test } from 'vitest';

import { SPACE_GROUP_SETTINGS } from '../../data/spaceGroups.ts';
import {
  normalizeSpaceGroupSymbol,
  resolveSpaceGroup,
  resolveSpaceGroups,
} from '../spaceGroupSymbols.ts';

function found(query: string | number): string {
  const setting = resolveSpaceGroup(query);
  return setting === null
    ? 'none'
    : `${setting.number}/${setting.variant} ${setting.hmSetting}`;
}

test('every spelling of F m -3 m reaches the same setting', () => {
  for (const query of [
    225,
    '225',
    ' 225 ',
    'Fm-3m',
    'F m -3 m',
    'FM-3M',
    'fm-3m',
    'Fm3m',
    'F m 3 m',
    'Fm3̄m',
    'F 4/m -3 2/m',
  ]) {
    expect(found(query), String(query)).toBe('225/0 F 4/m -3 2/m');
  }
  // The source table carries no Hall symbol above number 74, and none is
  // invented here, so `-F 4 2 3` resolves to nothing.
  expect(resolveSpaceGroup('225')?.hall).toBeNull();
  expect(resolveSpaceGroups('-F 4 2 3')).toStrictEqual([]);
});

test('the spellings a CIF writes of P 21/c all reach group 14', () => {
  for (const query of [
    'P21/c',
    'P 21/c',
    'P2(1)/c',
    'P2_1/c',
    'P 1 21/c 1',
    'P121/c1',
    '-P 2ybc',
  ]) {
    expect(found(query), query).toBe('14/0 P 1 21/c 1');
  }
  // A setting symbol names its own setting, not the standard one.
  expect(found('P 1 1 21/a')).toBe('14/3 P 1 1 21/a');
  expect(found('P21/n11')).toBe('14/7 P 21/n 1 1');
});

test('P 63/m m c survives the underscore and the URL-mangled slash', () => {
  for (const query of ['P63/mmc', 'P 6_3/m m c', 'P 63.m m c', 'P63.mmc']) {
    expect(found(query), query).toBe('194/0 P 63/m 2/m 2/c');
  }
});

test('an axes qualifier picks the hexagonal or the rhombohedral setting', () => {
  expect(found('R-3c:H')).toBe('167/0 R -3 2/c');
  expect(found('R-3cH')).toBe('167/0 R -3 2/c');
  expect(resolveSpaceGroup('R-3c:H')?.axes).toBe('hexagonal');
  expect(resolveSpaceGroup('R-3c:R')?.axes).toBe('rhombohedral');
  expect(resolveSpaceGroup('R-3cR')?.variant).toBe(1);
  expect(resolveSpaceGroup('R -3 c')?.axes).toBe('hexagonal');
});

test('an origin qualifier picks the origin, and a bare symbol offers both', () => {
  expect(resolveSpaceGroup('Fd-3m:1')?.originChoice).toBe(1);
  expect(resolveSpaceGroup('Fd-3m:2')?.originChoice).toBe(2);
  expect(resolveSpaceGroup('Fd-3m:1')?.variant).toBe(1);
  const both = resolveSpaceGroups('Fd-3m');
  expect(both).toHaveLength(2);
  expect(both.map((setting) => setting.originChoice)).toStrictEqual([2, 1]);
  // S and Z are recognised and dropped: which origin each names is not settled
  // here, so both settings come back rather than the wrong one.
  expect(resolveSpaceGroups('Fd-3m S')).toHaveLength(2);
  expect(resolveSpaceGroups('Fd-3m Z')).toHaveLength(2);
  expect(resolveSpaceGroups('Fd-3mZ')).toHaveLength(2);
});

test('the five pre-2002 e-glide spellings resolve to their groups', () => {
  expect(resolveSpaceGroup('Abm2')?.number).toBe(39);
  expect(resolveSpaceGroup('Aba2')?.number).toBe(41);
  expect(resolveSpaceGroup('Cmca')?.number).toBe(64);
  expect(resolveSpaceGroup('Cmma')?.number).toBe(67);
  expect(resolveSpaceGroup('Ccca')?.number).toBe(68);
  // And so do the 2002 spellings they replaced.
  expect(resolveSpaceGroup('Aem2')?.number).toBe(39);
  expect(resolveSpaceGroup('A e a 2')?.number).toBe(41);
  expect(resolveSpaceGroup('C m c e')?.number).toBe(64);
  expect(resolveSpaceGroup('C m m e')?.number).toBe(67);
  expect(resolveSpaceGroup('C c c e')?.number).toBe(68);
});

test('dropping the bar never steals a symbol that already means something', () => {
  expect(found('P1')).toBe('1/0 P 1');
  expect(found('P-1')).toBe('2/0 P -1');
  expect(found('P3')).toBe('143/0 P 3');
  expect(found('P-3')).toBe('147/0 P -3');
  expect(found('P4')).toBe('75/0 P 4');
  expect(found('P-4')).toBe('81/0 P -4');
  expect(found('P6')).toBe('168/0 P 6');
  expect(found('P-6')).toBe('174/0 P -6');
});

test('an unknown symbol resolves to nothing rather than to a guess', () => {
  expect(resolveSpaceGroups('garbage')).toStrictEqual([]);
  expect(resolveSpaceGroups('P 9')).toStrictEqual([]);
  expect(resolveSpaceGroup('')).toBeNull();
  expect(resolveSpaceGroups(231)).toStrictEqual([]);
  expect(resolveSpaceGroups(0)).toStrictEqual([]);
});

test('every setting of the table is reachable by its own symbol', () => {
  const unreachable: string[] = [];
  for (const setting of SPACE_GROUP_SETTINGS) {
    const matches = resolveSpaceGroups(setting.hmSetting);
    if (!matches.includes(setting)) unreachable.push(setting.hmSetting);
  }
  expect(unreachable).toStrictEqual([]);
});

test('every Hall symbol reaches its own setting', () => {
  const wrong: string[] = [];
  for (const setting of SPACE_GROUP_SETTINGS) {
    if (setting.hall === null) continue;
    const match = resolveSpaceGroup(setting.hall);
    if (match?.number !== setting.number) {
      wrong.push(`${setting.hall} -> ${match?.number ?? 'none'}`);
    }
  }
  expect(wrong).toStrictEqual([]);
});

test('normalization strips what a spelling is free to vary', () => {
  expect(normalizeSpaceGroupSymbol('P 2(1)/c')).toBe('P21/C');
  expect(normalizeSpaceGroupSymbol('P6_3/mmc')).toBe('P63/MMC');
  expect(normalizeSpaceGroupSymbol('P 63.m m c')).toBe('P63/MMC');
  expect(normalizeSpaceGroupSymbol('Fm3̄m')).toBe('FM-3M');
  expect(normalizeSpaceGroupSymbol('-P 2ybc')).toBe('-P2YBC');
});
