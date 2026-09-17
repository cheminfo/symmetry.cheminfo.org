import { expect, test } from 'vitest';

import { readCif } from '../read.ts';
import { SYMOP_TAGS } from '../tags.ts';

import { fixture, miniCif } from './fixture.ts';

test('a tag is found whatever case it is written in', () => {
  const upper = `DATA_UP
_CELL_LENGTH_A 5.6402
_CELL_LENGTH_B 5.6402
_CELL_LENGTH_C 5.6402
_CELL_ANGLE_ALPHA 90
_CELL_ANGLE_BETA 90
_CELL_ANGLE_GAMMA 90
_SYMMETRY_INT_TABLES_NUMBER 225
_SYMMETRY_SPACE_GROUP_NAME_H-M 'F m -3 m'
loop_
_ATOM_SITE_LABEL
_ATOM_SITE_TYPE_SYMBOL
_ATOM_SITE_FRACT_X
_ATOM_SITE_FRACT_Y
_ATOM_SITE_FRACT_Z
Na1 Na 0 0 0
`;
  const structure = readCif(upper);
  expect(structure.name).toBe('UP');
  expect(structure.cell.a).toBe(5.6402);
  expect(structure.spaceGroup).toStrictEqual({
    number: 225,
    hm: 'F m -3 m',
    hall: null,
  });
  expect(structure.sites).toStrictEqual([
    { label: 'Na1', element: 'Na', x: 0, y: 0, z: 0, occupancy: 1, uiso: null },
  ]);
});

test('the operations are found under each of the four tags', () => {
  expect(SYMOP_TAGS).toStrictEqual([
    '_space_group_symop_operation_xyz',
    '_space_group_symop.operation_xyz',
    '_symmetry_equiv_pos_as_xyz',
    '_symmetry_equiv_pos.as_xyz',
  ]);
  for (const tag of SYMOP_TAGS) {
    expect(
      readCif(miniCif(`loop_\n${tag}\nx,y,z\n-x,-y,-z`)).symopsXyz,
    ).toStrictEqual(['x,y,z', '-x,-y,-z']);
  }
});

test('an id column does not hide the operations', () => {
  // The loop key cif-to-json derives changes with the optional id column:
  // `_space_group_symop` rather than `_space_group_symop_operation_xyz`.
  for (const tag of SYMOP_TAGS) {
    const id = tag.startsWith('_space_group')
      ? '_space_group_symop_id'
      : '_symmetry_equiv_pos_site_id';
    expect(
      readCif(miniCif(`loop_\n${id}\n${tag}\n1 x,y,z\n2 -x,-y,-z`)).symopsXyz,
    ).toStrictEqual(['x,y,z', '-x,-y,-z']);
  }
});

test('the International Tables number is found under either tag', () => {
  expect(readCif(miniCif('_space_group_IT_number 14')).spaceGroup.number).toBe(
    14,
  );
  expect(
    readCif(miniCif('_symmetry_Int_Tables_number 14')).spaceGroup.number,
  ).toBe(14);
  for (const value of ['0', '231', '?', 'x']) {
    expect(
      readCif(miniCif(`_space_group_IT_number ${value}`)).spaceGroup.number,
    ).toBeNull();
  }
});

test('the Hermann-Mauguin and Hall symbols are found under either tag', () => {
  expect(
    readCif(miniCif("_space_group_name_H-M_alt 'P 1 21/c 1'")).spaceGroup.hm,
  ).toBe('P 1 21/c 1');
  expect(
    readCif(miniCif("_symmetry_space_group_name_H-M 'P 1 21/c 1'")).spaceGroup
      .hm,
  ).toBe('P 1 21/c 1');
  expect(
    readCif(miniCif("_space_group_name_Hall '-P 2ybc'")).spaceGroup.hall,
  ).toBe('-P 2ybc');
  expect(
    readCif(miniCif("_symmetry_space_group_name_Hall '-P 2ybc'")).spaceGroup
      .hall,
  ).toBe('-P 2ybc');
});

test('the legacy tags of a real file are read', () => {
  const sphalerite = readCif(fixture('sphalerite.cif'));
  expect(sphalerite.spaceGroup).toStrictEqual({
    number: 216,
    hm: 'F -4 3 m',
    hall: 'F -4 2 3',
  });
});
