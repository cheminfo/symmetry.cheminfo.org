import { expect, test } from 'vitest';

import { spaceGroup, spaceGroupsWhere } from '../../symmetry/spaceGroups.ts';
import { readCif, writeCif } from '../cif/index.ts';
import {
  DEFAULT_CELL,
  draftOf,
  draftStructure,
  emptyDraft,
  nextSiteLabel,
  reconstrain,
  withCellParameter,
  withSite,
  withSiteAdded,
  withSiteRemoved,
} from '../draft.ts';

const HALITE_CIF = `data_halite
_chemical_formula_sum 'Na Cl'
_cell_length_a 5.6402
_cell_length_b 5.6402
_cell_length_c 5.6402
_cell_angle_alpha 90
_cell_angle_beta 90
_cell_angle_gamma 90
_space_group_IT_number 225
_space_group_name_H-M_alt 'F m -3 m'
loop_
_atom_site_label
_atom_site_type_symbol
_atom_site_fract_x
_atom_site_fract_y
_atom_site_fract_z
_atom_site_occupancy
Na1 Na 0 0 0 1
Cl1 Cl 0.5 0.5 0.5 1
`;

test('an empty cell obeys the setting it is opened in', () => {
  expect(emptyDraft(spaceGroup(1)).cell).toStrictEqual(DEFAULT_CELL);
  expect(emptyDraft(spaceGroup(225)).cell).toStrictEqual({
    a: 5,
    b: 5,
    c: 5,
    alpha: 90,
    beta: 90,
    gamma: 90,
  });
  expect(emptyDraft(spaceGroup(194)).cell).toStrictEqual({
    a: 5,
    b: 5,
    c: 7,
    alpha: 90,
    beta: 90,
    gamma: 120,
  });
  const draft = emptyDraft(spaceGroup(225));
  expect(draft.sites).toStrictEqual([
    { label: 'C1', element: 'C', x: 0, y: 0, z: 0, occupancy: 1, uiso: null },
  ]);
});

test('a file becomes a draft, and the draft writes the file back', () => {
  const setting = spaceGroup(225);
  const draft = draftOf(readCif(HALITE_CIF), setting, 'Halite');
  expect(draft.name).toBe('Halite');
  expect(draft.formula).toBe('Na Cl');
  expect(draft.cell.a).toBe(5.6402);
  expect(draft.sites).toHaveLength(2);

  const structure = draftStructure(draft, setting);
  // The catalogue carries no Hall symbol above number 74, so the coset list is
  // what makes the file unambiguous — which is why it is always written.
  expect(structure.spaceGroup).toStrictEqual({
    number: 225,
    hm: 'F 4/m -3 2/m',
    hall: null,
  });
  expect(structure.symopsXyz).toHaveLength(192);
  expect(
    draftStructure(emptyDraft(spaceGroup(14)), spaceGroup(14)).spaceGroup,
  ).toStrictEqual({ number: 14, hm: 'P 1 21/c 1', hall: '-P 2ybc' });

  const written = writeCif(structure);
  const reread = readCif(written);
  expect(reread.cell).toStrictEqual(draft.cell);
  expect(reread.sites).toStrictEqual(draft.sites);
  expect(reread.symopsXyz).toStrictEqual(setting.operations);
});

test('typing a free parameter re-derives the ones that follow it', () => {
  const setting = spaceGroup(225);
  const draft = withCellParameter(emptyDraft(setting), setting, 'a', 4.2);
  expect(draft.cell).toStrictEqual({
    a: 4.2,
    b: 4.2,
    c: 4.2,
    alpha: 90,
    beta: 90,
    gamma: 90,
  });
});

test('a half-typed or impossible cell field leaves the cell alone', () => {
  const setting = spaceGroup(1);
  const start = emptyDraft(setting);
  expect(withCellParameter(start, setting, 'a', Number.NaN)).toBe(start);
  expect(withCellParameter(start, setting, 'a', 0)).toBe(start);
  expect(withCellParameter(start, setting, 'b', -3)).toBe(start);
});

test('changing the setting moves the cell and never the atoms', () => {
  const triclinic = spaceGroup(1);
  const tetragonal = spaceGroup(136);
  const start = withSite(emptyDraft(triclinic), 0, { x: 0.3, y: 0.2, z: 0.1 });
  const moved = reconstrain(start, tetragonal);
  expect(moved.cell).toStrictEqual({
    a: 5,
    b: 5,
    c: 7,
    alpha: 90,
    beta: 90,
    gamma: 90,
  });
  expect(moved.sites).toStrictEqual(start.sites);
});

test('a rhombohedral setting takes three equal edges at three equal angles', () => {
  const rhombohedral = spaceGroupsWhere(
    (setting) => setting.number === 167 && setting.axes === 'rhombohedral',
  )[0];
  if (rhombohedral === undefined) throw new Error('167 has no R setting');
  expect(emptyDraft(rhombohedral).cell).toStrictEqual({
    a: 5,
    b: 5,
    c: 5,
    alpha: 70,
    beta: 70,
    gamma: 70,
  });
});

test('sites are added with a label nothing is using, and the last one stays', () => {
  const setting = spaceGroup(225);
  let draft = emptyDraft(setting);
  draft = withSiteAdded(draft, 'O');
  draft = withSiteAdded(draft, 'O');
  expect(draft.sites.map((entry) => entry.label)).toStrictEqual([
    'C1',
    'O1',
    'O2',
  ]);
  expect(nextSiteLabel(draft.sites, 'C')).toBe('C2');

  draft = withSiteRemoved(draft, 1);
  expect(draft.sites.map((entry) => entry.label)).toStrictEqual(['C1', 'O2']);
  draft = withSiteRemoved(draft, 0);
  expect(draft.sites.map((entry) => entry.label)).toStrictEqual(['O2']);
  const last = withSiteRemoved(draft, 0);
  expect(last).toBe(draft);
  expect(withSiteRemoved(draft, 9)).toBe(draft);
  expect(withSite(draft, 9, { x: 1 })).toBe(draft);
});

test('editing one site leaves the others as they were', () => {
  const draft = withSite(withSiteAdded(emptyDraft(spaceGroup(225)), 'Cl'), 1, {
    x: 0.5,
    y: 0.5,
    z: 0.5,
    occupancy: 0.5,
  });
  expect(draft.sites).toStrictEqual([
    { label: 'C1', element: 'C', x: 0, y: 0, z: 0, occupancy: 1, uiso: null },
    {
      label: 'Cl1',
      element: 'Cl',
      x: 0.5,
      y: 0.5,
      z: 0.5,
      occupancy: 0.5,
      uiso: null,
    },
  ]);
});
