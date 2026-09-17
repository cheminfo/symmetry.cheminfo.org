import type { CharacterTable } from './types.ts';
import { characterTable } from './types.ts';

/**
 * The cubic and icosahedral groups.
 *
 * In `T` and `Tₕ` the eight three-folds fall into **two** classes, `4C₃` and
 * `4C₃²`, which is why those groups have a complex `E` pair where `T_d` and `O`
 * — whose eight three-folds are one class — have a real two-dimensional `E`.
 */
export const CUBIC_TABLES: readonly CharacterTable[] = [
  characterTable('T', [
    'A|1 1 1 1||x2+y2+z2',
    'E+|1 w1/3 w2/3 1||2z2-x2-y2 x2-y2',
    'E-|1 w2/3 w1/3 1||',
    'T|3 0 0 -1|x y z Rx Ry Rz|xy xz yz',
  ]),
  characterTable(
    'Th',
    [
      'Ag|1 1 1 1 1 1 1 1||x2+y2+z2',
      'Eg+|1 w1/3 w2/3 1 1 w2/3 w1/3 1||2z2-x2-y2 x2-y2',
      'Eg-|1 w2/3 w1/3 1 1 w1/3 w2/3 1||',
      'Tg|3 0 0 -1 3 0 0 -1|Rx Ry Rz|xy xz yz',
      'Au|1 1 1 1 -1 -1 -1 -1||',
      'Eu+|1 w1/3 w2/3 1 -1 -w2/3 -w1/3 -1||',
      'Eu-|1 w2/3 w1/3 1 -1 -w1/3 -w2/3 -1||',
      'Tu|3 0 0 -1 -3 0 0 1|x y z|',
    ],
    'The ε and ε* of the 4S6 columns are exchanged relative to the 4C3 columns, because i·C3 = S6⁵. Tables that print them unexchanged are the same table with the two S6 class labels swapped; the combined real row, 2 −1 −1 2 2 −1 −1 2, is the same either way.',
  ),
  characterTable('Td', [
    'A1|1 1 1 1 1||x2+y2+z2',
    'A2|1 1 1 -1 -1||',
    'E|2 -1 2 0 0||2z2-x2-y2 x2-y2',
    'T1|3 0 -1 1 -1|Rx Ry Rz|',
    'T2|3 0 -1 -1 1|x y z|xy xz yz',
  ]),
  characterTable('O', [
    'A1|1 1 1 1 1||x2+y2+z2',
    'A2|1 -1 1 1 -1||',
    'E|2 0 2 -1 0||2z2-x2-y2 x2-y2',
    'T1|3 1 -1 0 -1|x y z Rx Ry Rz|',
    'T2|3 -1 -1 0 1||xy xz yz',
  ]),
  characterTable('Oh', [
    'A1g|1 1 1 1 1 1 1 1 1 1||x2+y2+z2',
    'A2g|1 1 -1 -1 1 1 -1 1 1 -1||',
    'Eg|2 -1 0 0 2 2 0 -1 2 0||2z2-x2-y2 x2-y2',
    'T1g|3 0 -1 1 -1 3 1 0 -1 -1|Rx Ry Rz|',
    'T2g|3 0 1 -1 -1 3 -1 0 -1 1||xz yz xy',
    'A1u|1 1 1 1 1 -1 -1 -1 -1 -1||',
    'A2u|1 1 -1 -1 1 -1 1 -1 -1 1||',
    'Eu|2 -1 0 0 2 -2 0 1 -2 0||',
    'T1u|3 0 -1 1 -1 -3 -1 0 1 1|x y z|',
    'T2u|3 0 1 -1 -1 -3 1 0 1 -1||',
  ]),
  characterTable('I', [
    'A|1 1 1 1 1||x2+y2+z2',
    'T1|3 p q 0 -1|x y z Rx Ry Rz|',
    'T2|3 q p 0 -1||',
    'G|4 -1 -1 1 0||',
    'H|5 0 0 -1 1||2z2-x2-y2 x2-y2 xy xz yz',
  ]),
  characterTable(
    'Ih',
    [
      'Ag|1 1 1 1 1 1 1 1 1 1||x2+y2+z2',
      'T1g|3 p q 0 -1 3 q p 0 -1|Rx Ry Rz|',
      'T2g|3 q p 0 -1 3 p q 0 -1||',
      'Gg|4 -1 -1 1 0 4 -1 -1 1 0||',
      'Hg|5 0 0 -1 1 5 0 0 -1 1||2z2-x2-y2 x2-y2 xy xz yz',
      'Au|1 1 1 1 1 -1 -1 -1 -1 -1||',
      'T1u|3 p q 0 -1 -3 -q -p 0 1|x y z|',
      'T2u|3 q p 0 -1 -3 -p -q 0 1||',
      'Gu|4 -1 -1 1 0 -4 1 1 -1 0||',
      'Hu|5 0 0 -1 1 -5 0 0 1 -1||',
    ],
    'The fullerene literature writes F1u for T1u; both name the same irrep.',
  ),
];
