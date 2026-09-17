import { useMemo } from 'react';

import type {
  CrystalOperation,
  UnitCell2D,
} from '../../symmetry/core/index.ts';

import { planeDiagramOf } from './diagram.ts';
import { patternLattice } from './transforms.ts';

import './plane.css';

/** What the element diagram needs to be drawn. */
export interface ElementDiagramProps {
  /** The coset list, from `wallpaperOperations` or `friezeOperations`. */
  readonly operations: ReadonlyArray<CrystalOperation<2>>;
  /** The cell the group allows, from `latticeCell(group.lattice, size)`. */
  readonly cell: UnitCell2D;
  /** Cells along each direction. @default 2 */
  readonly cells?: number;
  /** What a screen reader says the picture is. */
  readonly title: string;
  readonly className?: string;
}

/** Space left around the block, as a fraction of the cell edge, so a glyph on the border is whole. */
const PADDING = 0.08;

/**
 * The symmetry-element diagram of a plane group, the way the International
 * Tables draw it: a lens for a 2-fold, a triangle for a 3-fold, a square for a
 * 4-fold, a hexagon for a 6-fold, a heavy line for a mirror and a dashed one for
 * a glide.
 *
 * Nothing is transcribed. Every glyph comes out of the element decomposition of
 * the group's own operations, so the hexagonal groups — the ones nobody checks —
 * are as right as p2.
 *
 * The cell at the origin is outlined and the rest are faint, and the lines run
 * past the cell edge on purpose: a diagram whose mirrors stop at the edge
 * teaches that they stop there.
 */
export function ElementDiagram(props: ElementDiagramProps) {
  const { operations, cell, cells = 2, title, className } = props;
  const { a, b, gamma } = cell;
  const diagram = useMemo(
    () =>
      planeDiagramOf(
        operations,
        patternLattice({ a, b, gamma }),
        cells,
        PADDING * a,
      ),
    [a, b, gamma, cells, operations],
  );
  return (
    <svg
      className={
        className === undefined ? 'plane-svg' : `plane-svg ${className}`
      }
      viewBox={diagram.frame.viewBox}
      role="img"
      aria-label={title}
    >
      <g transform="scale(1 -1)">
        {diagram.cells.map((outline) => (
          <polygon
            key={outline.key}
            className={
              outline.primary
                ? 'element-cell element-cell--primary'
                : 'element-cell'
            }
            points={outline.points}
          />
        ))}
        {diagram.lines.map((line) => (
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
        {diagram.glyphs.map((glyph) => (
          <path
            key={glyph.key}
            className="element-glyph"
            d={glyph.path}
            data-order={glyph.order}
          />
        ))}
      </g>
    </svg>
  );
}
