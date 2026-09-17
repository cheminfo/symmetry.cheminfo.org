import {
  classifyRotation,
  elementAxis,
  elementKind,
  elementNormal,
  elementSpan,
  locateElement,
} from './elementGeometry.ts';
import type { SymmetryElementKind } from './elementSymbol.ts';
import { elementSymbol, screwIndex } from './elementSymbol.ts';
import { centringTranslations } from './group.ts';
import {
  matrixOrder,
  matrixPowerSum,
  multiplyMatrixVector,
} from './integerMatrix.ts';
import { reduceIntrinsic } from './intrinsic.ts';
import { wrapTwelfths } from './operation.ts';
import type { CrystalOperation, Dimension } from './types.ts';
import { TWELFTHS_PER_CELL } from './types.ts';

export type { SymmetryElementKind } from './elementSymbol.ts';

/** The geometric object an operation is: what gets drawn, and what gets labelled. */
export interface SymmetryElement {
  readonly kind: SymmetryElementKind;
  /** n of the n-fold: 1 for the identity, a centring translation and an inversion centre; 2 for a mirror or a glide. */
  readonly order: number;
  /** `1`, `3`, `2_1`, `m`, `c`, `n`, `d`, `g`, `-1`, `-4`, `t(1/2,1/2,0)`. */
  readonly symbol: string;
  /** A point the element passes through: `location[i] / locationDenominator`, fractional and exact. */
  readonly location: readonly number[];
  /** The common denominator of `location`; always positive. */
  readonly locationDenominator: number;
  /** The screw pitch or the glide vector, in twelfths, lying in the locus; all zeros for everything else. */
  readonly intrinsic: readonly number[];
  /** Primitive direct-space direction `[uvw]` of an axis, or `null` when the element has none. */
  readonly axis: readonly number[] | null;
  /** Primitive reciprocal-space normal `(hkl)` of a mirror or glide, or `null`. */
  readonly normal: readonly number[] | null;
  /** Integer basis of the locus: empty for a point, one vector for a line, two for a plane. */
  readonly span: ReadonlyArray<readonly number[]>;
}

/**
 * The symmetry element an operation *is* — the Wondratschek decomposition of
 * International Tables §11.2, in exact integer arithmetic.
 *
 * The translation splits into an **intrinsic** part `P · w`, which is the screw
 * pitch or the glide vector, and a **location** part `w − P · w`, which says
 * where the element sits; `P = (1/k) Σ Wⁿ` projects onto the +1 eigenspace. The
 * same twenty lines give a rotation axis in three dimensions and a rotation
 * point in two, a glide plane and a glide line, and no screw axis and no
 * inversion centre in two dimensions, where `−I` is the 2-fold rotation.
 *
 * @param operation - Any operation; its translation is read as written, so a
 *   caller drawing a diagram adds the whole-cell shifts before calling.
 * @param centring - The lattice translations of the group, in twelfths. Without
 *   them the lattice is taken to be primitive, and a centred group's mirrors are
 *   then reported as glides and its screw pitches measured against the wrong
 *   translation. {@link symmetryElements} supplies them.
 * @throws When the operation is not one of a crystallographic group.
 */
export function symmetryElement(
  operation: CrystalOperation<Dimension>,
  centring?: ReadonlyArray<readonly number[]>,
): SymmetryElement {
  const rotation = operation.rotation;
  const dimension = rotation.length as Dimension;
  const { order, proper } = classifyRotation(rotation, dimension);
  const period = matrixOrder(rotation);
  const powerSum = matrixPowerSum(rotation, period);

  const scaled = multiplyMatrixVector(powerSum, operation.translation);
  const exact = new Array<number>(dimension).fill(0);
  for (let index = 0; index < dimension; index++) {
    const value = scaled[index] ?? 0;
    if (value % period !== 0) {
      throw new RangeError(
        'the operation is not one of a crystallographic group: its intrinsic translation is not a twelfth',
      );
    }
    exact[index] = value / period;
  }

  // `exact` locates the element. `intrinsic` is the same vector reduced into the
  // element's own locus, which is what decides whether it glides at all.
  const everywhere = proper && order === 1;
  const span = everywhere ? [] : elementSpan(powerSum);
  const lattice = centring ?? [new Array<number>(dimension).fill(0)];
  const reduced = everywhere
    ? { intrinsic: exact.map(wrapTwelfths), coefficients: [], periods: [] }
    : reduceIntrinsic(exact, span, lattice);
  const kind = elementKind(proper, order, dimension, reduced.intrinsic);
  const axis = elementAxis(rotation, kind, order);
  return {
    kind,
    order,
    symbol: elementSymbol(
      kind,
      order,
      reduced.intrinsic,
      kind === 'screw'
        ? screwIndex(
            order,
            reduced.coefficients[0] ?? 0,
            reduced.periods[0] ?? 0,
          )
        : 0,
    ),
    ...locateElement(rotation, powerSum, period, operation.translation, exact),
    intrinsic: reduced.intrinsic,
    axis,
    normal:
      kind === 'mirror' || kind === 'glide' ? elementNormal(rotation) : null,
    span: kind === 'identity' || kind === 'translation' ? [] : span,
  };
}

/**
 * Every distinct element of a group, deduplicated on its geometry rather than on
 * the operation that produced it: one mirror line comes from several operations.
 *
 * The lattice translations are read off the operations themselves, so a centred
 * group is decomposed against its own lattice.
 *
 * @param operations - The coset list, centring translations included.
 * @param shifts - Whole-cell lattice translations to decompose as well, so a
 *   diagram shows the elements that continue past the cell edge.
 *   @default [the zero shift]
 */
export function symmetryElements(
  operations: ReadonlyArray<CrystalOperation<Dimension>>,
  shifts?: ReadonlyArray<readonly number[]>,
): SymmetryElement[] {
  const dimension = operations[0]?.rotation.length ?? 3;
  const offsets = shifts ?? [new Array<number>(dimension).fill(0)];
  const centring = centringTranslations(operations);
  const found = new Map<string, SymmetryElement>();
  for (const offset of offsets) {
    for (const operation of operations) {
      const translation = new Array<number>(dimension).fill(0);
      for (let index = 0; index < dimension; index++) {
        translation[index] =
          (operation.translation[index] ?? 0) +
          TWELFTHS_PER_CELL * (offset[index] ?? 0);
      }
      const element = symmetryElement(
        {
          dimension: operation.dimension,
          rotation: operation.rotation,
          translation,
        },
        centring,
      );
      const key = elementKey(element);
      if (!found.has(key)) found.set(key, element);
    }
  }
  return [...found.values()];
}

/** The point the element passes through, as ordinary fractional numbers. */
export function elementPoint(element: SymmetryElement): number[] {
  const point = new Array<number>(element.location.length).fill(0);
  for (let index = 0; index < element.location.length; index++) {
    point[index] = (element.location[index] ?? 0) / element.locationDenominator;
  }
  return point;
}

/** The exact key two occurrences of one element share. */
export function elementKey(element: SymmetryElement): string {
  const location = `${element.location.join(',')}/${element.locationDenominator}`;
  const direction = `${element.axis?.join(',') ?? ''}|${element.normal?.join(',') ?? ''}`;
  return `${element.kind}|${element.symbol}|${location}|${direction}`;
}
