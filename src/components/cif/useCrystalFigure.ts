import { useEffect } from 'react';
import type { Molecule3DCamera } from 'react-cheminfo/molecule3d';

import { crystalFigureStates } from '../../figure/crystalFigure.ts';
import { registerFigurePage } from '../../figure/figurePage.ts';
import { state } from '../../state/index.ts';
import type { ViewerHandle } from '../viewer/index.ts';

import { viewerSource } from './viewerSource.ts';

/** The multiple of the view's size a figure is rendered at, for a slide. */
const FIGURE_SCALE = 2;

/**
 * Hand the crystal on screen to a host asking for the figure, and to Ctrl+C:
 * the picture of the view, carrying the file, the cells, the packing and the
 * camera it was taken at.
 * @param handle - The canvas's means to picture itself, once it exists.
 * @param shown - Whether a crystal is on screen.
 */
export function useCrystalFigure(
  handle: ViewerHandle | null,
  shown: boolean,
): void {
  useEffect(() => {
    if (handle === null || !shown) return;
    let camera: Molecule3DCamera | null = null;
    return registerFigurePage({
      svg: async () => {
        await handle.whenDrawn();
        camera = await handle.readCamera();
        return handle.capture.svg(FIGURE_SCALE);
      },
      states: () => {
        const source = viewerSource();
        if (source === null) return undefined;
        return crystalFigureStates(
          {
            name: source.name,
            cif: source.text,
            structureId: source.structureId,
          },
          {
            supercell: state.view.viewer.supercell.peek(),
            packing: state.view.viewer.packing.peek(),
            unitCell: state.preferences.flags.unitCell.peek(),
            camera,
          },
        );
      },
    });
  }, [handle, shown]);
}
