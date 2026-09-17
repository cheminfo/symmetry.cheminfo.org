import { ElementDiagram } from '../plane/ElementDiagram.tsx';
import { Stereogram } from '../plane/Stereogram.tsx';

import { FriezeDiagram } from './FriezeDiagram.tsx';
import type { EntryFigure } from './types.ts';

/** What the picture at the top of an entry needs. */
export interface EntryFigureViewProps {
  readonly figure: EntryFigure;
  /** The symbol the picture is of, for the screen-reader label. */
  readonly symbol: string;
}

/** How many cells of a wallpaper group the diagram draws. */
const WALLPAPER_CELLS = 2;

/**
 * The picture an entry opens with: a stereogram for a point group, an element
 * diagram for a wallpaper group, a band for a frieze group.
 *
 * A space group has none here — three dimensions want the workbench, which the
 * page links to instead of drawing a flat approximation of it.
 * @param props - See {@link EntryFigureViewProps}.
 * @returns The figure, with its caption.
 */
export function EntryFigureView(props: EntryFigureViewProps) {
  const { figure, symbol } = props;
  return (
    <figure className="catalogue-figure">
      {figure.kind === 'stereogram' ? (
        <Stereogram
          operations={figure.operations}
          title={`Stereogram of ${symbol}`}
        />
      ) : null}
      {figure.kind === 'wallpaper' ? (
        <ElementDiagram
          operations={figure.operations}
          cell={figure.cell}
          cells={WALLPAPER_CELLS}
          title={`Symmetry elements of ${symbol}`}
        />
      ) : null}
      {figure.kind === 'frieze' ? (
        <FriezeDiagram
          operations={figure.operations}
          title={`Symmetry elements of ${symbol}`}
        />
      ) : null}
      <figcaption>{figure.caption}</figcaption>
    </figure>
  );
}
