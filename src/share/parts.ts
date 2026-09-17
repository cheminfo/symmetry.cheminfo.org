/**
 * The regions of a page a shared link can leave out.
 *
 * A link on a course page is rarely the whole site: it is one figure, without
 * the chrome, and often without the panel a student would use to change what it
 * shows. `?embed` drops the header, its bar and the footer; `?hide=` names what
 * else to drop, and the share dialog only offers what the open page has.
 *
 * The parts are described in the family's own vocabulary, so `?hide=` is read
 * and written by `react-cheminfo` rather than by a second implementation here.
 */

import type { HideablePart } from 'react-cheminfo/core';

import type { TabId } from '../state/tabs.ts';

export { EMBED_PARAM, HIDE_PARAM } from 'react-cheminfo/core';

/** Every hideable region, in the order a link and the dialog list them. */
export const SHARE_PART_IDS = [
  'tabs',
  'intro',
  'picker',
  'flowchart',
  'operations',
  'characters',
  'controls',
  'cell',
  'positions',
  'motif',
  'catalogue',
  'export',
  'steps',
  'text',
  'demos',
  'list',
  'hints',
  'solution',
] as const;

/** One of {@link SHARE_PART_IDS}. */
export type SharePartId = (typeof SHARE_PART_IDS)[number];

/** The label and the one-line explanation the dialog shows for each part. */
export const SHARE_PARTS: Record<SharePartId, HideablePart> = {
  tabs: {
    key: 'tabs',
    label: 'Page bar',
    description: 'The pages of the site, on a page that keeps its header.',
    inHeader: true,
  },
  intro: {
    key: 'intro',
    label: 'Page heading',
    description: 'The title and the sentence under it saying what this is.',
    hiddenByDefault: true,
  },
  picker: {
    key: 'picker',
    label: 'Molecule picker',
    description: 'The library and its search, so the molecule cannot change.',
  },
  flowchart: {
    key: 'flowchart',
    label: 'Flowchart',
    description: 'The question-by-question route to the point group.',
  },
  operations: {
    key: 'operations',
    label: 'Operation list',
    description: 'Every operation of the group, and the button that plays it.',
  },
  characters: {
    key: 'characters',
    label: 'Character table',
    description: 'The table of irreducible representations and its readout.',
  },
  controls: {
    key: 'controls',
    label: 'Layer controls',
    description: 'The chips switching axes, mirrors and planes on and off.',
  },
  cell: {
    key: 'cell',
    label: 'Cell editor',
    description: 'The space-group picker, the cell edges and the atom list.',
  },
  positions: {
    key: 'positions',
    label: 'General positions',
    description: 'The coordinate list the cell is generated from.',
  },
  motif: {
    key: 'motif',
    label: 'Motif editor',
    description: 'The motif and the group picker, so the pattern is fixed.',
  },
  catalogue: {
    key: 'catalogue',
    label: 'Catalogue browser',
    description: 'The list of every group beside the one on screen.',
    hiddenByDefault: true,
  },
  export: {
    key: 'export',
    label: 'Export menu',
    description: 'The CIF and image downloads under the view.',
    hiddenByDefault: true,
  },
  steps: {
    key: 'steps',
    label: 'Step picker',
    description: 'The numbered steps and the Previous/Next pager.',
  },
  text: {
    key: 'text',
    label: 'Step text',
    description: 'The prose of the step, leaving the view on its own.',
  },
  demos: {
    key: 'demos',
    label: 'Demo links',
    description: 'The buttons opening a step in the workbench it is about.',
  },
  list: {
    key: 'list',
    label: 'Exercise list',
    description: 'The deck and the progress bar, leaving one exercise alone.',
  },
  hints: {
    key: 'hints',
    label: 'Hints',
    description: 'The hint ladder under an exercise.',
  },
  solution: {
    key: 'solution',
    label: 'Solution',
    description: 'The button revealing the answer.',
  },
};

/**
 * What each page offers to hide. The header and the footer are not parts:
 * `?embed` drops them, and the page bar with them. The view itself is the
 * figure, so it is never a part.
 */
export const TAB_PARTS: Record<TabId, readonly SharePartId[]> = {
  molecules: [
    'tabs',
    'intro',
    'picker',
    'flowchart',
    'operations',
    'characters',
    'controls',
    'export',
  ],
  crystals: [
    'tabs',
    'intro',
    'operations',
    'controls',
    'cell',
    'positions',
    'export',
  ],
  plane: ['tabs', 'intro', 'operations', 'controls', 'motif', 'export'],
  tutorial: ['tabs', 'controls', 'steps', 'text', 'demos'],
  exercises: ['tabs', 'list', 'hints', 'solution'],
  cheatsheet: ['tabs', 'intro'],
  'point-groups': [
    'tabs',
    'intro',
    'operations',
    'characters',
    'controls',
    'catalogue',
  ],
  'space-groups': [
    'tabs',
    'intro',
    'operations',
    'controls',
    'positions',
    'catalogue',
    'export',
  ],
  wallpaper: ['tabs', 'intro', 'operations', 'controls', 'catalogue'],
  frieze: ['tabs', 'intro', 'operations', 'controls', 'catalogue'],
  about: ['tabs'],
};

/**
 * The parts a page can leave out.
 * @param tab - Page the link points at.
 * @returns Its part identifiers, in {@link SHARE_PART_IDS} order.
 */
export function partsOf(tab: TabId): readonly SharePartId[] {
  return TAB_PARTS[tab];
}
