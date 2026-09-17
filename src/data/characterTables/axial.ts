import type { CharacterTable } from './types.ts';
import { characterTable } from './types.ts';

/** `C_nv` — a principal axis and n vertical mirrors. */
export const CNV_TABLES: readonly CharacterTable[] = [
  characterTable(
    'C2v',
    [
      'A1|1 1 1 1|z|x2 y2 z2',
      'A2|1 1 -1 -1|Rz|xy',
      'B1|1 -1 1 -1|x Ry|xz',
      'B2|1 -1 -1 1|y Rx|yz',
    ],
    'Water is drawn in the yz plane, the Mulliken recommendation of 1955, so the out-of-plane lone pair is b1. Books that draw it in xz swap b1 and b2; the characters are the same.',
  ),
  characterTable('C3v', [
    'A1|1 1 1|z|x2+y2 z2',
    'A2|1 1 -1|Rz|',
    'E|2 -1 0|x y Rx Ry|x2-y2 xy xz yz',
  ]),
  characterTable(
    'C4v',
    [
      'A1|1 1 1 1 1|z|x2+y2 z2',
      'A2|1 1 1 -1 -1|Rz|',
      'B1|1 -1 1 1 -1||x2-y2',
      'B2|1 -1 1 -1 1||xy',
      'E|2 0 -2 0 0|x y Rx Ry|xz yz',
    ],
    'The ligands sit on the x and y axes, so σv contains them and x2−y2 is B1. Swapping σv and σd swaps B1 and B2.',
  ),
  characterTable('C5v', [
    'A1|1 1 1 1|z|x2+y2 z2',
    'A2|1 1 1 -1|Rz|',
    'E1|2 a b 0|x y Rx Ry|xz yz',
    'E2|2 b a 0||x2-y2 xy',
  ]),
  characterTable('C6v', [
    'A1|1 1 1 1 1 1|z|x2+y2 z2',
    'A2|1 1 1 1 -1 -1|Rz|',
    'B1|1 -1 1 -1 1 -1||',
    'B2|1 -1 1 -1 -1 1||',
    'E1|2 1 -1 -2 0 0|x y Rx Ry|xz yz',
    'E2|2 -1 -1 2 0 0||x2-y2 xy',
  ]),
];

/**
 * `C_nh` — a principal axis and a horizontal mirror.
 *
 * The improper classes are ordered so that the gerade rows mirror the proper
 * half: `i·C₄ = S₄³`, `i·C₆ = S₃⁵` and `i·C₃ = S₆⁵`, which is why the S columns
 * do not run in the order the axis order would suggest.
 */
export const CNH_TABLES: readonly CharacterTable[] = [
  characterTable('C2h', [
    'Ag|1 1 1 1|Rz|x2 y2 z2 xy',
    'Bg|1 -1 1 -1|Rx Ry|xz yz',
    'Au|1 1 -1 -1|z|',
    'Bu|1 -1 -1 1|x y|',
  ]),
  characterTable('C3h', [
    'A′|1 1 1 1 1 1|Rz|x2+y2 z2',
    'E′+|1 w1/3 w2/3 1 w1/3 w2/3|x y|x2-y2 xy',
    'E′-|1 w2/3 w1/3 1 w2/3 w1/3||',
    'A″|1 1 1 -1 -1 -1|z|',
    'E″+|1 w1/3 w2/3 -1 -w1/3 -w2/3|Rx Ry|xz yz',
    'E″-|1 w2/3 w1/3 -1 -w2/3 -w1/3||',
  ]),
  characterTable('C4h', [
    'Ag|1 1 1 1 1 1 1 1|Rz|x2+y2 z2',
    'Bg|1 -1 1 -1 1 -1 1 -1||x2-y2 xy',
    'Eg+|1 w1/4 w2/4 w3/4 1 w1/4 w2/4 w3/4|Rx Ry|xz yz',
    'Eg-|1 w3/4 w2/4 w1/4 1 w3/4 w2/4 w1/4||',
    'Au|1 1 1 1 -1 -1 -1 -1|z|',
    'Bu|1 -1 1 -1 -1 1 -1 1||',
    'Eu+|1 w1/4 w2/4 w3/4 -1 -w1/4 -w2/4 -w3/4|x y|',
    'Eu-|1 w3/4 w2/4 w1/4 -1 -w3/4 -w2/4 -w1/4||',
  ]),
  characterTable('C6h', [
    'Ag|1 1 1 1 1 1 1 1 1 1 1 1|Rz|x2+y2 z2',
    'Bg|1 -1 1 -1 1 -1 1 -1 1 -1 1 -1||',
    'E1g+|1 w1/6 w2/6 w3/6 w4/6 w5/6 1 w1/6 w2/6 w3/6 w4/6 w5/6|Rx Ry|xz yz',
    'E1g-|1 w5/6 w10/6 w15/6 w20/6 w25/6 1 w5/6 w10/6 w15/6 w20/6 w25/6||',
    'E2g+|1 w2/6 w4/6 w6/6 w8/6 w10/6 1 w2/6 w4/6 w6/6 w8/6 w10/6||x2-y2 xy',
    'E2g-|1 w4/6 w8/6 w12/6 w16/6 w20/6 1 w4/6 w8/6 w12/6 w16/6 w20/6||',
    'Au|1 1 1 1 1 1 -1 -1 -1 -1 -1 -1|z|',
    'Bu|1 -1 1 -1 1 -1 -1 1 -1 1 -1 1||',
    'E1u+|1 w1/6 w2/6 w3/6 w4/6 w5/6 -1 -w1/6 -w2/6 -w3/6 -w4/6 -w5/6|x y|',
    'E1u-|1 w5/6 w10/6 w15/6 w20/6 w25/6 -1 -w5/6 -w10/6 -w15/6 -w20/6 -w25/6||',
    'E2u+|1 w2/6 w4/6 w6/6 w8/6 w10/6 -1 -w2/6 -w4/6 -w6/6 -w8/6 -w10/6||',
    'E2u-|1 w4/6 w8/6 w12/6 w16/6 w20/6 -1 -w4/6 -w8/6 -w12/6 -w16/6 -w20/6||',
  ]),
];
