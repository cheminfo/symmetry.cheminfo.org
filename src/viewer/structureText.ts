/**
 * The atoms as a file molstar can read.
 *
 * XYZ, and only XYZ: the site has already applied every operation, so the
 * viewer needs a format that carries elements and Cartesian coordinates and
 * nothing else. Handing molstar a CIF would invite it to expand the symmetry a
 * second time, which is the one thing this site must not let it do.
 */

import type { ViewerAtom } from './types.ts';

// What this site calls one atom of its scene — `O 1`, `Si 4` — is the family's,
// so the hover readout and the operation list say the same thing.

/**
 * Write the atoms as XYZ.
 *
 * @param atoms - The whole scene, Cartesian ångström.
 * @param comment - The second line of the file, which molstar keeps as the
 *   model's comment.
 * @returns The file text, ending in a newline.
 * @throws When there are no atoms: molstar reads a count of zero as the end of
 *   the file and returns a model with no atoms rather than an error.
 */
export function toXyzText(
  atoms: readonly ViewerAtom[],
  comment = 'symmetry.cheminfo.org',
): string {
  if (atoms.length === 0) {
    throw new Error('an XYZ file needs at least one atom.');
  }
  const lines: string[] = [String(atoms.length), comment];
  for (const atom of atoms) {
    const [x, y, z] = atom.position;
    lines.push(`${atom.element} ${format(x)} ${format(y)} ${format(z)}`);
  }
  return `${lines.join('\n')}\n`;
}

/** Six decimals is a thousandth of the shortest bond, and reads as a number. */
function format(value: number): string {
  return (value === 0 ? 0 : value).toFixed(6);
}

export { atomName } from 'react-cheminfo/molstar/core';
