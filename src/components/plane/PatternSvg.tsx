import { useId, useMemo } from 'react';

import type {
  CrystalOperation,
  UnitCell2D,
} from '../../symmetry/core/index.ts';

import { coveringShifts, patternFrame } from './frame.ts';
import type { Motif } from './motifs.ts';
import { round } from './precision.ts';
import {
  basisTransform,
  cellBasis,
  patternCopies,
  patternLattice,
} from './transforms.ts';

import './plane.css';

/** What the tiling needs to be drawn. */
export interface PatternSvgProps {
  /** The coset list, from `wallpaperOperations` or `friezeOperations`. */
  readonly operations: ReadonlyArray<CrystalOperation<2>>;
  /** The cell the group allows, from `latticeCell(group.lattice, size)`. */
  readonly cell: UnitCell2D;
  /** The shape repeated, drawn in fractional cell coordinates. */
  readonly motif: Motif;
  /** Cells along each direction. @default 3 */
  readonly tiles?: number;
  /**
   * How large the motif is drawn, relative to the cell. A group of order twelve
   * has a fundamental domain a twelfth of the cell, so a motif sized for p1
   * overlaps its own copies there. @default 1
   */
  readonly motifScale?: number;
  /** Outline the cell at the origin. @default true */
  readonly showCell?: boolean;
  /** Outline the region the motif was drawn in. @default false */
  readonly showDomain?: boolean;
  /** What a screen reader says the picture is. */
  readonly title: string;
  readonly className?: string;
}

/**
 * A plane group tiling the page with one motif.
 *
 * The motif is written once into `<defs>` and every copy is a `<use>` carrying
 * the operation that made it, so a group of order twelve over thirty cells is
 * one drawing and 360 references rather than 360 drawings — small enough to
 * export, and small enough to print.
 *
 * Each copy carries `data-operation` and `data-shift`, so a page can say which
 * operation produced the copy under the pointer.
 */
export function PatternSvg(props: PatternSvgProps) {
  const {
    operations,
    cell,
    motif,
    tiles = 3,
    motifScale = 1,
    showCell = true,
    showDomain = false,
    title,
    className,
  } = props;
  const { a, b, gamma } = cell;
  const { domain, paths } = motif;
  const unique = useId().replaceAll(':', '');
  const motifId = `${unique}-motif`;
  const clipId = `${unique}-clip`;
  const drawing = useMemo(() => {
    const lattice = patternLattice({ a, b, gamma });
    return {
      basis: basisTransform(lattice),
      cellMatrix: cellBasis(lattice),
      frame: patternFrame(lattice, tiles, tiles),
      copies: patternCopies(
        operations,
        lattice,
        coveringShifts(lattice, tiles, tiles),
      ),
    };
  }, [a, b, gamma, operations, tiles]);
  const { basis, cellMatrix, copies, frame } = drawing;
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
        <g
          id={motifId}
          transform={motifScale === 1 ? basis : `${basis} scale(${motifScale})`}
        >
          {paths.map((path) => (
            <path
              key={path.d}
              d={path.d}
              fill={
                path.accent === true ? 'var(--pattern-accent)' : 'currentColor'
              }
            />
          ))}
        </g>
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
          {showCell ? (
            <polygon
              className="pattern-cell"
              points={pointsOf(frame.cellCorners)}
            />
          ) : null}
          {showDomain && domain !== undefined ? (
            <polygon
              className="pattern-domain"
              points={pointsOf(domainCorners(domain, cellMatrix))}
            />
          ) : null}
        </g>
      </g>
    </svg>
  );
}

/** `x,y x,y …` for a `<polygon points>`. */
function pointsOf(corners: ReadonlyArray<readonly [number, number]>): string {
  return corners.map(([x, y]) => `${x},${y}`).join(' ');
}

/** The motif's own region, carried through the cell matrix the `<defs>` group holds. */
function domainCorners(
  domain: ReadonlyArray<readonly [number, number]>,
  basis: readonly [number, number, number, number],
): Array<readonly [number, number]> {
  return domain.map(([u, v]) => [
    round(basis[0] * u + basis[1] * v),
    round(basis[2] * u + basis[3] * v),
  ]);
}
