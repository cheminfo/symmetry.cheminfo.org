import { expect, test } from 'vitest';

import { inventoryOfAtoms } from '../../symmetry/detect.ts';
import { walkFlowchart } from '../../symmetry/flowchart.ts';
import { ASSIGNMENT_FLOW, FLOW_START, flowQuestion } from '../flowchart.ts';
import { MOLECULES } from '../molecules.ts';
import { pointGroupById } from '../pointGroups.ts';

test('the tree has eighteen questions, each reachable and each answerable', () => {
  expect(ASSIGNMENT_FLOW).toHaveLength(18);
  const ids = ASSIGNMENT_FLOW.map((one) => one.id);
  expect(new Set(ids).size).toBe(18);
  expect(ids[0]).toBe(FLOW_START);
  const reached = new Set<string>([FLOW_START]);
  for (const question of ASSIGNMENT_FLOW) {
    for (const target of [question.yes, question.no]) {
      if (target.kind === 'question') {
        expect(() => flowQuestion(target.id)).not.toThrow();
        reached.add(target.id);
        continue;
      }
      if (target.kind === 'group') {
        expect(() => pointGroupById(target.id)).not.toThrow();
      }
    }
  }
  expect([...reached].toSorted()).toStrictEqual(ids.toSorted());
});

test('every question is a question, and carries a hint', () => {
  for (const question of ASSIGNMENT_FLOW) {
    expect([question.id, question.question.endsWith('?')]).toStrictEqual([
      question.id,
      true,
    ]);
    expect([question.id, question.hint.length > 20]).toStrictEqual([
      question.id,
      true,
    ]);
  }
  expect(() => flowQuestion('nothing')).toThrow(
    'no flowchart question nothing',
  );
});

test('walking the tree reaches the group the detector reaches, for every molecule', () => {
  for (const entry of MOLECULES) {
    const inventory = inventoryOfAtoms(
      entry.atoms.map((atom) => atom.position),
      entry.atoms.map((atom) => atom.element),
      { tolerance: 1e-5 },
    );
    const walk = walkFlowchart(inventory);
    expect([entry.id, walk.group]).toStrictEqual([entry.id, entry.pointGroup]);
  }
});

test('the path a walk takes is the path a student would be marked on', () => {
  expect(walkOf('water').path).toStrictEqual([
    'linear:no',
    'multi-high-axis:no',
    'any-axis:yes',
    'perp-c2:no',
    'c-sigma-h:no',
    'c-sigma-v:yes',
  ]);
  expect(walkOf('methane').path).toStrictEqual([
    'linear:no',
    'multi-high-axis:yes',
    'has-c5:no',
    'has-c4:no',
    'tetra-mirror:yes',
    'tetra-i:no',
  ]);
  expect(walkOf('carbon-dioxide').path).toStrictEqual([
    'linear:yes',
    'linear-i:yes',
  ]);
  expect(walkOf('tetraphenylmethane').path).toStrictEqual([
    'linear:no',
    'multi-high-axis:no',
    'any-axis:yes',
    'perp-c2:no',
    'c-sigma-h:no',
    'c-sigma-v:no',
    'improper:yes',
  ]);
});

test('a family node resolves with the n the walk found', () => {
  expect(walkOf('benzene').group).toBe('D6h');
  expect(walkOf('benzene').principalAxis).not.toBeNull();
  expect(walkOf('ferrocene-staggered').group).toBe('D5d');
  expect(walkOf('sulfur-crown').group).toBe('D4d');
  expect(walkOf('boric-acid').group).toBe('C3h');
});

/** The walk for a library molecule. */
function walkOf(id: string) {
  const entry = MOLECULES.find((one) => one.id === id);
  if (entry === undefined) throw new Error(`no molecule ${id}`);
  return walkFlowchart(
    inventoryOfAtoms(
      entry.atoms.map((atom) => atom.position),
      entry.atoms.map((atom) => atom.element),
      { tolerance: 1e-5 },
    ),
  );
}
