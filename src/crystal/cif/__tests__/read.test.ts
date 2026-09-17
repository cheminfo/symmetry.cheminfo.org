import { expect, test } from 'vitest';

import { readCif } from '../read.ts';

import { fixture, miniCif } from './fixture.ts';

test('a hand-written CIF reads to exactly this structure', () => {
  expect(readCif(fixture('halite.cif'))).toStrictEqual({
    name: 'halite',
    formula: 'Na Cl',
    cell: { a: 5.6402, b: 5.6402, c: 5.6402, alpha: 90, beta: 90, gamma: 90 },
    spaceGroup: { number: 225, hm: 'F m -3 m', hall: '-F 4 2 3' },
    symopsXyz: [],
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
        uiso: 0.0154,
      },
    ],
    source: { note: 'Halite' },
  });
});

test('a hexagonal cell keeps its 120 degree angle', () => {
  const graphite = readCif(fixture('graphite-2h.cif'));
  expect(graphite.cell).toStrictEqual({
    a: 2.4612,
    b: 2.4612,
    c: 6.709,
    alpha: 90,
    beta: 90,
    gamma: 120,
  });
  expect(graphite.sites[1]).toStrictEqual({
    label: 'C2',
    element: 'C',
    x: 0.333333,
    y: 0.666667,
    z: 0.25,
    occupancy: 1,
    uiso: null,
  });
});

test('an operation list is kept verbatim and in file order', () => {
  const halite = readCif(fixture('cod-1000041-halite.cif'));
  expect(halite.symopsXyz).toHaveLength(192);
  expect(halite.symopsXyz[0]).toBe('x,y,z');
  expect(halite.symopsXyz[191]).toBe('1/2+z,1/2+y,-x');

  const periclase = readCif(fixture('cod-9008671-periclase.cif'));
  expect(periclase.symopsXyz).toHaveLength(192);
  expect(periclase.symopsXyz[191]).toBe('1/2-y,1/2-z,-x');

  const nacl = readCif(fixture('cod-4300180-halite.cif'));
  expect(nacl.symopsXyz).toHaveLength(192);
  expect(nacl.symopsXyz[0]).toBe('+x,+y,+z');
  expect(nacl.symopsXyz[191]).toBe('-y+1/2,+x+1/2,+z');
});

test('the element comes from the type symbol, oxidation state removed', () => {
  const halite = readCif(fixture('cod-1000041-halite.cif'));
  // The file writes `Na1+` and `Cl1-`.
  expect(halite.sites).toStrictEqual([
    { label: 'Na1', element: 'Na', x: 0, y: 0, z: 0, occupancy: 1, uiso: null },
    {
      label: 'Cl1',
      element: 'Cl',
      x: 0.5,
      y: 0.5,
      z: 0.5,
      occupancy: 1,
      uiso: null,
    },
  ]);
});

test('the element comes from the label when the file gives no type symbol', () => {
  const periclase = readCif(fixture('cod-9008671-periclase.cif'));
  expect(periclase.sites[0]?.element).toBe('Mg');
  expect(periclase.sites[1]?.element).toBe('O');

  // Labels written all in capitals: `NA1`, `CL2`.
  const nacl = readCif(fixture('cod-4300180-halite.cif'));
  expect(nacl.sites).toStrictEqual([
    {
      label: 'NA1',
      element: 'Na',
      x: 0,
      y: 0,
      z: 0,
      occupancy: 1,
      uiso: 0.025,
    },
    {
      label: 'CL2',
      element: 'Cl',
      x: 0,
      y: 0.5,
      z: 0,
      occupancy: 1,
      uiso: 0.025,
    },
  ]);
});

test('occupancy defaults to 1 and the displacement parameter to null', () => {
  const copper = readCif(fixture('copper.cif'));
  expect(copper.sites).toStrictEqual([
    { label: 'Cu1', element: 'Cu', x: 0, y: 0, z: 0, occupancy: 1, uiso: null },
  ]);
  expect(copper.spaceGroup).toStrictEqual({
    number: null,
    hm: 'F m -3 m',
    hall: null,
  });
  expect(copper.formula).toBe('');
  expect(copper.source).toStrictEqual({});
});

test('a B factor is converted to U', () => {
  const sites = readCif(
    miniCif(
      [
        'loop_',
        '_atom_site_label',
        '_atom_site_fract_x',
        '_atom_site_fract_y',
        '_atom_site_fract_z',
        '_atom_site_occupancy',
        '_atom_site_B_iso_or_equiv',
        'Na1 0 0 0 0.5 2.0',
      ].join('\n'),
    ),
  ).sites;
  expect(sites[0]?.occupancy).toBe(0.5);
  // U = B / 8pi^2
  expect(sites[0]?.uiso).toBeCloseTo(0.0253302959, 10);
});

test('the source records the doi, the COD entry and the mineral name', () => {
  expect(readCif(fixture('cod-1000041-halite.cif')).source).toStrictEqual({
    doi: '10.1107/S0365110X65002244',
    cod: '1000041',
  });
  expect(readCif(fixture('cod-9008671-periclase.cif')).source).toStrictEqual({
    cod: '9008671',
    note: 'Periclase',
  });
  expect(readCif(fixture('cod-4300180-halite.cif')).source).toStrictEqual({
    doi: '10.1021/ic991044f',
    cod: '4300180',
  });
});

test('a file with no unit cell is refused', () => {
  expect(() => readCif('data_x\n_cell_length_a 5\n')).toThrow(
    'This CIF has no unit cell: _cell_length_b is missing or is not a number.',
  );
});

test('an atom whose element cannot be read is refused', () => {
  const body = [
    'loop_',
    '_atom_site_label',
    '_atom_site_fract_x',
    '_atom_site_fract_y',
    '_atom_site_fract_z',
    '1abc 0 0 0',
  ].join('\n');
  expect(() => readCif(miniCif(body))).toThrow(
    'Atom site "1abc" names no element: neither its type symbol nor its label opens with one.',
  );
});

test('an atom with no fractional coordinate is refused', () => {
  const body = [
    'loop_',
    '_atom_site_label',
    '_atom_site_fract_x',
    '_atom_site_fract_y',
    '_atom_site_fract_z',
    'Na1 0 0 ?',
  ].join('\n');
  expect(() => readCif(miniCif(body))).toThrow(
    'Atom site "Na1" has no fractional coordinate on _atom_site_fract_z.',
  );
});

test('an atom loop with no label column is refused', () => {
  // cif-to-json keys this loop `_atom_site_fract`, not `_atom_site`: the key is
  // the common prefix of whatever columns the file wrote.
  const body = [
    'loop_',
    '_atom_site_fract_x',
    '_atom_site_fract_y',
    '_atom_site_fract_z',
    '0 0 0',
  ].join('\n');
  expect(() => readCif(miniCif(body))).toThrow(
    'An atom site of this CIF carries neither a label nor a type symbol.',
  );
});

test('a file with no atom loop reads to no sites', () => {
  expect(readCif(miniCif('_chemical_formula_sum C')).sites).toStrictEqual([]);
});
