import type { ViewerCrystal } from './useViewerCrystal.ts';

/**
 * One line under the view saying what is on it.
 * @param crystal - The crystal on screen.
 * @param asked - Cells asked for along each axis.
 * @returns e.g. `Aspirin · 4 molecules · 2×2×2 cells`.
 */
export function viewerCaption(crystal: ViewerCrystal, asked: number): string {
  const { packed, cells, source } = crystal;
  const parts = [source.name];
  if (packed.molecules > 0) {
    parts.push(
      `${packed.molecules} ${packed.molecules === 1 ? 'molecule' : 'molecules'} per cell`,
    );
  } else {
    parts.push(`${packed.atoms.length} atoms per cell`);
  }
  parts.push(
    cells < asked
      ? `${cells}×${cells}×${cells} cells, as ${asked}×${asked}×${asked} would hold too many atoms`
      : `${cells}×${cells}×${cells} ${cells === 1 ? 'cell' : 'cells'}`,
  );
  return parts.join(' · ');
}
