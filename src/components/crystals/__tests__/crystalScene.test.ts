import { expect, test } from 'vitest';

import { draftOf } from '../../../crystal/draft.ts';
import { structureOf } from '../../../data/structures/index.ts';
import { spaceGroup, spaceGroupsWhere } from '../../../symmetry/spaceGroups.ts';
import {
  CRYSTAL_LAYERS,
  elementLabel,
  elementTally,
  sceneCaption,
  settingLabel,
} from '../crystalLabels.ts';
import {
  analyseCrystal,
  crystalAtoms,
  crystalDrawings,
} from '../crystalScene.ts';

const NOTHING = {
  axes: false,
  screws: false,
  mirrors: false,
  glides: false,
  inversion: false,
  improper: false,
};

function halite() {
  const setting = spaceGroup(225);
  return analyseCrystal(draftOf(structureOf('halite'), setting), setting);
}

test('one cell of halite is eight atoms, two sites and 151 elements', () => {
  const analysis = halite();
  expect(analysis.operations).toHaveLength(192);
  expect(analysis.atoms).toHaveLength(8);
  expect(analysis.sites).toHaveLength(2);
  expect([...analysis.composition]).toStrictEqual([
    ['Na', 4],
    ['Cl', 4],
  ]);
  expect(analysis.elements).toHaveLength(151);
  expect(analysis.lattice.volume).toBeCloseTo(179.4252, 4);
});

test('the atoms come out in Cartesian angstrom, repeated over the stack', () => {
  const analysis = halite();
  const one = crystalAtoms(analysis, 1);
  expect(one).toHaveLength(8);
  expect(one[0]).toStrictEqual({ element: 'Na', position: [0, 0, 0] });
  expect(one[1]?.element).toBe('Na');
  expect(one[1]?.position[1]).toBeCloseTo(2.8201, 4);

  expect(crystalAtoms(analysis, 2)).toHaveLength(64);
  expect(crystalAtoms(analysis, 3)).toHaveLength(216);
  // The stack starts at cell zero: the original eight are the first eight.
  expect(crystalAtoms(analysis, 2).slice(0, 8)).toStrictEqual(one);
});

test('the asymmetric unit is the two atoms the file lists, not the eight', () => {
  const analysis = halite();
  const unit = crystalAtoms(analysis, 1, true);
  expect(unit).toHaveLength(2);
  expect(unit.map((atom) => atom.element)).toStrictEqual(['Na', 'Cl']);
});

test('a layer that is off draws nothing, and one that is on draws its kind', () => {
  const analysis = halite();
  expect(crystalDrawings(analysis, NOTHING)).toStrictEqual([]);

  const mirrors = crystalDrawings(analysis, { ...NOTHING, mirrors: true });
  expect(mirrors).toHaveLength(12);
  expect(new Set(mirrors.map((drawing) => drawing.kind))).toStrictEqual(
    new Set(['mirror']),
  );

  const axes = crystalDrawings(analysis, { ...NOTHING, axes: true });
  expect(axes).toHaveLength(37);
  expect(
    crystalDrawings(analysis, { ...NOTHING, inversion: true }),
  ).toHaveLength(4);
  // The identity and the three centring translations have nothing to draw.
  const everything = crystalDrawings(analysis, {
    axes: true,
    screws: true,
    mirrors: true,
    glides: true,
    inversion: true,
    improper: true,
  });
  expect(everything).toHaveLength(analysis.elements.length - 4);
  expect(new Set(everything.map((drawing) => drawing.id)).size).toBe(
    everything.length,
  );
});

test('an element is named by its symbol and the direction it runs in', () => {
  const analysis = halite();
  const labels = analysis.elements.map((element) => elementLabel(element));
  expect(labels).toContain('4 along [0 0 1]');
  expect(labels).toContain('3 along [1 1 1]');
  expect(labels).toContain('m ⟂ (0 0 1)');
  expect(labels).toContain('-1');
});

test('the tally counts the kinds in a fixed order', () => {
  expect(elementTally(halite().elements)).toStrictEqual([
    ['rotation', 37],
    ['screw', 36],
    ['rotoinversion', 43],
    ['mirror', 12],
    ['glide', 15],
    ['inversion', 4],
  ]);
});

test('a setting is named by what makes it differ from its siblings', () => {
  expect(settingLabel(spaceGroup(225))).toBe('F 4/m -3 2/m');
  expect(settingLabel(spaceGroup(227, 0))).toBe('F 41/d -3 2/m — origin 2');
  expect(settingLabel(spaceGroup(14, 0))).toBe('P 1 21/c 1 — unique axis b');
  const rhombohedral = spaceGroupsWhere(
    (setting) => setting.number === 167 && setting.axes === 'rhombohedral',
  )[0];
  if (rhombohedral === undefined) throw new Error('167 has no R setting');
  expect(settingLabel(rhombohedral)).toBe('R -3 2/c — rhombohedral axes');
});

test('the crystal layers are the nine a cell has', () => {
  expect([...CRYSTAL_LAYERS]).toStrictEqual([
    'unitCell',
    'axes',
    'screws',
    'mirrors',
    'glides',
    'inversion',
    'improper',
    'asymmetricUnit',
    'labels',
  ]);
});

test('the caption says what was drawn, and what had to give way', () => {
  const base = {
    name: 'Halite',
    atomsPerCell: 8,
    cells: 1,
    asked: 1,
    elements: 0,
    named: true,
  };
  expect(sceneCaption(base)).toBe(
    'Halite — 8 atoms in the cell, drawn over one cell.',
  );
  expect(sceneCaption({ ...base, cells: 2, asked: 2, elements: 3 })).toBe(
    'Halite — 8 atoms in the cell, drawn over 2×2×2 cells. The elements are drawn in the first cell.',
  );
  expect(sceneCaption({ ...base, cells: 2, asked: 4 })).toBe(
    'Halite — 8 atoms in the cell, drawn over 2×2×2 cells. 4×4×4 would pass 20000 atoms.',
  );
  expect(sceneCaption({ ...base, elements: 53, named: false })).toBe(
    'Halite — 8 atoms in the cell, drawn over one cell. 53 elements, too many to name on screen.',
  );
});
