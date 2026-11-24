/**
 * What is drawn over a field: the lattice vectors and their reciprocal ones,
 * the region transformed, and the part of the transform kept.
 *
 * Everything is in the field's pixel coordinates, where the centre of the
 * field is at {@link FIELD_MIDDLE}.
 */

import type { ReactElement } from 'react';

import type { Mask } from '../../reciprocal/filter.ts';
import { SPOT_RADIUS } from '../../reciprocal/filter.ts';
import { FIELD_CENTRE, FIELD_SIZE } from '../../reciprocal/fourier.ts';
import type { Point } from '../../reciprocal/raster.ts';
import type { Region } from '../../reciprocal/region.ts';

/** The centre of the field in overlay coordinates: the middle of its pixel. */
const FIELD_MIDDLE = FIELD_CENTRE + 0.5;

/** What {@link VectorArrow} needs. */
export interface VectorArrowProps {
  /** Where it ends, in pixels from the centre of the field. */
  readonly to: Point;
  /** Its name, written past its head. */
  readonly label: string;
  /** Which of the two lattice vectors it is, for its colour. */
  readonly which: 'a' | 'b';
  /**
   * How much the field is enlarged, so the head and the label keep their size
   * on screen.
   * @default 1
   */
  readonly zoom?: number;
}

/**
 * An arrow from the centre of the field.
 * @param props - See {@link VectorArrowProps}.
 * @returns The arrow and its label.
 */
export function VectorArrow(props: VectorArrowProps): ReactElement {
  const { to, label, which, zoom = 1 } = props;
  const length = Math.hypot(to.x, to.y);
  if (length < 1) return <g />;
  const ux = to.x / length;
  const uy = to.y / length;
  const tip = { x: FIELD_MIDDLE + to.x, y: FIELD_MIDDLE + to.y };
  const head = Math.min(5 / zoom, length / 2);
  const left = {
    x: tip.x - head * ux - head * 0.5 * uy,
    y: tip.y - head * uy + head * 0.5 * ux,
  };
  const right = {
    x: tip.x - head * ux + head * 0.5 * uy,
    y: tip.y - head * uy - head * 0.5 * ux,
  };
  const gap = 7 / zoom;
  const text = { x: tip.x + gap * ux, y: tip.y + gap * uy + 3 / zoom };
  return (
    <g className={`field-vector field-vector--${which}`}>
      <line x1={FIELD_MIDDLE} y1={FIELD_MIDDLE} x2={tip.x} y2={tip.y} />
      <polygon
        points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
      />
      <text x={text.x} y={text.y} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

/**
 * The region transformed: the rest of the field shaded, the edge dashed.
 * @param props - The region.
 * @param props.region - Which part of the field.
 * @param props.live - Whether it is still being dragged out.
 * @returns The shade and the edge.
 */
export function RegionShade(props: {
  readonly region: Region;
  readonly live?: boolean;
}): ReactElement {
  const { x, y, width, height } = props.region;
  const outside = `M0 0H${FIELD_SIZE}V${FIELD_SIZE}H0Z M${x} ${y}V${y + height}H${x + width}V${y}Z`;
  return (
    <g
      className={
        props.live ? 'field-region field-region--live' : 'field-region'
      }
    >
      <path className="field-region__shade" d={outside} fillRule="evenodd" />
      <rect
        className="field-region__edge"
        x={x}
        y={y}
        width={width}
        height={height}
      />
    </g>
  );
}

/**
 * The outline of what is kept of the transform.
 * @param props - The mask.
 * @param props.mask - What is kept.
 * @returns A circle for a disk, a ring around each spot and its mate.
 */
export function MaskOutline(props: { readonly mask: Mask }): ReactElement {
  const { mask } = props;
  if (mask.kind === 'all') return <g />;
  if (mask.kind === 'low' || mask.kind === 'high') {
    return (
      <circle
        className={`field-mask field-mask--${mask.kind}`}
        cx={FIELD_MIDDLE}
        cy={FIELD_MIDDLE}
        r={mask.radius}
      />
    );
  }
  return (
    <g className="field-mask field-mask--spots">
      {mask.spots.map((spot) => (
        <g key={`${spot.u},${spot.v}`}>
          <circle
            cx={FIELD_MIDDLE + spot.u}
            cy={FIELD_MIDDLE + spot.v}
            r={SPOT_RADIUS + 1.5}
          />
          {spot.u === 0 && spot.v === 0 ? null : (
            <circle
              className="field-mask__mate"
              cx={FIELD_MIDDLE - spot.u}
              cy={FIELD_MIDDLE - spot.v}
              r={SPOT_RADIUS + 1.5}
            />
          )}
        </g>
      ))}
    </g>
  );
}
