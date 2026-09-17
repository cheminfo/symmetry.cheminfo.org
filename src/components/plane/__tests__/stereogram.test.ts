import { expect, test } from 'vitest';

import { finitePointGroups } from '../../../data/pointGroups.ts';
import { operationsOf } from '../../../symmetry/pointGroups.ts';
import type { Stereogram } from '../stereogram.ts';
import { stereogramOf } from '../stereogram.ts';
import {
  PROBE_DIRECTION,
  canonicalNormal,
  mirrorTrace,
  primitiveCirclePath,
  stereographic,
} from '../stereographic.ts';

/** The diagram of one point group, on a circle of radius 100. */
function diagramOf(id: string): Stereogram {
  return stereogramOf(operationsOf(id), { radius: 100 });
}

/** Every axis mark, as `C4 at x,y`. */
function axes(diagram: Stereogram): string[] {
  return diagram.axes.map(
    (axis) =>
      `${axis.improper ? 'S' : 'C'}${axis.order} at ${axis.x},${axis.y}`,
  );
}

test('the projection pole switches at the equator, so nothing lands outside', () => {
  expect(stereographic([0, 0, 1], 100)).toStrictEqual({
    x: 0,
    y: 0,
    upper: true,
  });
  expect(stereographic([0, 0, -1], 100)).toStrictEqual({
    x: 0,
    y: 0,
    upper: false,
  });
  expect(stereographic([1, 0, 0], 100)).toStrictEqual({
    x: 100,
    y: 0,
    upper: true,
  });
  // A direction and its mirror image in the equator project to the same place:
  // that is the concentric ●/○ a horizontal mirror leaves on the diagram.
  const up = stereographic([0.6, 0, 0.8], 100);
  const down = stereographic([0.6, 0, -0.8], 100);
  expect(up.x).toBe(down.x);
  expect(up.y).toBe(down.y);
  expect(up.upper).toBe(true);
  expect(down.upper).toBe(false);
});

test('the probe is a general direction: azimuth 22°, polar 40°', () => {
  expect(PROBE_DIRECTION[0]).toBeCloseTo(0.596, 4);
  expect(PROBE_DIRECTION[1]).toBeCloseTo(0.2408, 4);
  expect(PROBE_DIRECTION[2]).toBeCloseTo(0.766, 4);
  expect(stereographic(PROBE_DIRECTION, 100)).toStrictEqual({
    x: 33.746732,
    y: 13.634565,
    upper: true,
  });
});

test('a mirror plane traces a circle, a diameter, or the primitive circle', () => {
  expect(mirrorTrace([0, 0, 1], 100)).toStrictEqual({
    key: '0,0,1',
    kind: 'horizontal',
  });
  expect(mirrorTrace([1, 0, 0], 100)).toStrictEqual({
    key: '1,0,0',
    kind: 'diameter',
    x1: 0,
    y1: -100,
    x2: 0,
    y2: 100,
  });
  // Pole (0, 1/√2, 1/√2): centre (0, R), radius R√2 — checked by hand in the
  // report, and the upper-hemisphere point (0, −1/√2, 1/√2) lands on it.
  const inclined = mirrorTrace([0, Math.SQRT1_2, Math.SQRT1_2], 100);
  expect(inclined).toStrictEqual({
    key: '0,0.707107,0.707107',
    kind: 'arc',
    cx: 0,
    cy: 100,
    r: 141.421356,
  });
  const onPlane = stereographic([0, -Math.SQRT1_2, Math.SQRT1_2], 100);
  expect(onPlane.y).toBeCloseTo(-41.42136, 4);
  expect(Math.hypot(onPlane.x - 0, onPlane.y - 100)).toBeCloseTo(141.42136, 4);
});

test('a normal and its opposite are one plane', () => {
  expect(mirrorTrace([-1, 0, 0], 100)).toStrictEqual(
    mirrorTrace([1, 0, 0], 100),
  );
  expect(canonicalNormal([0, -1, 0])).toStrictEqual([0, 1, 0]);
  expect(canonicalNormal([0, 0, 0])).toStrictEqual([0, 0, 0]);
});

test('the primitive circle is path data, so the frame exports as one node', () => {
  expect(primitiveCirclePath(100)).toBe(
    'M -100,0 a 100 100 0 1 0 200 0 a 100 100 0 1 0 -200 0 Z',
  );
});

