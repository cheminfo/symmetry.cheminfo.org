/**
 * The 3D view, as a page mounts it.
 *
 * Nothing exported here pulls molstar in: react-cheminfo's viewer probes first
 * and reaches the canvas through `React.lazy`.
 */

export type { ViewerPanelProps } from './ViewerPanel.tsx';
export { ViewerPanel } from './ViewerPanel.tsx';
