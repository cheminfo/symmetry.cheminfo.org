import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import { spaceGroup } from '../../../symmetry/spaceGroups.ts';
import { GroupProductTable } from '../GroupProductTable.tsx';
import { PositionsPanel } from '../PositionsPanel.tsx';

/** How many times a tag opens in the markup. */
function count(markup: string, tag: string): number {
  return markup.split(`<${tag}`).length - 1;
}

test('the multiplication table is composed, and C2v closes on itself', () => {
  const markup = renderToStaticMarkup(<GroupProductTable group="C2v" />);

  expect(count(markup, 'td')).toBe(16);
  expect(markup).toContain('<th scope="col">C2v: row ∘ column</th>');
  // σv(xz) ∘ C2 is the other mirror, which is the point of the table.
  expect(markup).toContain(
    '<th scope="row">σv(xz)</th><td>σv(xz)</td><td>σv(yz)</td><td>E</td><td>C2</td>',
  );
  expect(markup).not.toContain('<td>—</td>');
});

test('a group too big to read says so instead of printing 2304 cells', () => {
  const markup = renderToStaticMarkup(<GroupProductTable group="Oh" />);

  expect(markup).toContain(
    'Oh has 48 operations, so its table has 2304 cells.',
  );
  expect(count(markup, 'table')).toBe(0);
});

test('the positions panel prints the coset list of the setting', () => {
  const markup = renderToStaticMarkup(
    <PositionsPanel setting={spaceGroup(14)} />,
  );

  expect(markup).toContain('P 1 21/c 1 · multiplicity 4 · centring P');
  expect(count(markup, 'li')).toBe(4);
  expect(markup).toContain('<code>-x,y+1/2,-z+1/2</code>');
});
