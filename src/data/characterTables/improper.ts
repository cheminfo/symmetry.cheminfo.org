import type { CharacterTable } from './types.ts';
import { characterTable } from './types.ts';

/**
 * `D_nd` — a `Dₙ` with n dihedral mirrors, which brings an `S_2n` along the
 * principal axis. It holds the inversion exactly when n is **odd**, the opposite
 * of `D_nh`.
 */
export const DND_TABLES: readonly CharacterTable[] = [
  characterTable(
    'D2d',
    [
      'A1|1 1 1 1 1||x2+y2 z2',
      'A2|1 1 1 -1 -1|Rz|',
      'B1|1 -1 1 1 -1||x2-y2',
      'B2|1 -1 1 -1 1|z|xy',
      'E|2 0 -2 0 0|x y Rx Ry|xz yz',
    ],
    'The two C2′ axes are on x and y, so B2 carries both z and xy. Sources that put the σd planes on x and y print B1 for z.',
  ),
  characterTable('D3d', [
    'A1g|1 1 1 1 1 1||x2+y2 z2',
    'A2g|1 1 -1 1 1 -1|Rz|',
    'Eg|2 -1 0 2 -1 0|Rx Ry|x2-y2 xy xz yz',
    'A1u|1 1 1 -1 -1 -1||',
    'A2u|1 1 -1 -1 -1 1|z|',
    'Eu|2 -1 0 -2 1 0|x y|',
  ]),
  characterTable('D4d', [
    'A1|1 1 1 1 1 1 1||x2+y2 z2',
    'A2|1 1 1 1 1 -1 -1|Rz|',
    'B1|1 -1 1 -1 1 1 -1||',
    'B2|1 -1 1 -1 1 -1 1|z|',
    'E1|2 r2 0 -r2 -2 0 0|x y|',
    'E2|2 0 -2 0 2 0 0||x2-y2 xy',
    'E3|2 -r2 0 r2 -2 0 0|Rx Ry|xz yz',
  ]),
  characterTable(
    'D5d',
    [
      'A1g|1 1 1 1 1 1 1 1||x2+y2 z2',
      'A2g|1 1 1 -1 1 1 1 -1|Rz|',
      'E1g|2 a b 0 2 a b 0|Rx Ry|xz yz',
      'E2g|2 b a 0 2 b a 0||x2-y2 xy',
      'A1u|1 1 1 1 -1 -1 -1 -1||',
      'A2u|1 1 1 -1 -1 -1 -1 1|z|',
      'E1u|2 a b 0 -2 -a -b 0|x y|',
      'E2u|2 b a 0 -2 -b -a 0||',
    ],
    'Cotton prints 2S10³ before 2S10, because i·C5 = S10⁷ lies in the 2S10³ class and the gerade rows then mirror the proper half.',
  ),
];

/**
 * `Sₙ` for even n — one improper axis and nothing else. Cyclic and abelian, so
 * every degenerate `E` is a complex pair.
 *
 * `S₆ = C₃ ⊗ C_i`, and its class order `i, S₆⁵, S₆` is what makes the gerade
 * rows mirror: `i·C₃ = S₆⁵`, not `S₆`.
 */
export const SN_TABLES: readonly CharacterTable[] = [
  characterTable('S4', [
    'A|1 1 1 1|Rz|x2+y2 z2',
    'B|1 -1 1 -1|z|x2-y2 xy',
    'E+|1 w1/4 w2/4 w3/4|x y Rx Ry|xz yz',
    'E-|1 w3/4 w2/4 w1/4||',
  ]),
  characterTable('S6', [
    'Ag|1 1 1 1 1 1|Rz|x2+y2 z2',
    'Eg+|1 w1/3 w2/3 1 w1/3 w2/3|Rx Ry|x2-y2 xy xz yz',
    'Eg-|1 w2/3 w1/3 1 w2/3 w1/3||',
    'Au|1 1 1 -1 -1 -1|z|',
    'Eu+|1 w1/3 w2/3 -1 -w1/3 -w2/3|x y|',
    'Eu-|1 w2/3 w1/3 -1 -w2/3 -w1/3||',
  ]),
  characterTable('S8', [
    'A|1 1 1 1 1 1 1 1|Rz|x2+y2 z2',
    'B|1 -1 1 -1 1 -1 1 -1|z|',
    'E1+|1 w1/8 w2/8 w3/8 w4/8 w5/8 w6/8 w7/8|x y|',
    'E1-|1 w7/8 w14/8 w21/8 w28/8 w35/8 w42/8 w49/8||',
    'E2+|1 w2/8 w4/8 w6/8 w8/8 w10/8 w12/8 w14/8||x2-y2 xy',
    'E2-|1 w6/8 w12/8 w18/8 w24/8 w30/8 w36/8 w42/8||',
    'E3+|1 w3/8 w6/8 w9/8 w12/8 w15/8 w18/8 w21/8|Rx Ry|xz yz',
    'E3-|1 w5/8 w10/8 w15/8 w20/8 w25/8 w30/8 w35/8||',
  ]),
];
