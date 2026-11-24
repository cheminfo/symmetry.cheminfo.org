/**
 * What the point of the transform under the pointer stands for: a wave of
 * spacing d = 256 / |g| pixels, running at right angles to g — and, on a
 * crystal, the reciprocal lattice point (h k) when it sits on one.
 */

import type { ReactElement } from 'react';
import { formatDecimal } from 'react-cheminfo/core';

import type { MaskKind, Spot } from '../../reciprocal/filter.ts';
import { FIELD_SIZE } from '../../reciprocal/fourier.ts';
import type { LatticeVectors } from '../../reciprocal/lattice.ts';
import { millerIndices } from '../../reciprocal/lattice.ts';

/** How far from a whole number an index may be and still name a spot. */
const INDEX_TOLERANCE = 0.15;

/** What the readout says before the pointer is over the transform. */
const HINTS: Record<MaskKind, string> = {
  all: 'Point at a spot to read its spacing. Click it to rebuild the image from it alone.',
  spots: 'Click a spot to keep it or drop it; its mate at −g follows it.',
  low: 'Press where the edge of the disk should be, or drag it.',
  high: 'Press where the edge of the disk should be, or drag it.',
};

/** What {@link SpotReadout} needs. */
export interface SpotReadoutProps {
  /** The point under the pointer, or `null`. */
  readonly spot: Spot | null;
  /** The lattice on screen, or `null` for a drawing or a picture. */
  readonly vectors: LatticeVectors | null;
  /** The mask in force, which decides the hint. */
  readonly kind: MaskKind;
}

/**
 * The readout line under the transform.
 * @param props - See {@link SpotReadoutProps}.
 * @returns One line.
 */
export function SpotReadout(props: SpotReadoutProps): ReactElement {
  const { spot, vectors, kind } = props;
  if (spot === null) {
    return <p className="reciprocal-pane__caption">{HINTS[kind]}</p>;
  }
  const length = Math.hypot(spot.u, spot.v);
  if (length === 0) {
    return (
      <p className="reciprocal-pane__caption" data-testid="spot-readout">
        The centre, g = 0: the mean brightness of the image.
      </p>
    );
  }
  const spacing = FIELD_SIZE / length;
  // `|| 0` turns the −0 a rounding towards zero leaves into a plain 0.
  const angle = Math.round((Math.atan2(-spot.v, spot.u) * 180) / Math.PI) || 0;
  const indices = vectors === null ? null : wholeIndices(vectors, spot);
  return (
    <p className="reciprocal-pane__caption" data-testid="spot-readout">
      g = ({spot.u}, {-spot.v}) px · waves {formatDecimal(spacing, 1)} px apart,
      at {angle}°
      {indices === null ? null : (
        <>
          {' '}
          · <b>({indices})</b>
        </>
      )}
    </p>
  );
}

function wholeIndices(vectors: LatticeVectors, spot: Spot): string | null {
  const { h, k } = millerIndices(vectors, spot.u, spot.v);
  const roundH = Math.round(h);
  const roundK = Math.round(k);
  if (
    Math.abs(h - roundH) > INDEX_TOLERANCE ||
    Math.abs(k - roundK) > INDEX_TOLERANCE
  ) {
    return null;
  }
  return `${index(roundH)} ${index(roundK)}`;
}

/** A Miller index, a negative one written with a bar as crystallographers do. */
function index(value: number): string {
  return value < 0 ? `${-value}̄` : String(value);
}
