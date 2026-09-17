import { formatTranslation } from './formatOperation.ts';
import { TWELFTHS_PER_CELL } from './types.ts';

/** What kind of geometric object an operation is, as a student sees it. */
export type SymmetryElementKind =
  | 'identity'
  | 'translation'
  | 'rotation'
  | 'screw'
  | 'mirror'
  | 'glide'
  | 'inversion'
  | 'rotoinversion';

/**
 * How a crystallographer writes the element: `1`, `3`, `2_1`, `4_3`, `m`, `a`,
 * `n`, `d`, `g`, `-1`, `-4`, `t(1/2,1/2,0)`.
 *
 * A glide is named from its glide vector: half a cell edge is `a`, `b` or `c`,
 * two halves together is `n`, a quarter is `d`, and in two dimensions there is
 * only one kind of glide line, written `g`. The `e` of a doubled glide plane
 * describes the plane rather than one operation, so it is never emitted here.
 *
 * @param kind - The classification of the operation.
 * @param order - n of the n-fold; 2 for a mirror or a glide.
 * @param intrinsic - The reduced intrinsic translation, in twelfths.
 * @param screw - The `m` of an `n_m` screw, from {@link screwIndex}.
 */
export function elementSymbol(
  kind: SymmetryElementKind,
  order: number,
  intrinsic: readonly number[],
  screw: number,
): string {
  switch (kind) {
    case 'identity':
      return '1';
    case 'translation':
      return `t(${formatTranslation(intrinsic)})`;
    case 'rotation':
      return String(order);
    case 'screw':
      return `${order}_${screw}`;
    case 'mirror':
      return 'm';
    case 'glide':
      return glideSymbol(intrinsic);
    case 'inversion':
      return '-1';
    case 'rotoinversion':
      return `-${order}`;
    default:
      throw new RangeError(
        `there is no symmetry element of kind ${String(kind)}`,
      );
  }
}

/**
 * The `m` of an `n_m` screw: the pitch is `m/n` of the shortest lattice
 * translation along the axis, which in a centred cell is a centring vector and
 * not the cell edge.
 *
 * @param order - n of the n-fold.
 * @param coefficient - How far the intrinsic translation runs along the axis, in twelfths.
 * @param period - How far the shortest lattice translation along it runs, in twelfths.
 * @throws When the pitch is no multiple of `1/order` of that translation, which
 *   means the lattice it was measured against is not this group's.
 */
export function screwIndex(
  order: number,
  coefficient: number,
  period: number,
): number {
  const exact = (order * coefficient) / period;
  const pitch = Math.round(exact);
  const index = ((pitch % order) + order) % order;
  if (Math.abs(exact - pitch) > 1e-9 || index === 0) {
    throw new RangeError(
      `a pitch of ${coefficient}/${period} is no screw of order ${order}: the lattice translations given are not this operation's`,
    );
  }
  return index;
}

function glideSymbol(intrinsic: readonly number[]): string {
  if (intrinsic.length === 2) return 'g';
  const half = TWELFTHS_PER_CELL / 2;
  const names = ['a', 'b', 'c'];
  let halves = 0;
  let onlyName = 'n';
  for (let index = 0; index < intrinsic.length; index++) {
    const value = Math.abs(intrinsic[index] ?? 0) % TWELFTHS_PER_CELL;
    if (value === 0) continue;
    if (value !== half) return 'd';
    halves += 1;
    onlyName = names[index] ?? 'n';
  }
  return halves === 1 ? onlyName : 'n';
}
