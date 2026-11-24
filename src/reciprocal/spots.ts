/**
 * The spots a mask keeps, as a link carries them: `u,v,u,v`, each pair the
 * offset of a spot from the centre of the transform. Commas alone, because a
 * comma stays a comma in an address where any other separator is escaped into
 * something nobody can read back. A pair that is not two whole numbers inside
 * the field is dropped rather than fatal, so a link edited by hand still
 * opens.
 */

import type { Spot } from './filter.ts';
import { MAX_SPOTS } from './filter.ts';
import { FIELD_CENTRE } from './fourier.ts';

/**
 * Read the spots a link names.
 * @param text - What the link carries.
 * @returns The spots, at most {@link MAX_SPOTS} of them, without repeats.
 */
export function parseSpots(text: string): Spot[] {
  const spots: Spot[] = [];
  const parts = text.split(',');
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const first = parts[i] ?? '';
    const second = parts[i + 1] ?? '';
    if (first.trim() === '' || second.trim() === '') continue;
    const u = Number(first);
    const v = Number(second);
    if (!Number.isInteger(u) || !Number.isInteger(v)) continue;
    if (!insideField(u) || !insideField(v)) continue;
    if (spots.some((spot) => spot.u === u && spot.v === v)) continue;
    spots.push({ u, v });
    if (spots.length === MAX_SPOTS) break;
  }
  return spots;
}

/**
 * Write the spots into a link.
 * @param spots - The spots kept.
 * @returns `u,v,u,v`, or the empty string for none.
 */
export function formatSpots(spots: readonly Spot[]): string {
  return spots.map((spot) => `${spot.u},${spot.v}`).join(',');
}

function insideField(offset: number): boolean {
  return offset >= -FIELD_CENTRE && offset < FIELD_CENTRE;
}
