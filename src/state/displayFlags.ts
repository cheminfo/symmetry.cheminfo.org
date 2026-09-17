/**
 * The layers a workbench draws over the structure it is showing.
 *
 * One vocabulary, read by three things: the chip bar that switches them, the
 * stored preferences that remember them, and the `?flags=` parameter a shared
 * link pins them with. A tutorial step names the layers it opens with from the
 * same list, so a step and a link say the same thing in the same words.
 */

/** Every layer, in the order the chip bar shows them. */
export const DISPLAY_FLAG_KEYS = [
  'axes',
  'mirrors',
  'inversion',
  'improper',
  'orbit',
  'stereogram',
  'unitCell',
  'asymmetricUnit',
  'glides',
  'screws',
  'fundamentalDomain',
  'labels',
] as const;

/** One of {@link DISPLAY_FLAG_KEYS}. */
export type DisplayFlagKey = (typeof DISPLAY_FLAG_KEYS)[number];

/** What a chip reads, and whether the site opens with the layer drawn. */
export interface DisplayFlagMeta {
  key: DisplayFlagKey;
  /** What the chip reads. */
  label: string;
  /** What the layer draws, for the pointer and the share dialog. */
  description: string;
  /** Whether a visitor who has changed nothing sees it. */
  initial: boolean;
}

/**
 * The layers, described once.
 *
 * A molecule opens with the elements that decide its point group — the axes,
 * the mirrors and the inversion centre — and with their labels, because an
 * unlabelled rod through a structure says nothing. The crystallographic layers
 * start off: they are drawn in the cell, and the molecule workbench has none.
 */
export const DISPLAY_FLAGS: readonly DisplayFlagMeta[] = [
  {
    key: 'axes',
    label: 'Axes',
    description:
      'Proper rotation axes, as labelled rods through the structure.',
    initial: true,
  },
  {
    key: 'mirrors',
    label: 'Mirrors',
    description: 'Mirror planes, as translucent discs.',
    initial: true,
  },
  {
    key: 'inversion',
    label: 'Inversion',
    description: 'The inversion centre, as a dot.',
    initial: true,
  },
  {
    key: 'improper',
    label: 'Improper axes',
    description: 'Improper axes Sn, as a rod with the disc it reflects in.',
    initial: false,
  },
  {
    key: 'orbit',
    label: 'Orbit',
    description: 'Where the whole group sends a probe point you can drag.',
    initial: false,
  },
  {
    key: 'stereogram',
    label: 'Stereogram',
    description: 'The stereographic projection, beside the 3D view.',
    initial: false,
  },
  {
    key: 'unitCell',
    label: 'Unit cell',
    description: 'The edges of the cell, in the crystal and plane workbenches.',
    initial: true,
  },
  {
    key: 'asymmetricUnit',
    label: 'Asymmetric unit',
    description: 'The part of the cell the symmetry generates the rest from.',
    initial: false,
  },
  {
    key: 'glides',
    label: 'Glides',
    description: 'Glide planes, dashed, with the translation they carry.',
    initial: false,
  },
  {
    key: 'screws',
    label: 'Screw axes',
    description: 'Screw axes, with the arrow of their translation.',
    initial: false,
  },
  {
    key: 'fundamentalDomain',
    label: 'Fundamental domain',
    description: 'The tile a plane group repeats to fill the page.',
    initial: false,
  },
  {
    key: 'labels',
    label: 'Labels',
    description: 'The Schoenflies or Hermann-Mauguin name on every element.',
    initial: true,
  },
];

/**
 * Whether a string names one of the layers.
 * @param value - Candidate name, from a link or a tutorial step.
 * @returns True when it is a {@link DisplayFlagKey}.
 */
export function isDisplayFlagKey(value: string): value is DisplayFlagKey {
  for (const key of DISPLAY_FLAG_KEYS) {
    if (key === value) return true;
  }
  return false;
}
