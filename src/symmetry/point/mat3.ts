import type { Vec3 } from './vec3.ts';

/** A 3×3 Cartesian matrix, as its three rows. */
export type Mat3 = readonly [Vec3, Vec3, Vec3];

/** The identity. */
export const IDENTITY_MATRIX: Mat3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/** The inversion, −I. */
export const INVERSION_MATRIX: Mat3 = [
  [-1, 0, 0],
  [0, -1, 0],
  [0, 0, -1],
];

/** a · b, so that `applyMatrix(multiplyMatrices(a, b), v)` is a applied after b. */
export function multiplyMatrices(a: Mat3, b: Mat3): Mat3 {
  return [multiplyRow(a[0], b), multiplyRow(a[1], b), multiplyRow(a[2], b)];
}

/** M · v. */
export function applyMatrix(matrix: Mat3, vector: Vec3): Vec3 {
  return [
    matrix[0][0] * vector[0] +
      matrix[0][1] * vector[1] +
      matrix[0][2] * vector[2],
    matrix[1][0] * vector[0] +
      matrix[1][1] * vector[1] +
      matrix[1][2] * vector[2],
    matrix[2][0] * vector[0] +
      matrix[2][1] * vector[1] +
      matrix[2][2] * vector[2],
  ];
}

/** Mᵀ, which is M⁻¹ for the orthogonal matrix of any symmetry operation. */
export function transposeMatrix(matrix: Mat3): Mat3 {
  return [
    [matrix[0][0], matrix[1][0], matrix[2][0]],
    [matrix[0][1], matrix[1][1], matrix[2][1]],
    [matrix[0][2], matrix[1][2], matrix[2][2]],
  ];
}

/** det M: +1 for a proper operation, −1 for an improper one. */
export function matrixDeterminant(matrix: Mat3): number {
  return (
    matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
    matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
    matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
  );
}

/** tr M, which is `±1 + 2cos θ` for a symmetry operation. */
export function matrixTrace(matrix: Mat3): number {
  return matrix[0][0] + matrix[1][1] + matrix[2][2];
}

/** M · factor. */
export function scaleMatrix(matrix: Mat3, factor: number): Mat3 {
  return [
    [matrix[0][0] * factor, matrix[0][1] * factor, matrix[0][2] * factor],
    [matrix[1][0] * factor, matrix[1][1] * factor, matrix[1][2] * factor],
    [matrix[2][0] * factor, matrix[2][1] * factor, matrix[2][2] * factor],
  ];
}

/** ‖a − b‖_F, the distance two operation matrices are compared with. */
export function matrixDistance(a: Mat3, b: Mat3): number {
  let sum = 0;
  for (let i = 0; i < 3; i++) {
    const rowA = a[i] as Vec3;
    const rowB = b[i] as Vec3;
    for (let j = 0; j < 3; j++) {
      const difference = (rowA[j] as number) - (rowB[j] as number);
      sum += difference * difference;
    }
  }
  return Math.sqrt(sum);
}

/**
 * The rotation by `angle` radians about the unit vector `axis`, right-handed,
 * from Rodrigues' formula `R = cos θ I + sin θ [n̂]ₓ + (1 − cos θ) n̂ n̂ᵀ`.
 */
export function rotationMatrix(axis: Vec3, angle: number): Mat3 {
  const [x, y, z] = axis;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = 1 - c;
  return [
    [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
    [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
    [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
  ];
}

/** The reflection `I − 2 n̂ n̂ᵀ` in the plane through the origin with unit normal `normal`. */
export function reflectionMatrix(normal: Vec3): Mat3 {
  const [x, y, z] = normal;
  return [
    [1 - 2 * x * x, -2 * x * y, -2 * x * z],
    [-2 * x * y, 1 - 2 * y * y, -2 * y * z],
    [-2 * x * z, -2 * y * z, 1 - 2 * z * z],
  ];
}

/** One row of a · b. */
function multiplyRow(row: Vec3, b: Mat3): Vec3 {
  return [
    row[0] * b[0][0] + row[1] * b[1][0] + row[2] * b[2][0],
    row[0] * b[0][1] + row[1] * b[1][1] + row[2] * b[2][1],
    row[0] * b[0][2] + row[1] * b[1][2] + row[2] * b[2][2],
  ];
}
