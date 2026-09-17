import { expect, test } from 'vitest';

import { PAGE_ROUTES } from '../routes.ts';

/**
 * How a program spells a symmetry operation, and a person never does.
 *
 * A description is the sentence a search result and a link preview show to a
 * reader, so `2S12^5` in one is source code that escaped: the caret is a power
 * written for a parser, a bracketed vector is an axis printed by a debugger,
 * and an underscore is a subscript nobody typed. A symbol a chemist searches
 * for — `Fm-3m`, `C2v`, the orbifold `*632` — is prose here and is not listed.
 */
const NOTATION: ReadonlyArray<readonly [string, RegExp]> = [
  ['a power written for a parser, as in C3^2 or 2S12^5', /\^/],
  ['a bracketed vector, as in [0.577, 0.577, 0.577]', /\[[^\]]*\d/],
  ['an underscore standing in for a subscript, as in C_3', /[A-Za-z]_\d/],
  ['a field separator left in the prose', /\|/],
  ['a doubled space', / {2}/],
  ['markup a search result would print as it stands', /[`{}<>]/],
];

test('no description spells a symmetry operation the way a program does', () => {
  const offenders: string[] = [];
  let checked = 0;
  for (const route of PAGE_ROUTES) {
    for (const [what, pattern] of NOTATION) {
      if (pattern.test(route.description)) {
        offenders.push(`${route.path}: ${what}`);
      }
    }
    checked++;
  }

  expect(offenders).toStrictEqual([]);
  expect(checked).toBe(365);
});

test('the guard catches the spelling it was written for', () => {
  const asItWas =
    'The D6d point group has 24 symmetry operations in 9 classes: E, 2S12, 2C6, 2S4, 2C3, 2S12^5, C2, 6C2′, 6σd.';

  expect(NOTATION.filter(([, pattern]) => pattern.test(asItWas))).toHaveLength(
    1,
  );
  expect(
    NOTATION.filter(([, pattern]) =>
      pattern.test('The axis is [0.577, 0.577, 0.577]  and C_3 | σv'),
    ),
  ).toHaveLength(4);
});

test('a symbol a chemist searches for is prose, and is left alone', () => {
  const kept = [
    'Space group 225, F m -3 m (Fm-3m): cubic, face-centred lattice, class m-3m.',
    'Wallpaper group 17 of 17, p6m: a hexagonal lattice, point group 6mm, orbifold *632.',
    'The C2v point group is built on a two-fold axis with two mirror planes through it.',
  ];

  for (const text of kept) {
    expect(NOTATION.filter(([, pattern]) => pattern.test(text))).toStrictEqual(
      [],
    );
  }
  expect(kept).toHaveLength(3);
});
