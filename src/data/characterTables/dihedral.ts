import type { CharacterTable } from './types.ts';
import { characterTable } from './types.ts';

/** `Dₙ` — a principal axis and n perpendicular two-folds. Every one is chiral. */
export const DN_TABLES: readonly CharacterTable[] = [
  characterTable('D2', [
    'A|1 1 1 1||x2 y2 z2',
    'B1|1 1 -1 -1|z Rz|xy',
    'B2|1 -1 1 -1|y Ry|xz',
    'B3|1 -1 -1 1|x Rx|yz',
  ]),
  characterTable('D3', [
    'A1|1 1 1||x2+y2 z2',
    'A2|1 1 -1|z Rz|',
    'E|2 -1 0|x y Rx Ry|x2-y2 xy xz yz',
  ]),
  characterTable('D4', [
    'A1|1 1 1 1 1||x2+y2 z2',
    'A2|1 1 1 -1 -1|z Rz|',
    'B1|1 -1 1 1 -1||x2-y2',
    'B2|1 -1 1 -1 1||xy',
    'E|2 0 -2 0 0|x y Rx Ry|xz yz',
  ]),
  characterTable('D5', [
    'A1|1 1 1 1||x2+y2 z2',
    'A2|1 1 1 -1|z Rz|',
    'E1|2 a b 0|x y Rx Ry|xz yz',
    'E2|2 b a 0||x2-y2 xy',
  ]),
  characterTable('D6', [
    'A1|1 1 1 1 1 1||x2+y2 z2',
    'A2|1 1 1 1 -1 -1|z Rz|',
    'B1|1 -1 1 -1 1 -1||',
    'B2|1 -1 1 -1 -1 1||',
    'E1|2 1 -1 -2 0 0|x y Rx Ry|xz yz',
    'E2|2 -1 -1 2 0 0||x2-y2 xy',
  ]),
];

/**
 * `D_nh` — a `Dₙ` with a horizontal mirror, so it holds the inversion exactly
 * when n is even.
 *
 * D₆h prints `3σd` before `3σv`, which is Cotton's order and is chosen so the
 * improper half mirrors the proper half class for class. A table that prints
 * `3σv, 3σd` must swap the last two entries of every row.
 */
export const DNH_TABLES: readonly CharacterTable[] = [
  characterTable('D2h', [
    'Ag|1 1 1 1 1 1 1 1||x2 y2 z2',
    'B1g|1 1 -1 -1 1 1 -1 -1|Rz|xy',
    'B2g|1 -1 1 -1 1 -1 1 -1|Ry|xz',
    'B3g|1 -1 -1 1 1 -1 -1 1|Rx|yz',
    'Au|1 1 1 1 -1 -1 -1 -1||',
    'B1u|1 1 -1 -1 -1 -1 1 1|z|',
    'B2u|1 -1 1 -1 -1 1 -1 1|y|',
    'B3u|1 -1 -1 1 -1 1 1 -1|x|',
  ]),
  characterTable('D3h', [
    'A1′|1 1 1 1 1 1||x2+y2 z2',
    'A2′|1 1 -1 1 1 -1|Rz|',
    'E′|2 -1 0 2 -1 0|x y|x2-y2 xy',
    'A1″|1 1 1 -1 -1 -1||',
    'A2″|1 1 -1 -1 -1 1|z|',
    'E″|2 -1 0 -2 1 0|Rx Ry|xz yz',
  ]),
  characterTable('D4h', [
    'A1g|1 1 1 1 1 1 1 1 1 1||x2+y2 z2',
    'A2g|1 1 1 -1 -1 1 1 1 -1 -1|Rz|',
    'B1g|1 -1 1 1 -1 1 -1 1 1 -1||x2-y2',
    'B2g|1 -1 1 -1 1 1 -1 1 -1 1||xy',
    'Eg|2 0 -2 0 0 2 0 -2 0 0|Rx Ry|xz yz',
    'A1u|1 1 1 1 1 -1 -1 -1 -1 -1||',
    'A2u|1 1 1 -1 -1 -1 -1 -1 1 1|z|',
    'B1u|1 -1 1 1 -1 -1 1 -1 -1 1||',
    'B2u|1 -1 1 -1 1 -1 1 -1 1 -1||',
    'Eu|2 0 -2 0 0 -2 0 2 0 0|x y|',
  ]),
  characterTable('D5h', [
    'A1′|1 1 1 1 1 1 1 1||x2+y2 z2',
    'A2′|1 1 1 -1 1 1 1 -1|Rz|',
    'E1′|2 a b 0 2 a b 0|x y|',
    'E2′|2 b a 0 2 b a 0||x2-y2 xy',
    'A1″|1 1 1 1 -1 -1 -1 -1||',
    'A2″|1 1 1 -1 -1 -1 -1 1|z|',
    'E1″|2 a b 0 -2 -a -b 0|Rx Ry|xz yz',
    'E2″|2 b a 0 -2 -b -a 0||',
  ]),
  characterTable('D6h', [
    'A1g|1 1 1 1 1 1 1 1 1 1 1 1||x2+y2 z2',
    'A2g|1 1 1 1 -1 -1 1 1 1 1 -1 -1|Rz|',
    'B1g|1 -1 1 -1 1 -1 1 -1 1 -1 1 -1||',
    'B2g|1 -1 1 -1 -1 1 1 -1 1 -1 -1 1||',
    'E1g|2 1 -1 -2 0 0 2 1 -1 -2 0 0|Rx Ry|xz yz',
    'E2g|2 -1 -1 2 0 0 2 -1 -1 2 0 0||x2-y2 xy',
    'A1u|1 1 1 1 1 1 -1 -1 -1 -1 -1 -1||',
    'A2u|1 1 1 1 -1 -1 -1 -1 -1 -1 1 1|z|',
    'B1u|1 -1 1 -1 1 -1 -1 1 -1 1 -1 1||',
    'B2u|1 -1 1 -1 -1 1 -1 1 -1 1 1 -1||',
    'E1u|2 1 -1 -2 0 0 -2 -1 1 2 0 0|x y|',
    'E2u|2 -1 -1 2 0 0 -2 1 1 -2 0 0||',
  ]),
];
