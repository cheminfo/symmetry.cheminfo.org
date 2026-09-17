/**
 * What the workbench's own pieces put on the page.
 *
 * `renderToStaticMarkup` rather than a DOM: these are drawings and chip bars,
 * and what matters is the markup they emit. The page itself is not rendered
 * here — `react-cheminfo`'s `PagePart` resolves the second React copy that its
 * linked checkout carries, which only `resolve.dedupe` in `vitest.config.ts`
 * would fix — so the assembled page is Playwright's to cover.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import { planeElementTable } from '../../../symmetry/planeElements.ts';
import { motifById } from '../../plane/index.ts';
import { FriezeFigure } from '../FriezeFigure.tsx';
import { MotifEditor } from '../MotifEditor.tsx';
import { PlaneControls } from '../PlaneControls.tsx';
import { PlaneGroupPicker } from '../PlaneGroupPicker.tsx';
import { friezeElementShifts } from '../friezeFrame.ts';
import {
  planeGroupCell,
  planeGroupOperations,
  resolvePlaneGroup,
} from '../planeGroupRef.ts';

/** How many times a fragment occurs in the markup. */
function count(markup: string, fragment: string): number {
  return markup.split(fragment).length - 1;
}

/** One frieze group, ready to draw. */
function frieze(id: string) {
  const choice = resolvePlaneGroup(id);
  return {
    operations: planeGroupOperations(choice),
    cell: planeGroupCell(choice, 100),
  };
}

test('the picker offers the seventeen and the seven, never both at once', () => {
  const markup = renderToStaticMarkup(
    <PlaneGroupPicker choice={resolvePlaneGroup('p4g')} />,
  );
  expect(count(markup, '<button type="button" class="chip"')).toBe(17);
  expect(markup).toContain('aria-pressed="true"');
  expect(markup).toContain('Wallpaper · 17');
  expect(markup).toContain('orbifold 4*2');
  expect(markup).not.toContain('sidle');

  const strip = renderToStaticMarkup(
    <PlaneGroupPicker choice={resolvePlaneGroup('f:p2mg')} />,
  );
  expect(count(strip, '<button type="button" class="chip"')).toBe(7);
  expect(strip).toContain('spinning sidle');
});

test('the layer chips name the cell after what the group repeats', () => {
  const tiled = renderToStaticMarkup(
    <PlaneControls wallpaper showCell showDomain={false} tiles={3} />,
  );
  expect(tiled).toContain('Unit cell');
  expect(tiled).toContain('>Cells<');
  expect(tiled).toContain('<span class="plane-count">3</span>');

  const strip = renderToStaticMarkup(
    <PlaneControls wallpaper={false} showCell={false} showDomain tiles={1} />,
  );
  expect(strip).toContain('>Period<');
  expect(strip).toContain('>Periods<');
  // One is the fewest the page can draw, so the minus end is off.
  expect(count(strip, 'class="chip chip--action" disabled')).toBe(1);
});

test('the pad appears only once a drawing has been started', () => {
  const shipped = renderToStaticMarkup(<MotifEditor motifId="flag" />);
  expect(shipped).not.toContain('motif-pad');
  expect(shipped).toContain('Flag');

  const empty = renderToStaticMarkup(<MotifEditor motifId="d:" />);
  expect(empty).toContain('motif-pad');
  expect(empty).toContain('3 corners make a shape');
  expect(count(empty, '<circle')).toBe(0);

  const drawn = renderToStaticMarkup(<MotifEditor motifId="d:102060253070" />);
  expect(count(drawn, '<circle')).toBe(3);
  expect(drawn).toContain('<polygon class="motif-pad__shape"');
  expect(drawn).toContain('lopsided');
});

test('a frieze is drawn on a strip, one copy per operation per period', () => {
  const { operations, cell } = frieze('f:p2mm');
  const markup = renderToStaticMarkup(
    <FriezeFigure
      operations={operations}
      cell={cell}
      periods={3}
      motif={motifById('flag')}
      title="p2mm, repeated along its strip"
    />,
  );
  // Four operations over three periods, and the motif written once.
  expect(count(markup, '<use')).toBe(12);
  expect(count(markup, '<defs')).toBe(1);
  expect(markup).toContain('viewBox="-6 -106 312 212"');
  expect(markup).toContain('aria-label="p2mm, repeated along its strip"');
  expect(markup).toContain('class="pattern-copy pattern-copy--mirrored"');
  expect(count(markup, '<polygon')).toBe(3);
});

test('the same strip draws the elements when it is given no motif', () => {
  const { operations, cell } = frieze('f:p2mm');
  const markup = renderToStaticMarkup(
    <FriezeFigure
      operations={operations}
      cell={cell}
      periods={2}
      elements={planeElementTable(operations, friezeElementShifts(2))}
      title="p2mm, symmetry elements"
    />,
  );
  expect(count(markup, '<use')).toBe(0);
  // Five mirrors across the strip, and the mirror along its axis.
  expect(count(markup, '<line class="element-line"')).toBe(6);
  expect(count(markup, '<path class="element-glyph"')).toBe(5);
  expect(markup).not.toContain('element-line--glide');
});

test('p2mg draws the glide dashed and the mirrors heavy', () => {
  const { operations, cell } = frieze('f:p2mg');
  const markup = renderToStaticMarkup(
    <FriezeFigure
      operations={operations}
      cell={cell}
      periods={2}
      elements={planeElementTable(operations, friezeElementShifts(2))}
      title="p2mg, symmetry elements"
    />,
  );
  expect(count(markup, 'element-line--glide')).toBe(1);
  expect(count(markup, '<line class="element-line"')).toBe(5);
});
