import type { Molecule3DCamera } from 'react-cheminfo/molecule3d';
import { DEFAULT_MOLECULE_3D_SETTINGS } from 'react-cheminfo/molecule3d';
import { expect, test } from 'vitest';

import { structureCif } from '../../data/structures/index.ts';
import {
  CRYSTAL_FIGURE_VERSION,
  crystalFigureStates,
  readCrystalFigure,
} from '../crystalFigure.ts';

const SPACEFILL_WRAPPED = {
  ...DEFAULT_MOLECULE_3D_SETTINGS,
  representation: 'spacefill' as const,
  showSurface: true,
};

const FIGURE = {
  name: 'Aspirin',
  cif: structureCif('aspirin'),
  structureId: 'aspirin',
};

test('a figure carries its file, its cells, its packing, its bonds, its display and its camera', () => {
  const camera: Molecule3DCamera = {
    rotation: [0, 0.6, 0, 0.8],
    zoom: 1.5,
    offset: [0, 0, 0],
  };
  const states = crystalFigureStates(FIGURE, {
    supercell: 2,
    packing: 'cell',
    bonds: 'noMetal',
    unitCell: false,
    display: SPACEFILL_WRAPPED,
    camera,
  });

  expect(states.data).toStrictEqual({
    version: CRYSTAL_FIGURE_VERSION,
    value: FIGURE,
  });
  expect(states.view?.value).toStrictEqual({
    supercell: 2,
    packing: 'cell',
    bonds: 'noMetal',
    unitCell: false,
    display: SPACEFILL_WRAPPED,
    camera: '0,0.6,0,0.8,1.5',
  });

  const opened = readCrystalFigure(structuredClone(states));
  expect(opened.figure).toStrictEqual(FIGURE);
  expect(opened.view).toStrictEqual({
    supercell: 2,
    packing: 'cell',
    bonds: 'noMetal',
    unitCell: false,
    display: SPACEFILL_WRAPPED,
    camera: { rotation: [0, 0.6, 0, 0.8], zoom: 1.5, offset: [0, 0, 0] },
  });
});

test('a view this version cannot read opens on the viewer defaults', () => {
  const opened = readCrystalFigure({
    data: { version: CRYSTAL_FIGURE_VERSION, value: FIGURE },
    view: {
      version: 1,
      value: {
        supercell: 99,
        packing: 'layers',
        bonds: 'dotted',
        unitCell: 'yes',
        display: 'sticks',
      },
    },
  });

  expect(opened.view).toStrictEqual({
    supercell: 4,
    packing: 'molecules',
    bonds: 'all',
    unitCell: true,
    display: DEFAULT_MOLECULE_3D_SETTINGS,
    camera: null,
  });
});

test('a figure carrying no crystal is refused, with a sentence', () => {
  expect(() => readCrystalFigure({})).toThrow(
    'This figure carries no crystal this version of the site can read.',
  );
  expect(() =>
    readCrystalFigure({
      data: { version: CRYSTAL_FIGURE_VERSION, value: { name: 'x', cif: ' ' } },
    }),
  ).toThrow('This figure carries no CIF to open.');
});
