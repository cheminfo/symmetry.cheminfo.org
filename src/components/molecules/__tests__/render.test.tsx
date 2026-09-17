import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import { moleculeById } from '../../../data/molecules.ts';
import { POINT_GROUPS } from '../../../data/pointGroups.ts';
import { setDisplayFlag } from '../../../state/index.ts';
import {
  characterTableOf,
  requireCharacterTable,
} from '../../../symmetry/characterTables.ts';
import { CharacterTable, NoCharacterTable } from '../CharacterTable.tsx';
import { GroupSummary } from '../GroupSummary.tsx';
import { LayerChips } from '../LayerChips.tsx';
import { OperationLabel } from '../OperationLabel.tsx';
import { OperationList } from '../OperationList.tsx';
import { SymbolText } from '../SymbolText.tsx';
import type { MoleculeAnalysis } from '../assignment.ts';
import { analyseMolecule } from '../assignment.ts';

/*
 * `FlowchartPanel` and `MoleculePicker` are in `panels.test.tsx` beside this
 * file: both reach a `react-cheminfo` hook, and this file is about what the
 * workbench draws around them.
 */

function read(id: string): MoleculeAnalysis {
  const entry = moleculeById(id);
  if (entry === undefined) throw new Error(`no molecule ${id}`);
  return analyseMolecule(entry);
}

/** A handler the markup needs but a static render never fires. */
function ignore(): void {
  // Nothing: nobody clicks a string.
}

/** How many times a string occurs in the markup. */
function count(markup: string, text: string): number {
  return markup.split(text).length - 1;
}

test('the table of C2v prints four irreps over four classes', () => {
  const markup = renderToStaticMarkup(
    <CharacterTable table={requireCharacterTable('C2v')} schoenflies="C2v" />,
  );
  expect(count(markup, '</tr>')).toBe(5);
  // Four classes, plus the corner and the two function columns — and one row
  // heading per irrep, which is a `th` as well.
  expect(count(markup, '</th>')).toBe(11);
  expect(markup).toContain('C<sub>2v</sub></span> (h = 4)');
  expect(markup).toContain(
    '<span>σ<sub>v</sub><span class="mol-operation__where">(xz)</span></span>',
  );
  expect(markup).toContain('Linear, rotations');
  expect(markup).toContain('Quadratic');
  expect(markup).toContain('x², y², z²');
  expect(markup).toContain('−1');
  // The convention note is printed, because C2v's B1 depends on it.
  expect(markup).toContain('Water is drawn in the yz plane');
});

test('a group that ships no table says so instead of crashing', () => {
  for (const group of [
    'C7',
    'C8',
    'C7v',
    'C8v',
    'C5h',
    'D7',
    'D8',
    'D7h',
    'D8h',
    'D6d',
  ]) {
    const markup = renderToStaticMarkup(<NoCharacterTable group={group} />);
    expect(count(markup, '<table')).toBe(0);
    expect(markup).toContain('ships no character table');
    expect(markup).toContain(group);
  }
});

test('a linear group is told why there can be no table at all', () => {
  const markup = renderToStaticMarkup(
    <NoCharacterTable group="Dinfh" schoenflies="D∞h" />,
  );
  expect(count(markup, '<table')).toBe(0);
  expect(markup).toContain('infinitely many irreducible representations');
  expect(markup).toContain('D∞h');
});

test('a complex pair is printed as one row and the footnote explains it', () => {
  const markup = renderToStaticMarkup(
    <CharacterTable table={requireCharacterTable('S4')} schoenflies="S4" />,
  );
  expect(count(markup, '</tr>')).toBe(4);
  expect(markup).toContain('complex conjugates');
});

test('a class header is set as a symbol, count on the line, power above', () => {
  const markup = renderToStaticMarkup(
    <CharacterTable table={requireCharacterTable('D4d')} schoenflies="D4d" />,
  );
  // The count is not the order, so it never drops into the subscript.
  expect(markup).toContain(
    '<th scope="col"><span>2S<sub>8</sub><sup>3</sup></span></th>',
  );
  expect(markup).toContain('<th scope="col"><span>2C<sub>4</sub></span></th>');
  // A caret is how a file writes a power, never how a page prints one.
  expect(markup).not.toContain('^');
});

test('no character table of the site prints a caret', () => {
  for (const group of POINT_GROUPS) {
    const table = characterTableOf(group.id);
    if (table === undefined) continue;
    const markup = renderToStaticMarkup(
      <CharacterTable table={table} schoenflies={group.schoenflies} />,
    );
    expect(markup, group.id).not.toContain('^');
  }
});

