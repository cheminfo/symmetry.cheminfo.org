import { Button } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import { LEVEL_LEGEND, levelColour } from './levels.ts';

/** What {@link CheatsheetHeader} says the sheet holds. */
export interface CheatsheetHeaderProps {
  /** How many blocks it has. */
  readonly blocks: number;
  /** How many lines, over all of them. */
  readonly lines: number;
}

/**
 * The chrome above the printable sheet: what is on it, what its colours mean,
 * and the button that prints it.
 *
 * All of it carries `no-print`. A student takes the sheet into an exam room,
 * and a heading, a legend and a button are three lines of paper they did not
 * ask for.
 * @param props - How big the sheet is.
 * @returns The header.
 */
export function CheatsheetHeader(props: CheatsheetHeaderProps): ReactElement {
  const { blocks, lines } = props;
  return (
    <header className="sheet-head no-print">
      <div>
        <h1>Cheatsheet</h1>
        <p className="sheet-lead">
          {blocks} blocks, {lines} lines: the operations, the flowchart, the
          character tables, the lattices, the Hermann-Mauguin symbols, the
          systematic absences and the plane groups. A dotted underline opens the
          longer story. Every count is read off the catalogues the tool runs on.
        </p>
      </div>
      <div className="sheet-actions">
        <LevelLegend />
        <Button
          icon="print"
          text="Print"
          onClick={() => {
            globalThis.print();
          }}
        />
      </div>
    </header>
  );
}

/** What the three heading colours mean, in the colours themselves. */
function LevelLegend(): ReactElement {
  return (
    <div className="sheet-legend">
      {LEVEL_LEGEND.map((entry) => (
        <span key={entry.level} className="sheet-legend__item">
          <span
            className="sheet-legend__swatch"
            style={{ background: levelColour(entry.level) }}
          />
          {entry.label}
        </span>
      ))}
    </div>
  );
}
