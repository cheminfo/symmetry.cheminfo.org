/** A point or a direction in Cartesian space, in ångström. */
export type Vec3 = readonly [number, number, number];

/** a + b. */
export function addVectors(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** a − b. */
export function subtractVectors(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** a · factor. */
export function scaleVector(a: Vec3, factor: number): Vec3 {
  return [a[0] * factor, a[1] * factor, a[2] * factor];
}

/** a · b. */
export function dotProduct(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** a × b. */
export function crossProduct(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** |a|. */
export function vectorNorm(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

/** |a − b|. */
export function vectorDistance(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.hypot(dx, dy, dz);
}

/**
 * a / |a|.
 *
 * @throws When `a` is shorter than `minimumNorm`, which has no direction.
 */
export function normalizeVector(a: Vec3, minimumNorm = 1e-9): Vec3 {
  const norm = vectorNorm(a);
  if (norm < minimumNorm) {
    throw new RangeError('a vector of zero length has no direction');
  }
  return [a[0] / norm, a[1] / norm, a[2] / norm];
}

/**
 * Whether two unit vectors describe the same **axis**, which is a direction
 * without a sense: `û` and `−û` are one axis.
 *
 * @param parallel - `|û · v̂|` above which they are the same. @default 1 - 1e-4
 */
export function sameAxis(a: Vec3, b: Vec3, parallel = 1 - 1e-4): boolean {
  return Math.abs(dotProduct(a, b)) >= parallel;
}

/** Whether every point lies on one straight line through the first two. */
export function collinear(points: readonly Vec3[], tolerance = 1e-6): boolean {
  if (points.length < 3) return true;
  const origin = points[0] as Vec3;
  let direction: Vec3 | null = null;
  for (let i = 1; i < points.length; i++) {
    const offset = subtractVectors(points[i] as Vec3, origin);
    if (vectorNorm(offset) < tolerance) continue;
    if (direction === null) {
      direction = normalizeVector(offset);
      continue;
    }
    if (vectorNorm(crossProduct(direction, offset)) > tolerance) return false;
  }
  return true;
}
