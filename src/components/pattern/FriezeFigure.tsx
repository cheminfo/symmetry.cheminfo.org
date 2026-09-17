import { useId, useMemo } from 'react';

import type {
  CrystalOperation,
  UnitCell2D,
} from '../../symmetry/core/index.ts';
import type { PlaneElementTable } from '../../symmetry/planeElements.ts';
import type { Motif } from '../plane/index.ts';
import {
  basisTransform,
  patternCopies,
  patternLattice,
} from '../plane/index.ts';

import { friezeGlyphs, friezeLines } from './friezeElements.ts';
import { friezeFrame, friezeShifts, motifDomainPoints } from './friezeFrame.ts';

import '../plane/plane.css';

/** What a frieze figure needs to be drawn. */
export interface FriezeFigureProps {
  /** The coset list, from `friezeOperations`. */
  readonly operations: ReadonlyArray<CrystalOperation<2>>;
  /** The period cell, from `planeGroupCell(choice, size)`. */
  readonly cell: UnitCell2D;
  /** Periods along the strip. @default 4 */
  readonly periods?: number;
  /** The shape repeated. Leave it out to draw the elements alone. */
  readonly motif?: Motif;
  /** How large the motif is drawn, relative to the cell. @default 1 */
  readonly motifScale?: number;
  /** The elements to draw over the strip, from `planeElementTable`. */
  readonly elements?: PlaneElementTable;
  /** Outline each period. @default true */
  readonly showCell?: boolean;
  /** Outline the region the motif was drawn in. @default false */
  readonly showDomain?: boolean;
  /** What a screen reader says the picture is. */
  readonly title: string;
  readonly className?: string;
}

/** Space left around the strip, as a fraction of the period. */
const PADDING = 0.06;

/**
 * A frieze group repeating along its strip.
 *
 * The strip is `periods` periods wide and one cell either side of the axis,
 * because a frieze reflects across that axis and translates nowhere else. The
 * same frame draws the motif and the elements, so the two pictures of one group
 * line up column for column.
 * @param props - The group, the cell, and what to draw on it.
 * @returns The strip.
 */
export function FriezeFigure(props: FriezeFigureProps) {
  const {
    operations,
    cell,
    periods = 4,
    motif,
    motifScale = 1,
    elements,
    showCell = true,
    showDomain = false,
    title,
    className,
  } = props;
  const { a, b, gamma } = cell;
  const unique = useId().replaceAll(':', '');
  const motifId = `${unique}-motif`;
  const clipId = `${unique}-clip`;
  const drawing = useMemo(() => {
    const lattice = patternLattice({ a, b, gamma });
    return {
      basis: basisTransform(lattice),
      frame: friezeFrame(lattice, periods, PADDING * a),
      copies:
        motif === undefined
          ? []
          : patternCopies(operations, lattice, friezeShifts(periods)),
      lines:
        elements === undefined ? [] : friezeLines(elements, lattice, periods),
      glyphs:
        elements === undefined ? [] : friezeGlyphs(elements, lattice, periods),
      domain:
        motif?.domain === undefined
          ? null
          : motifDomainPoints(motif.domain, lattice),
    };
  }, [a, b, gamma, elements, motif, operations, periods]);
  const { basis, copies, domain, frame, glyphs, lines } = drawing;
  return (
    <svg
      className={
        className === undefined ? 'plane-svg' : `plane-svg ${className}`
      }
      viewBox={frame.viewBox}
      role="img"
      aria-label={title}
    >
      <defs>
        {motif === undefined ? null : (
          <g
            id={motifId}
            transform={
              motifScale === 1 ? basis : `${basis} scale(${motifScale})`
            }
          >
            {motif.paths.map((path) => (
              <path
                key={path.d}
                d={path.d}
                fill={
                  path.accent === true
                    ? 'var(--pattern-accent)'
                    : 'currentColor'
                }
              />
            ))}
          </g>
        )}
        <clipPath id={clipId}>
          <rect
            x={frame.x}
            y={frame.y}
            width={frame.width}
            height={frame.height}
          />
        </clipPath>
      </defs>
      {/* The clip sits outside the flip so its rectangle is the viewBox itself. */}
      <g clipPath={`url(#${clipId})`}>
        <g transform="scale(1 -1)">
          {copies.map((copy) => (
            <use
              key={copy.key}
              href={`#${motifId}`}
              transform={copy.transform}
              className={
                copy.mirrored
                  ? 'pattern-copy pattern-copy--mirrored'
                  : 'pattern-copy'
              }
              data-operation={copy.operation}
              data-shift={`${copy.shift[0]},${copy.shift[1]}`}
            />
          ))}
          {showCell
            ? frame.periods.map((period) => (
                <polygon
                  key={period.key}
                  className={
                    period.primary
                      ? 'element-cell element-cell--primary'
                      : 'element-cell'
                  }
                  points={period.points}
                />
              ))
            : null}
          {showDomain && domain !== null ? (
            <polygon className="pattern-domain" points={domain} />
          ) : null}
          {lines.map((line) => (
            <line
              key={line.key}
              className={
                line.kind === 'glide'
                  ? 'element-line element-line--glide'
                  : 'element-line'
              }
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
            />
          ))}
          {glyphs.map((glyph) => (
            <path
              key={glyph.key}
              className="element-glyph"
              d={glyph.path}
              data-order={glyph.order}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
