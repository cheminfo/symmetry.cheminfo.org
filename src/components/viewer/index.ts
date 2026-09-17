/**
 * The 3D view, as a page mounts it.
 *
 * Nothing exported here pulls molstar in: `ViewerPanel` probes first and reaches
 * the canvas through `React.lazy`, and the scene types are plain data. A page
 * imports from here and from `src/viewer/core.ts`, never from
 * `src/viewer/index.ts`.
 */

export type { ViewerPanelProps } from './ViewerPanel.tsx';
export { ViewerPanel } from './ViewerPanel.tsx';
export type { OperationPlayback, ViewerScene } from './viewerScene.ts';
