/**
 * The printable reference: eleven blocks of the sheet a student takes into an
 * exam room.
 *
 * The content is `src/data/reference/`, which composes its numbers from the
 * catalogues the tool itself runs on, so the printed sheet cannot contradict
 * the tool. This page only paints it and keeps the chrome off the paper.
 */

import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { PagePart, ReferenceGrid } from 'react-cheminfo/ui';

import {
  CheatsheetHeader,
  colouredSections,
  printedLegend,
} from '../components/cheatsheet/index.ts';
import {
  REFERENCE_ROW_COUNT,
  REFERENCE_SECTIONS,
} from '../data/reference/index.ts';

import '../components/cheatsheet/cheatsheet.css';

/** How narrow a column may get before it wraps to the next line, in pixels. */
const MIN_COLUMN = 300;

/** How wide the left column of every block is, so the blocks line up. */
const SYNTAX_WIDTH = 124;

/**
 * The cheatsheet.
 * @returns The sheet, with its heading and legend dropped from the printed page.
 */
export function Cheatsheet(): ReactElement {
  const sections = useMemo(() => colouredSections(REFERENCE_SECTIONS), []);
  return (
    <section>
      <PagePart part="intro">
        <CheatsheetHeader
          blocks={REFERENCE_SECTIONS.length}
          lines={REFERENCE_ROW_COUNT}
        />
      </PagePart>
      <p className="sheet-print-line">
        SymmeTry · symmetry.cheminfo.org — {printedLegend()}
      </p>
      <ReferenceGrid
        sections={sections}
        minColumnWidth={MIN_COLUMN}
        syntaxWidth={SYNTAX_WIDTH}
      />
    </section>
  );
}
