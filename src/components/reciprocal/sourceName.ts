/**
 * What the picture on screen is called, for a caption or a label.
 */

import { exampleById } from '../../reciprocal/examples.ts';
import type { ReciprocalSource } from '../../state/index.ts';

/**
 * The name of what real space holds.
 * @param source - What real space holds.
 * @returns A name for a caption or a label.
 */
export function sourceName(source: ReciprocalSource): string {
  if (source.kind === 'photo') return source.name;
  if (source.kind === 'lattice') return 'A crystal from the lattice settings';
  return exampleById(source.id)?.name ?? 'The picture';
}
