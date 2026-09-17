import type { StructureEntry } from './types.ts';

/**
 * The sixteen structures the crystal workbench opens with, simplest first and
 * ending in the triclinic one that forces nothing.
 *
 * Between them they cover all seven crystal systems and every centring letter
 * but A and B, and several were chosen to sit beside each other: copper,
 * halite and fluorite are the same space group and nothing like one another,
 * SrTiO₃ and CaTiO₃ are the same structure undistorted and tilted, and
 * sphalerite and wurtzite are the same bonds stacked two ways.
 */
export const STRUCTURE_ENTRIES: readonly StructureEntry[] = [
  {
    id: 'copper',
    title: 'Copper',
    formula: 'Cu',
    spaceGroupNumber: 225,
    variant: 0,
    teaches: 'One atom in the file, and the F centring makes four.',
    source: {
      kind: 'literature',
      citation: 'Straumanis & Yu, Acta Cryst. A25 (1969) 676',
    },
  },
  {
    id: 'iron-alpha',
    title: 'α-Iron',
    formula: 'Fe',
    spaceGroupNumber: 229,
    variant: 0,
    teaches: 'Body-centred cubic: the atom at the centre is the same atom.',
    source: {
      kind: 'literature',
      citation: 'Wyckoff, Crystal Structures vol. 1 (1963)',
    },
  },
  {
    id: 'halite',
    title: 'Halite',
    formula: 'NaCl',
    spaceGroupNumber: 225,
    variant: 0,
    teaches: 'Two atoms, eight in the cell, both on sites of symmetry m-3m.',
    source: {
      kind: 'literature',
      citation: 'Wyckoff, Crystal Structures vol. 1 (1963) 85–237',
    },
  },
  {
    id: 'caesium-chloride',
    title: 'Caesium chloride',
    formula: 'CsCl',
    spaceGroupNumber: 221,
    variant: 0,
    teaches: 'Not body-centred: the centre carries another element, so P.',
    source: {
      kind: 'literature',
      citation: 'Wyckoff, Crystal Structures vol. 1 (1963)',
    },
  },
  {
    id: 'fluorite',
    title: 'Fluorite',
    formula: 'CaF2',
    spaceGroupNumber: 225,
    variant: 0,
    teaches: 'Halite’s group again, with fluorine on -43m: CaF₂, not CaF.',
    source: {
      kind: 'literature',
      citation: 'Wyckoff, Crystal Structures vol. 1 (1963)',
    },
  },
  {
    id: 'sphalerite',
    title: 'Sphalerite',
    formula: 'ZnS',
    spaceGroupNumber: 216,
    variant: 0,
    teaches: 'Diamond with two elements, so the inversion centre is gone.',
    source: {
      kind: 'literature',
      citation: 'Wyckoff, Crystal Structures vol. 1 (1963)',
    },
  },
  {
    id: 'diamond',
    title: 'Diamond',
    formula: 'C',
    spaceGroupNumber: 227,
    variant: 0,
    teaches: 'Origin choice 2 puts the carbon at ⅛, ⅛, ⅛.',
    source: {
      kind: 'literature',
      citation: 'Hom, Kiszenick & Post, J. Appl. Cryst. 8 (1975) 457',
    },
  },
  {
    id: 'strontium-titanate',
    title: 'Strontium titanate',
    formula: 'SrTiO3',
    spaceGroupNumber: 221,
    variant: 0,
    teaches: 'The undistorted perovskite: three atoms, three site symmetries.',
    source: {
      kind: 'literature',
      citation: 'Abramov et al., Acta Cryst. B51 (1995) 942',
    },
  },
  {
    id: 'rutile',
    title: 'Rutile',
    formula: 'TiO2',
    spaceGroupNumber: 136,
    variant: 0,
    teaches: 'A 4₂ screw down c, and an n glide across the cell diagonal.',
    source: {
      kind: 'literature',
      citation: 'Howard, Sabine & Dickson, Acta Cryst. B47 (1991) 462',
    },
  },
  {
    id: 'graphite',
    title: 'Graphite, 2H',
    formula: 'C',
    spaceGroupNumber: 194,
    variant: 0,
    teaches: 'Two carbons on -6m2, and the layers stack ABAB.',
    source: {
      kind: 'literature',
      citation: 'Trucano & Chen, Nature 258 (1975) 136',
    },
  },
  {
    id: 'wurtzite',
    title: 'Wurtzite, 2H',
    formula: 'ZnS',
    spaceGroupNumber: 186,
    variant: 0,
    teaches:
      'Sphalerite’s bonds, stacked hexagonally: no inversion, a polar c.',
    source: {
      kind: 'cod',
      cod: '9011665',
      citation: 'Xu & Ching, Phys. Rev. B 48 (1993) 4335',
    },
  },
  {
    id: 'quartz',
    title: 'α-Quartz',
    formula: 'SiO2',
    spaceGroupNumber: 154,
    variant: 0,
    teaches: 'A 3₂ screw spirals the tetrahedra; P3₁21 is its mirror image.',
    source: {
      kind: 'cod',
      cod: '2300370',
      citation: 'Lignie et al., J. Appl. Cryst. 45 (2012) 272',
    },
  },
  {
    id: 'calcite',
    title: 'Calcite',
    formula: 'CaCO3',
    spaceGroupNumber: 167,
    variant: 0,
    teaches: 'Rhombohedral centring, with the carbonate ion on a 3-fold.',
    source: {
      kind: 'cod',
      cod: '9000095',
      citation: 'Graf, Am. Mineral. 46 (1961) 1283',
    },
  },
  {
    id: 'perovskite',
    title: 'Perovskite',
    formula: 'CaTiO3',
    spaceGroupNumber: 62,
    variant: 2,
    teaches:
      'SrTiO₃ with the octahedra tilted, written in the setting P b n m.',
    source: {
      kind: 'cod',
      cod: '9006172',
      citation: 'Liu & Liebermann, Phys. Chem. Minerals 20 (1993) 171',
    },
  },
  {
    id: 'gypsum',
    title: 'Gypsum',
    formula: 'CaSO4(H2O)2',
    spaceGroupNumber: 15,
    variant: 0,
    teaches: 'C-centred monoclinic, with the sulfate ion on a 2-fold axis.',
    source: {
      kind: 'cod',
      cod: '9013164',
      citation: 'Comodi et al., Am. Mineral. 93 (2008) 1530',
    },
  },
  {
    id: 'chalcanthite',
    title: 'Chalcanthite',
    formula: 'CuSO4(H2O)5',
    spaceGroupNumber: 2,
    variant: 0,
    teaches: 'Triclinic: nothing is forced, and both coppers sit on -1.',
    source: {
      kind: 'cod',
      cod: '9008253',
      citation: 'Bacon & Titterton, Z. Kristallogr. 141 (1975) 330',
    },
  },
];