test('every operation of the group is a button that plays it', () => {
  const analysis = read('water');
  const markup = renderToStaticMarkup(
    <OperationList classes={analysis.classes} playing="C2" onPlay={ignore} />,
  );
  expect(count(markup, '</button>')).toBe(4);
  expect(count(markup, 'class="mol-class"')).toBe(4);
  expect(count(markup, 'aria-pressed="true"')).toBe(1);
  expect(markup).toContain('Turns by 180° about z.');
});

test('a linear molecule is told there is no list, not shown an empty one', () => {
  const markup = renderToStaticMarkup(
    <OperationList classes={[]} playing={null} onPlay={ignore} />,
  );
  expect(count(markup, '</button>')).toBe(0);
  expect(markup).toContain('infinitely many operations');
});

test('the verdict names the group, its order and what follows from it', () => {
  const markup = renderToStaticMarkup(
    <GroupSummary analysis={read('water')} />,
  );
  expect(markup).toContain('4 operations');
  expect(markup).toContain('Achiral');
  expect(markup).toContain('Polar');
  expect(markup).toContain('Read at 0.1 Å');
  expect(markup).toContain('mm2');
  expect(markup).not.toContain('Has a centre');
});

test('a centrosymmetric group says it has a centre and no dipole', () => {
  const markup = renderToStaticMarkup(
    <GroupSummary analysis={read('benzene')} />,
  );
  expect(markup).toContain('24 operations');
  expect(markup).toContain('Has a centre');
  expect(markup).toContain('No dipole');
});

test('a symbol sets everything after its first letter below the line', () => {
  expect(renderToStaticMarkup(<SymbolText symbol="C2v" />)).toBe(
    '<span>C<sub>2v</sub></span>',
  );
  expect(renderToStaticMarkup(<SymbolText symbol="A1′" />)).toBe(
    '<span>A<sub>1</sub>′</span>',
  );
});

test('an operation sets its order below and its power above', () => {
  expect(renderToStaticMarkup(<OperationLabel name="C3^2" />)).toBe(
    '<span>C<sub>3</sub><sup>2</sup></span>',
  );
  expect(renderToStaticMarkup(<OperationLabel name="i" />)).toBe(
    '<span>i</span>',
  );
  expect(
    renderToStaticMarkup(<OperationLabel name="σv(xz)" situation={false} />),
  ).toBe('<span>σ<sub>v</sub></span>');
});

test('an exercise prints only the rows it gives, with no basis columns', () => {
  const markup = renderToStaticMarkup(
    <CharacterTable
      table={requireCharacterTable('C2v')}
      rows={['A1', 'A2']}
      basis={false}
    />,
  );

  expect(count(markup, '</tr>')).toBe(3);
  expect(markup).toContain('<th scope="row" class="mol-table__irrep">');
  expect(count(markup, '<span>A<sub>1</sub></span>')).toBe(1);
  expect(count(markup, '<span>B<sub>1</sub></span>')).toBe(0);
  expect(markup).not.toContain('Linear, rotations');
});

test('the row an exercise is filling in is drawn inside the table', () => {
  const markup = renderToStaticMarkup(
    <CharacterTable
      table={requireCharacterTable('C2v')}
      rows={['A1']}
      basis={false}
    >
      <tr className="answer-row">
        <th scope="row">B2</th>
        <td>?</td>
      </tr>
    </CharacterTable>,
  );

  expect(markup).toContain('<tr class="answer-row"><th scope="row">B2</th>');
  expect(count(markup, '</tr>')).toBe(3);
});

test('a chip is drawn per layer the page can show, and says whether it is on', () => {
  setDisplayFlag('axes', true);
  setDisplayFlag('mirrors', false);

  const markup = renderToStaticMarkup(
    <LayerChips keys={['axes', 'mirrors']} />,
  );

  // Two layers, plus the chip that switches every one of them off.
  expect(count(markup, '</button>')).toBe(3);
  expect(markup).toContain('aria-pressed="true" title="Proper rotation axes');
  // The description is the pointer's, so a chip never needs a caption.
  expect(markup).toContain(
    'aria-pressed="false" title="Mirror planes, as translucent discs.">Mirrors</button>',
  );
  expect(markup).toContain('>All off</button>');
  expect(markup).toContain('<div class="chip-row__label">Layers</div>');
});

test('the chip row can be called something other than Layers', () => {
  const markup = renderToStaticMarkup(
    <LayerChips keys={['axes']} label="Show" />,
  );

  expect(markup).toContain('<div class="chip-row__label">Show</div>');
});
