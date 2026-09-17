import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import { draftOf, emptyDraft } from '../../../crystal/draft.ts';
import { structureOf } from '../../../data/structures/index.ts';
import { spaceGroup } from '../../../symmetry/spaceGroups.ts';
import { AtomTable } from '../AtomTable.tsx';
import { CellEditor } from '../CellEditor.tsx';
import { CellReadout } from '../CellReadout.tsx';
import { GroupPicker } from '../GroupPicker.tsx';
import { ElementsPanel, PositionsPanel } from '../PositionsPanel.tsx';
import { analyseCrystal } from '../crystalScene.ts';

const FM3M = spaceGroup(225);
const HALITE = draftOf(structureOf('halite'), FM3M, 'Halite');
const ANALYSIS = analyseCrystal(HALITE, FM3M);

/** How many times a tag opens in the markup. */
function count(markup: string, tag: string): number {
  return markup.split(`<${tag}`).length - 1;
}

test('the readout says the multiplicity and the site symmetry of every site', () => {
  const markup = renderToStaticMarkup(<CellReadout analysis={ANALYSIS} />);
  expect(markup).toContain('225 · F 4/m -3 2/m');
  expect(markup).toContain('Centrosymmetric, symmorphic.');
  expect(markup).toContain('multiplicity 4, site symmetry m-3m');
  expect(markup).toContain('37 rotation axes, 36 screw axes');
  expect(markup).toContain('4 inversion centres.');
  // Never a Wyckoff letter: the site readout is derived, and `4b` is not.
  expect(markup).not.toContain('4b');
  expect(count(markup, 'div class="xtl-row"')).toBe(2);
});

test('a forced cell parameter is a value, not a field', () => {
  const cubic = renderToStaticMarkup(
    <CellEditor cell={HALITE.cell} setting={FM3M} onChange={() => undefined} />,
  );
  // One edge is typed and five parameters follow it.
  expect(count(cubic, 'input')).toBe(1);
  expect(count(cubic, 'span class="xtl-field__derived"')).toBe(5);
  expect(cubic).toContain('= a = 5.6402');
  expect(cubic).toContain('Cubic: the four 3-fold axes make the three edges');

  const triclinic = renderToStaticMarkup(
    <CellEditor
      cell={emptyDraft(spaceGroup(1)).cell}
      setting={spaceGroup(1)}
      onChange={() => undefined}
    />,
  );
  expect(count(triclinic, 'input')).toBe(6);
  expect(count(triclinic, 'span class="xtl-field__derived"')).toBe(0);
  expect(triclinic).toContain('Triclinic: nothing is forced.');

  const monoclinic = renderToStaticMarkup(
    <CellEditor
      cell={emptyDraft(spaceGroup(14)).cell}
      setting={spaceGroup(14)}
      onChange={() => undefined}
    />,
  );
  expect(count(monoclinic, 'input')).toBe(4);
  expect(monoclinic).toContain('Monoclinic on unique axis b');
});

test('the atom table is one row per site, with the element colour beside it', () => {
  const markup = renderToStaticMarkup(
    <AtomTable
      sites={HALITE.sites}
      onChange={() => undefined}
      onAdd={() => undefined}
      onRemove={() => undefined}
    />,
  );
  expect(count(markup, 'tr')).toBe(3);
  expect(count(markup, 'span class="xtl-swatch"')).toBe(2);
  expect(markup).toContain('value="Na1"');
  expect(markup).toContain('value="Cl"');
  expect(markup).toContain('value="0.5"');
  expect(markup).toContain('Add an atom');
});

test('the coordinate list is the whole coset list, and the elements are named', () => {
  const positions = renderToStaticMarkup(
    <PositionsPanel analysis={ANALYSIS} />,
  );
  expect(positions).toContain('General positions · 192');
  expect(count(positions, 'div class="xtl-row"')).toBe(192);
  expect(positions).toContain('x,y,z');
  expect(positions).toContain('-x,y+1/2,z+1/2');

  const elements = renderToStaticMarkup(<ElementsPanel analysis={ANALYSIS} />);
  expect(elements).toContain('Symmetry elements · 147');
  expect(count(elements, 'div class="xtl-row"')).toBe(147);
  expect(elements).toContain('4 along [0 0 1]');
  expect(elements).toContain('m ⟂ (0 0 1)');
});

test('the group picker offers 230 groups and the settings of the one chosen', () => {
  const one = renderToStaticMarkup(
    <GroupPicker
      setting={FM3M}
      onSelectNumber={() => undefined}
      onSelectSetting={() => undefined}
    />,
  );
  // Fm-3m has one setting, so only the list of 230 is shown.
  expect(count(one, 'select')).toBe(1);
  expect(count(one, 'option')).toBe(230);
  expect(one).toContain('225 · F m -3 m');

  const nine = renderToStaticMarkup(
    <GroupPicker
      setting={spaceGroup(14)}
      onSelectNumber={() => undefined}
      onSelectSetting={() => undefined}
    />,
  );
  expect(count(nine, 'select')).toBe(2);
  expect(count(nine, 'option')).toBe(239);
  expect(nine).toContain('P 1 1 21/a — unique axis c');
});
