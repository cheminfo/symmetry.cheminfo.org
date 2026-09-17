import { Matrix, inverse } from 'ml-matrix';

/** The six parameters of a unit cell: three edges in Å, three angles in degrees. */
export interface UnitCell {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  /** Angle between b and c, in degrees. */
  readonly alpha: number;
  /** Angle between c and a, in degrees. */
  readonly beta: number;
  /** Angle between a and b, in degrees. */
  readonly gamma: number;
}

/** A cell with everything derived from it computed once. */
export interface Lattice {
  readonly cell: UnitCell;
  /** The metric tensor G, so `u · v = uᵀ G v` for fractional u and v. */
  readonly metric: number[][];
  /** The cell volume in Å³. */
  readonly volume: number;
  /** M, whose columns are the Cartesian components of a, b and c. */
  readonly cartesian: number[][];
  /** M⁻¹. */
  readonly fractional: number[][];
  /** G* = G⁻¹, so `1/d²(hkl) = (h k l) G* (h k l)ᵀ`. */
  readonly reciprocalMetric: number[][];
}

/**
 * Everything a cell implies, computed once.
 *
 * **The Cartesian convention is the PDB / CCP4 one**, which is what molstar and
 * every CIF consumer assumes: **a** lies along **x**, **b** lies in the **xy**
 * plane with a positive **y** component, and **c** completes a right-handed set.
 * There are two other conventions in common use and they disagree with this one,
 * so never mix Cartesian coordinates from another source without checking.
 */
export function createLattice(cell: UnitCell): Lattice {
  const metric = metricTensor(cell);
  const cartesian = cartesianMatrix(cell);
  return {
    cell,
    metric,
    volume: cellVolume(cell),
    cartesian,
    fractional: inverse(new Matrix(cartesian)).to2DArray(),
    reciprocalMetric: inverse(new Matrix(metric)).to2DArray(),
  };
}

/**
 * The metric tensor G. Its diagonal is `a², b², c²` and its off-diagonal terms
 * carry the angles, so a length or an angle is read without ever leaving
 * fractional coordinates.
 */
export function metricTensor(cell: UnitCell): number[][] {
  const { a, b, c, alpha, beta, gamma } = cell;
  const cosAlpha = Math.cos(toRadians(alpha));
  const cosBeta = Math.cos(toRadians(beta));
  const cosGamma = Math.cos(toRadians(gamma));
  return [
    [a * a, a * b * cosGamma, a * c * cosBeta],
    [a * b * cosGamma, b * b, b * c * cosAlpha],
    [a * c * cosBeta, b * c * cosAlpha, c * c],
  ];
}

/**
 * The cell volume in Å³, from the closed form; it equals `sqrt(det G)`.
 *
 * @throws When the three angles describe no cell that exists. A CIF can carry
 *   such a triple, and without this the volume is `NaN` and every coordinate
 *   downstream of it silently becomes one too.
 */
export function cellVolume(cell: UnitCell): number {
  const cosAlpha = Math.cos(toRadians(cell.alpha));
  const cosBeta = Math.cos(toRadians(cell.beta));
  const cosGamma = Math.cos(toRadians(cell.gamma));
  const factor =
    1 -
    cosAlpha * cosAlpha -
    cosBeta * cosBeta -
    cosGamma * cosGamma +
    2 * cosAlpha * cosBeta * cosGamma;
  if (factor <= 0) {
    throw new RangeError(
      `no cell has the angles ${cell.alpha}, ${cell.beta}, ${cell.gamma} degrees`,
    );
  }
  return cell.a * cell.b * cell.c * Math.sqrt(factor);
}

/** M, whose columns are the Cartesian components of a, b and c. `G = Mᵀ M`. */
export function cartesianMatrix(cell: UnitCell): number[][] {
  const { a, b, c, alpha, beta, gamma } = cell;
  const cosAlpha = Math.cos(toRadians(alpha));
  const cosBeta = Math.cos(toRadians(beta));
  const cosGamma = Math.cos(toRadians(gamma));
  const sinGamma = Math.sin(toRadians(gamma));
  return [
    [a, b * cosGamma, c * cosBeta],
    [0, b * sinGamma, (c * (cosAlpha - cosBeta * cosGamma)) / sinGamma],
    [0, 0, cellVolume(cell) / (a * b * sinGamma)],
  ];
}

/** The Cartesian coordinates, in Å, of a fractional point. */
export function fractionalToCartesian(
  lattice: Lattice,
  point: readonly number[],
): number[] {
  return applyMatrix(lattice.cartesian, point);
}

/** The fractional coordinates of a Cartesian point given in Å. */
export function cartesianToFractional(
  lattice: Lattice,
  point: readonly number[],
): number[] {
  return applyMatrix(lattice.fractional, point);
}

/** The interplanar spacing d(hkl) in Å. */
export function dSpacing(
  lattice: Lattice,
  h: number,
  k: number,
  l: number,
): number {
  return 1 / Math.sqrt(quadraticForm(lattice.reciprocalMetric, [h, k, l]));
}

/**
 * The reciprocal cell parameters, in Å⁻¹ and degrees. The metric tensor built
 * from them by {@link metricTensor} equals `G⁻¹`.
 */
export function reciprocalCell(cell: UnitCell): UnitCell {
  const volume = cellVolume(cell);
  const alpha = toRadians(cell.alpha);
  const beta = toRadians(cell.beta);
  const gamma = toRadians(cell.gamma);
  const angle = (first: number, second: number, third: number) =>
    toDegrees(
      Math.acos(
        (Math.cos(second) * Math.cos(third) - Math.cos(first)) /
          (Math.sin(second) * Math.sin(third)),
      ),
    );
  return {
    a: (cell.b * cell.c * Math.sin(alpha)) / volume,
    b: (cell.c * cell.a * Math.sin(beta)) / volume,
    c: (cell.a * cell.b * Math.sin(gamma)) / volume,
    alpha: angle(alpha, beta, gamma),
    beta: angle(beta, gamma, alpha),
    gamma: angle(gamma, alpha, beta),
  };
}

/** `vᵀ M v`, the squared length of a fractional vector under a metric tensor. */
export function quadraticForm(
  metric: number[][],
  vector: readonly number[],
): number {
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    const row = metric[i];
    for (let j = 0; j < vector.length; j++) {
      sum += (vector[i] ?? 0) * (row?.[j] ?? 0) * (vector[j] ?? 0);
    }
  }
  return sum;
}

function applyMatrix(matrix: number[][], point: readonly number[]): number[] {
  const image = new Array<number>(matrix.length).fill(0);
  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i];
    let sum = 0;
    for (let j = 0; j < matrix.length; j++) {
      sum += (row?.[j] ?? 0) * (point[j] ?? 0);
    }
    image[i] = sum;
  }
  return image;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
