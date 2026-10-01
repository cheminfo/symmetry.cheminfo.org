/**
 * What a point group's page says in the HTML, before anything runs.
 *
 * The fifty-three point-group addresses shipped one body between them — the
 * site's crawl path, byte for byte — with only the title telling C2v from Td. A
 * search engine clusters pages by the text it is handed, so that was fifty-two
 * duplicates, and which one it kept was not ours to choose.
 *
 * Every sentence here is read off the group's own record and off the molecules
 * the library holds for it, so nothing is authored twice and nothing can drift
 * from what the page shows.
 */

import type { PageContent, PageTable } from 'react-cheminfo/core';

import { moleculesOfGroup } from '../data/molecules.ts';
import type { PointGroup } from '../data/pointGroups.ts';

import { count } from './describe.ts';

/**
 * The text of one point group's page.
 * @param group - The group the address names.
 * @returns What the page says.
 */
export function pointGroupContent(group: PointGroup): PageContent {
  return {
    heading: `The ${group.schoenflies} point group`,
    paragraphs: paragraphsOf(group),
    list: moleculeList(group),
    table: classTable(group),
  };
}

function paragraphsOf(group: PointGroup): string[] {
  const linear = !Number.isFinite(group.order);
  const paragraphs = [
    linear
      ? `${group.schoenflies} is one of the two linear point groups: its principal axis is of infinite order, so it carries infinitely many symmetry operations in ${count(group.classes.length, 'class', 'classes')}.`
      : `${group.schoenflies} carries ${count(group.order, 'symmetry operation')} in ${count(group.classes.length, 'class', 'classes')}${group.principalOrder > 1 ? `, around a principal axis of order ${group.principalOrder}` : ', and no axis of rotation above the identity'}. A character table of the group therefore has ${count(group.classes.length, 'column')} and as many irreducible representations.`,
    consequences(group),
  ];

  if (group.crystallographic && group.hermannMauguin !== null) {
    paragraphs.push(crystallography(group));
  }
  return paragraphs;
}

/** What the group's contents mean for a molecule that belongs to it. */
function consequences(group: PointGroup): string {
  const clauses = [
    group.chiral
      ? 'It contains only proper rotations, so a molecule in it is chiral and optically active.'
      : 'It contains an improper operation, so no molecule in it is chiral.',
    group.polar
      ? 'It leaves a direction invariant, so a molecule in it may carry a permanent dipole.'
      : 'No direction is left invariant, so a molecule in it has no permanent dipole.',
  ];
  if (group.centrosymmetric) {
    clauses.push(
      'It contains the inversion, so its vibrations and its electronic states divide into g and u, and no vibration is both infrared and Raman active.',
    );
  }
  return clauses.join(' ');
}

/** Where the group sits in the International Tables, when it sits there at all. */
function crystallography(group: PointGroup): string {
  const parts = [`In Hermann-Mauguin notation it is ${group.hermannMauguin}`];
  if (
    group.hermannMauguinFull !== null &&
    group.hermannMauguinFull !== group.hermannMauguin
  ) {
    parts.push(`written in full as ${group.hermannMauguinFull}`);
  }
  if (group.crystalSystem !== null) {
    parts.push(
      `and it is one of the crystal classes of the ${group.crystalSystem} system`,
    );
  }
  let text = `${parts.join(', ')}.`;
  if (group.laueClass !== null) {
    text += ` A diffraction pattern from a crystal in it shows the Laue symmetry ${group.laueClass}.`;
  }
  return text;
}

/** The conjugacy classes, as a character table heads them. */
function classTable(group: PointGroup): PageTable {
  const rows: string[][] = [];
  for (const entry of group.classes) {
    rows.push([
      entry.label,
      Number.isFinite(entry.size) ? String(entry.size) : 'infinitely many',
    ]);
  }
  return {
    columns: ['Class', 'Operations in it'],
    rows,
    caption: `The ${count(group.classes.length, 'conjugacy class', 'conjugacy classes')} of ${group.schoenflies}, in the order a character table prints them.`,
  };
}

/** The molecules the library holds for the group, each with why it belongs. */
function moleculeList(group: PointGroup): string[] | undefined {
  const molecules = moleculesOfGroup(group.id);
  if (molecules.length === 0) return undefined;
  const items: string[] = [];
  for (const molecule of molecules) {
    items.push(`${molecule.name} (${molecule.formula}): ${molecule.why}`);
  }
  return items;
}
