/**
 * How the atoms of every 3D view are drawn: the representation, its sizes and
 * the molecular surface, as the display options set them. One set for the
 * whole site, so a molecule, a crystal and a tutorial step look alike, kept in
 * this browser and written into the address by `src/share/route.ts`.
 */

import { batch, effect, signal, untracked } from '@preact/signals-react';
import { persistSignalBucket } from 'react-cheminfo/core';
import type {
  Molecule3DSettings,
  RepresentationId,
  SurfaceColoringId,
} from 'react-cheminfo/molecule3d';
import {
  DEFAULT_MOLECULE_3D_SETTINGS,
  readMolecule3DSettings,
  writeMolecule3DSettings,
} from 'react-cheminfo/molecule3d';

const defaults = DEFAULT_MOLECULE_3D_SETTINGS;

/** The settings, one signal each. */
export const viewer = persistSignalBucket({
  key: 'symmetry:viewer',
  version: 1,
  effect,
  bucket: {
    representation: signal<RepresentationId>(defaults.representation),
    sizeFactor: signal(defaults.sizeFactor),
    bondSizeFactor: signal(defaults.bondSizeFactor),
    showSurface: signal(defaults.showSurface),
    surfaceAlpha: signal(defaults.surfaceAlpha),
    probeRadius: signal(defaults.probeRadius),
    surfaceColoring: signal<SurfaceColoringId>(defaults.surfaceColoring),
    surfaceColor: signal(defaults.surfaceColor),
  },
});

/**
 * The settings as one record, repaired. Read without subscribing.
 * @returns How the atoms are drawn now.
 */
export function viewerSettings(): Molecule3DSettings {
  return untracked(() => readMolecule3DSettings(viewer));
}

/**
 * Draw the atoms as these settings say.
 * @param settings - From the display options, or from a figure.
 */
export function setViewerSettings(settings: Molecule3DSettings): void {
  batch(() => {
    writeMolecule3DSettings(viewer, settings);
  });
}
