/**
 * The 3D view as this site mounts it: react-cheminfo's crystal viewer, drawn
 * with the site's one set of display options, and saying what still works on a
 * machine that cannot draw in 3D.
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import type { CrystalViewer3DProps } from 'react-cheminfo/crystal3d';
import { CrystalViewer3D } from 'react-cheminfo/crystal3d';
import { readMolecule3DSettings } from 'react-cheminfo/molecule3d';

import { setViewerSettings, state } from '../../state/index.ts';

/** Props of {@link ViewerPanel}. */
export type ViewerPanelProps = Omit<
  CrystalViewer3DProps,
  'unsupportedNote' | 'settings' | 'defaultSettings' | 'onSettingsChange'
>;

/**
 * The 3D scene, with its failure and no-WebGL messages.
 *
 * @param props - See {@link ViewerPanelProps}.
 * @returns The viewer, or an explanation of why this machine cannot show one.
 */
export function ViewerPanel(props: ViewerPanelProps): ReactElement {
  useSignals();
  const { emptyMessage = 'Nothing to show yet.', ...rest } = props;
  return (
    <CrystalViewer3D
      {...rest}
      settings={readMolecule3DSettings(state.preferences.viewer)}
      onSettingsChange={setViewerSettings}
      emptyMessage={emptyMessage}
      unsupportedNote="The operations, the character tables, the exercises and the cheatsheet all work without it."
    />
  );
}
