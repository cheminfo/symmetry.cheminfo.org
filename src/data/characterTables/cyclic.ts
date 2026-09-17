import type { CharacterTable } from './types.ts';
import { characterTable } from './types.ts';

/**
 * The non-axial groups and the cyclic `Cₙ`.
 *
 * Every `Cₙ` with n ≥ 3 is abelian with n one-dimensional irreps, so its `E` is
 * a **pair** of complex conjugate rows, not a two-dimensional irrep. The pair is
 * stored; the single real row a textbook prints is their sum.
 */
export const CYCLIC_TABLES: readonly CharacterTable[] = [
  characterTable('C1', ['A|1|x y z Rx Ry Rz|x2 y2 z2 xy xz yz']),
  characterTable('Cs', ['A′|1 1|x y Rz|x2 y2 z2 xy', 'A″|1 -1|z Rx Ry|xz yz']),
  characterTable('Ci', ['Ag|1 1|Rx Ry Rz|x2 y2 z2 xy xz yz', 'Au|1 -1|x y z|']),
  characterTable('C2', ['A|1 1|z Rz|x2 y2 z2 xy', 'B|1 -1|x y Rx Ry|xz yz']),
  characterTable('C3', [
    'A|1 1 1|z Rz|x2+y2 z2',
    'E+|1 w1/3 w2/3|x y Rx Ry|x2-y2 xy xz yz',
    'E-|1 w2/3 w1/3||',
  ]),
  characterTable('C4', [
    'A|1 1 1 1|z Rz|x2+y2 z2',
    'B|1 -1 1 -1||x2-y2 xy',
    'E+|1 w1/4 w2/4 w3/4|x y Rx Ry|xz yz',
    'E-|1 w3/4 w2/4 w1/4||',
  ]),
  characterTable('C5', [
    'A|1 1 1 1 1|z Rz|x2+y2 z2',
    'E1+|1 w1/5 w2/5 w3/5 w4/5|x y Rx Ry|xz yz',
    'E1-|1 w4/5 w3/5 w2/5 w1/5||',
    'E2+|1 w2/5 w4/5 w6/5 w8/5||x2-y2 xy',
    'E2-|1 w3/5 w6/5 w9/5 w12/5||',
  ]),
  characterTable('C6', [
    'A|1 1 1 1 1 1|z Rz|x2+y2 z2',
    'B|1 -1 1 -1 1 -1||',
    'E1+|1 w1/6 w2/6 w3/6 w4/6 w5/6|x y Rx Ry|xz yz',
    'E1-|1 w5/6 w10/6 w15/6 w20/6 w25/6||',
    'E2+|1 w2/6 w4/6 w6/6 w8/6 w10/6||x2-y2 xy',
    'E2-|1 w4/6 w8/6 w12/6 w16/6 w20/6||',
  ]),
];
