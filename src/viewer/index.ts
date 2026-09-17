/**
 * The viewer boundary.
 *
 * `src/viewer` is the only folder allowed to import molstar, and this is the
 * only module the rest of the site imports the canvas from. Reaching it pulls
 * molstar in, so it belongs behind the `React.lazy` boundary in
 * `src/components/viewer`; everything molstar-free is in `core.ts` and is free
 * to import anywhere.
 *
 * ```ts
 * const viewer = createViewer(container);
 * await viewer.showStructure(atoms);
 * await viewer.showCell(cell, [2, 2, 2]);
 * await viewer.showElements(drawings);
 * await viewer.playOperation({ kind: 'rotation', axis, origin, order: 3 });
 * ```
 */

export * from './core.ts';

export type { PlayOptions } from './animate.ts';
export { DEFAULT_CAMERA_DURATION } from './camera.ts';
export type { CellStyle } from './renderCell.ts';
export type { ElementLayerStyle } from './renderElements.ts';
export type { StructureStyle } from './renderStructure.ts';
export type { ViewerOptions } from './plugin.ts';
export { ViewerPlugin } from './plugin.ts';
export { Viewer, createViewer } from './viewer.ts';

// The probe is react-cheminfo's, and imports nothing: a page can ask whether
// this machine can draw at all before paying for molstar.
export type { ViewerCapability } from 'react-cheminfo/orbital';
export { probeViewerCapability } from 'react-cheminfo/orbital';
