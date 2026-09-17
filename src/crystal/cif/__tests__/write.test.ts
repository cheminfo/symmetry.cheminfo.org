import { expect, test } from 'vitest';

import { readCif } from '../read.ts';
import type { CrystalStructure } from '../types.ts';
import { writeCif } from '../write.ts';

import { fixture, fixtureNames } from './fixture.ts';

test('a structure is written as this CIF', () => {
  const structure: CrystalStructure = {
    name: 'halite',
    formula: 'Na Cl',
    cell: { a: 5.6402, b: 5.6402, c: 5.6402, alpha: 90, beta: 90, gamma: 90 },
    spaceGroup: { number: 225, hm: 'F m -3 m', hall: '-F 4 2 3' },
    symopsXyz: ['x,y,z', '-x,-y,z'],
    sites: [
      {
        label: 'Na1',
        element: 'Na',
        x: 0,
        y: 0,
        z: 0,
        occupancy: 1,
        uiso: 0.0165,
      },
      {
        label: 'Cl1',
        element: 'Cl',
        x: 0.5,
        y: 0.5,
        z: 0.5,
        occupancy: 1,
        uiso: null,
      },
    ],
    source: { note: 'Halite', cod: '9008671' },
  };
  expect(writeCif(structure)).toBe(`data_halite
_chemical_formula_sum            'Na Cl'
_chemical_name_mineral           Halite
_cod_database_code               9008671
_cell_length_a                   5.6402
_cell_length_b                   5.6402
_cell_length_c                   5.6402
_cell_angle_alpha                90
_cell_angle_beta                 90
_cell_angle_gamma                90
_space_group_IT_number           225
_space_group_name_H-M_alt        'F m -3 m'
_space_group_name_Hall           '-F 4 2 3'
loop_
_space_group_symop_id
_space_group_symop_operation_xyz
1 x,y,z
2 -x,-y,z
loop_
_atom_site_label
_atom_site_type_symbol
_atom_site_fract_x
_atom_site_fract_y
_atom_site_fract_z
_atom_site_occupancy
_atom_site_U_iso_or_equiv
Na1 Na 0 0 0 1 0.0165
Cl1 Cl 0.5 0.5 0.5 1 ?
`);
});

test('what was not in the file is not written', () => {
  const structure: CrystalStructure = {
    name: 'copper',
    formula: '',
    cell: {
      a: 3.61491,
      b: 3.61491,
      c: 3.61491,
      alpha: 90,
      beta: 90,
      gamma: 90,
    },
    spaceGroup: { number: null, hm: 'F m -3 m', hall: null },
    symopsXyz: [],
    sites: [
      {
        label: 'Cu1',
        element: 'Cu',
        x: 0,
        y: 0,
        z: 0,
        occupancy: 1,
        uiso: null,
      },
    ],
    source: {},
  };
  const written = writeCif(structure);
  expect(written).not.toContain('_chemical_formula_sum');
  expect(written).not.toContain('_space_group_IT_number');
  expect(written).not.toContain('_space_group_name_Hall');
  expect(written).not.toContain('_atom_site_U_iso_or_equiv');
  expect(written).not.toContain('loop_\n_space_group_symop_id');
  expect(written).toContain('\nCu1 Cu 0 0 0 1\n');
});

test('a value that needs quoting is quoted', () => {
  const structure = readCif(fixture('halite.cif'));
  const written = writeCif({
    ...structure,
    name: 'two words',
    symopsXyz: ['-x, 1/2+y, -z'],
    source: { note: "it's a mineral" },
  });
  expect(written.startsWith('data_two_words\n')).toBe(true);
  expect(written).toContain("1 '-x, 1/2+y, -z'\n");
  expect(written).toContain(
    '_chemical_name_mineral           "it\'s a mineral"\n',
  );
});

test('a value carrying both delimiters becomes a text field', () => {
  const structure = readCif(fixture('halite.cif'));
  const note = 'O\'Brien "x" Sons';
  const written = writeCif({ ...structure, source: { note } });
  expect(written).toContain(`_chemical_name_mineral\n;${note}\n;\n`);
  expect(readCif(written).source.note).toBe(note);
});

test('every fixture survives a write and a read', () => {
  const names = fixtureNames();
  expect(names).toHaveLength(9);
  for (const name of names) {
    const structure = readCif(fixture(name));
    expect(readCif(writeCif(structure))).toStrictEqual(structure);
  }
});
