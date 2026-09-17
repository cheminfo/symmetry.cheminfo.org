import { useMemo } from 'react';

import type { CrystalOperation } from '../../symmetry/core/index.ts';

import { stripDiagram } from './friezeDiagram.ts';

import '../plane/plane.css';

/** What the strip diagram needs to be drawn. */
export interface FriezeDiagramProps {
  /** The coset list, from `friezeOperations`. */
  readonly operations: ReadonlyArray<CrystalOperation<2>>;
  /** How many periods to draw. @default 3 */
  readonly periods?: number;
  /** What a screen reader says the picture is. */
  readonly title: string;
}

/**
 * The symmetry elements of a frieze group, along a band.
 *
 * The same glyph vocabulary as the wallpaper diagrams — a lens for a two-fold,
 * a heavy line for a mirror, a dashed one for a glide — and the same
 * stylesheet, so the two read as one family of pictures.
 * @param props - See {@link FriezeDiagramProps}.
 * @returns The diagram.
 */
export function FriezeDiagram(props: FriezeDiagramProps) {
  const { operations, periods = 3, title } = props;
  const diagram = useMemo(
    () => stripDiagram(operations, periods),
    [operations, periods],
  );
  return (
    <svg
      className="plane-svg catalogue-strip"
      viewBox={diagram.viewBox}
      role="img"
      aria-label={title}
    >
      <g transform="scale(1 -1)">
        {diagram.boundaries.map((x) => (
          <line
            key={`period-${x}`}
            className="element-cell--primary"
            x1={x}
            y1={-diagram.top}
            x2={x}
            y2={diagram.top}
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