test('C2v: four marks, all above the page, two of them of the other hand', () => {
  const diagram = diagramOf('C2v');
  expect(
    diagram.points.map(
      (point) =>
        `${point.label} ${point.x},${point.y} ${point.upper ? 'up' : 'down'}${point.mirrored ? ' comma' : ''}`,
    ),
  ).toStrictEqual([
    'E 33.746732,13.634565 up',
    'C2 -33.746732,-13.634565 up',
    'σv 33.746732,-13.634565 up comma',
    'σv -33.746732,13.634565 up comma',
  ]);
  expect(axes(diagram)).toStrictEqual(['C2 at 0,0']);
  expect(diagram.mirrors.map((mirror) => mirror.kind)).toStrictEqual([
    'diameter',
    'diameter',
  ]);
  expect(diagram.inversion).toBe(false);
});

test('Oh: the cube read off one picture', () => {
  const diagram = diagramOf('Oh');
  expect(diagram.points).toHaveLength(48);
  expect(diagram.inversion).toBe(true);
  // 3 four-folds (one of them down the page, so five marks), 4 three-folds and
  // 6 two-folds give 17 proper marks; the S4 and S6 axes add nine more.
  expect(diagram.axes.filter((axis) => !axis.improper)).toHaveLength(17);
  expect(diagram.axes.filter((axis) => axis.improper)).toHaveLength(9);
  expect(
    diagram.axes.filter((axis) => axis.order === 4 && !axis.improper),
  ).toHaveLength(5);
  expect(
    diagram.axes.filter((axis) => axis.order === 3 && !axis.improper),
  ).toHaveLength(4);
  // Nine mirror planes: {100} gives the primitive circle and two diameters,
  // {110} gives two more diameters and four arcs.
  expect(
    diagram.mirrors.filter((mirror) => mirror.kind === 'horizontal'),
  ).toHaveLength(1);
  expect(
    diagram.mirrors.filter((mirror) => mirror.kind === 'diameter'),
  ).toHaveLength(4);
  expect(
    diagram.mirrors.filter((mirror) => mirror.kind === 'arc'),
  ).toHaveLength(4);
});

test('D3h puts an S3 over its C3, which is how 6̄ is drawn', () => {
  const diagram = diagramOf('D3h');
  expect(axes(diagram)).toContain('C3 at 0,0');
  expect(axes(diagram)).toContain('S3 at 0,0');
  // The open glyph is drawn first and half again as wide, so the filled one
  // sits inside it rather than under it.
  expect(diagram.axes[0]?.improper).toBe(true);
  const improper = diagram.axes.find((axis) => axis.improper && axis.x === 0);
  const proper = diagram.axes.find((axis) => !axis.improper && axis.x === 0);
  expect(improper?.path).toBe('M 0,7.5 L -6.495191,-3.75 L 6.495191,-3.75 Z');
  expect(proper?.path).toBe('M 0,5 L -4.330127,-2.5 L 4.330127,-2.5 Z');
  expect(axes(diagram).filter((axis) => axis.startsWith('C2'))).toHaveLength(6);
  expect(
    diagram.mirrors.filter((mirror) => mirror.kind === 'horizontal'),
  ).toHaveLength(1);
});

test('every finite point group puts as many marks on the page as it has operations', () => {
  const groups = finitePointGroups();
  expect(groups).toHaveLength(51);
  const wrong: string[] = [];
  for (const group of groups) {
    const diagram = stereogramOf(operationsOf(group.id), { radius: 100 });
    const marks = new Set(
      diagram.points.map((point) => `${point.x},${point.y},${point.upper}`),
    );
    if (marks.size !== group.order) {
      wrong.push(`${group.id}: ${marks.size} marks for order ${group.order}`);
    }
  }
  expect(wrong).toStrictEqual([]);
});

test('half of a group with a mirror is of the other hand', () => {
  const groups = ['Cs', 'C2v', 'D2h', 'Td', 'Oh', 'D6h'];
  const counts = groups.map((id) => {
    const diagram = diagramOf(id);
    const commas = diagram.points.filter((point) => point.mirrored).length;
    return `${id} ${commas}/${diagram.points.length}`;
  });
  expect(counts).toStrictEqual([
    'Cs 1/2',
    'C2v 2/4',
    'D2h 4/8',
    'Td 12/24',
    'Oh 24/48',
    'D6h 12/24',
  ]);
  // A chiral group has no comma at all.
  expect(
    diagramOf('D3').points.filter((point) => point.mirrored),
  ).toStrictEqual([]);
});
