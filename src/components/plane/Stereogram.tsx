import { useId, useMemo } from 'react';

import type { PointOperation } from '../../symmetry/operations.ts';

import { commaPath } from './glyphs.ts';
import { stereogramOf } from './stereogram.ts';
import type { StereogramMirror } from './stereographic.ts';

import './plane.css';

/** What the stereogram needs to be drawn. */
export interface StereogramProps {
  /**
   * The group's operations, from `operationsOf(id)`. `C∞v` and `D∞h` have no
   * operation list, so a catalogue page must not ask for one.
   */
  readonly operations: readonly PointOperation[];
  /** Radius of the primitive circle, in the picture's own units. @default 100 */
  readonly radius?: number;
  /** What a screen reader says the picture is. */
  readonly title: string;
  readonly className?: string;
}

/** Radius of one mark, as a fraction of the primitive circle. */
const POINT_RADIUS = 0.045;

/**
 * What the axis glyphs are sized against, as a multiple of the radius.
 *
 * The glyph sizes are fractions of a *cell edge* on a plane-group diagram; a
 * stereogram has no cell, and at the bare radius the lens at the centre
 * disappears under the two mirror diameters crossing there.
 */
const GLYPH_SCALE = 1.5;

/**
 * The stereographic projection of a molecular point group.
 *
 * A filled circle is a direction in the upper hemisphere and an open one a
 * direction below; where the group has a horizontal mirror or an inversion
 * centre the two sit concentric, and a comma inside a circle marks a point of
 * the opposite hand. Over them go the axis glyphs — filled for a proper axis,
 * open for an improper one — and the mirror traces, which are circles because
 * the stereographic image of a great circle is one.
 */
export function Stereogram(props: StereogramProps) {
  const { operations, radius = 100, title, className } = props;
  const discId = `${useId().replaceAll(':', '')}-disc`;
  const diagram = useMemo(
    () =>
      stereogramOf(operations, { radius, glyphScale: radius * GLYPH_SCALE }),
    [operations, radius],
  );
  const mark = radius * POINT_RADIUS;
  const extent = radius * 1.08;
  const horizontal = diagram.mirrors.some(
    (mirror) => mirror.kind === 'horizontal',
  );
  return (
    <svg
      className={
        className === undefined ? 'plane-svg' : `plane-svg ${className}`
      }
      viewBox={`${-extent} ${-extent} ${2 * extent} ${2 * extent}`}
      role="img"
      aria-label={title}
    >
      <defs>
        <clipPath id={discId}>
          <circle cx={0} cy={0} r={radius} />
        </clipPath>
      </defs>
      <g transform="scale(1 -1)">
        <circle
          className={
            horizontal
              ? 'stereo-primitive stereo-primitive--mirror'
              : 'stereo-primitive'
          }
          cx={0}
          cy={0}
          r={radius}
        />
        {diagram.mirrors.map((mirror) => (
          <MirrorTrace key={mirror.key} mirror={mirror} discId={discId} />
        ))}
        {diagram.points.map((point) => (
          <g key={point.key}>
            <circle
              className={
                point.upper
                  ? 'stereo-point'
                  : 'stereo-point stereo-point--lower'
              }
              cx={point.x}
              cy={point.y}
              r={mark}
            />
            {point.mirrored ? (
              <path
                className={
                  point.upper
                    ? 'stereo-comma'
                    : 'stereo-comma stereo-comma--lower'
                }
                d={commaPath(point.x, point.y, mark * 0.62)}
              />
            ) : null}
          </g>
        ))}
        {diagram.axes.map((axis) => (
          <path
            key={axis.key}
            className={
              axis.improper
                ? 'stereo-axis stereo-axis--improper'
                : 'stereo-axis'
            }
            d={axis.path}
            data-order={axis.order}
          />
        ))}
        {diagram.inversion ? (
          <circle className="stereo-inversion" cx={0} cy={0} r={mark * 0.6} />
        ) : null}
      </g>
    </svg>
  );
}

/** One mirror plane: the primitive circle, a diameter, or an arc clipped to the disc. */
function MirrorTrace({
  mirror,
  discId,
}: {
  readonly mirror: StereogramMirror;
  readonly discId: string;
}) {
  if (mirror.kind === 'horizontal') return null;
  if (mirror.kind === 'diameter') {
    return (
      <line
        className="stereo-mirror"
        x1={mirror.x1}
        y1={mirror.y1}
        x2={mirror.x2}
        y2={mirror.y2}
      />
    );
  }
  return (
    <circle
      className="stereo-mirror"
      cx={mirror.cx}
      cy={mirror.cy}
      r={mirror.r}
      clipPath={`url(#${discId})`}
    />
  );
}
