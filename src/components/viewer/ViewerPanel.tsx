/**
 * The 3D view as this site mounts it: react-cheminfo's crystal viewer, saying
 * what still works on a machine that cannot draw in 3D.
 */

import type { ReactElement } from 'react';
import type { CrystalViewer3DProps } from 'react-cheminfo/crystal3d';
import { CrystalViewer3D } from 'react-cheminfo/crystal3d';

/** Props of {@link ViewerPanel}. */
export type ViewerPanelProps = Omit<CrystalViewer3DProps, 'unsupportedNote'>;

/**
 * The 3D scene, with its failure and no-WebGL messages.
 *
 * @param props - See {@link ViewerPanelProps}.
 * @returns The viewer, or an explanation of why this machine cannot show one.
 */
export function ViewerPanel(props: ViewerPanelProps): ReactElement {
  const { emptyMessage = 'Nothing to show yet.', ...rest } = props;
  return (
    <CrystalViewer3D
      {...rest}
      emptyMessage={emptyMessage}
      unsupportedNote="The operations, the character tables, the exercises and the cheatsheet all work without it."
    />
  );
}
