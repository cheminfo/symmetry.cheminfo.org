/**
 * The middle pane: the structure with its symmetry drawn on it.
 *
 * The 3D canvas is behind a lazy boundary inside `ViewerPanel`, so the 2.8 MB
 * molstar chunk is fetched when this pane first mounts and never on a page that
 * shows no structure. The stereogram beside it is SVG and costs nothing.
 */

import { Button } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { downloadText, sanitizeFileName } from 'react-cheminfo/core';
import { PagePart } from 'react-cheminfo/ui';

import { toXyzText } from '../../viewer/core.ts';
import { Stereogram } from '../plane/index.ts';
import type { ViewerScene } from '../viewer/index.ts';
import { ViewerPanel } from '../viewer/index.ts';

import { LayerChips } from './LayerChips.tsx';
import type { MoleculeAnalysis } from './assignment.ts';

import './molecules.css';

/** The layers a molecule has: the crystallographic ones belong to a cell. */
const MOLECULE_LAYERS = [
  'axes',
  'mirrors',
  'inversion',
  'improper',
  'orbit',
  'stereogram',
  'labels',
] as const;

/** Props of {@link MoleculeView}. */
export interface MoleculeViewProps {
  readonly analysis: MoleculeAnalysis;
  /** What to draw, already built and referentially stable. */
  readonly scene: ViewerScene;
  /** Whether the stereographic projection is drawn under the canvas. */
  readonly stereogram: boolean;
}

/**
 * The structure, its layers and the file it can be saved as.
 * @param props - See {@link MoleculeViewProps}.
 * @returns The canvas, the chip bar and the export.
 */
export function MoleculeView(props: MoleculeViewProps): ReactElement {
  const { analysis, scene, stereogram } = props;
  const { atoms, detection, entry } = analysis;

  return (
    <>
      <ViewerPanel
        scene={scene}
        height={380}
        caption={`${entry.name} — hover an axis or a plane to name it.`}
      />
      <PagePart part="controls">
        <LayerChips keys={MOLECULE_LAYERS} />
      </PagePart>
      {stereogram && detection.operations.length > 0 && (
        <Stereogram
          operations={detection.operations}
          title={`Stereographic projection of ${detection.group}`}
          className="mol-stereogram"
        />
      )}
      <PagePart part="export">
        <div>
          <Button
            size="small"
            variant="minimal"
            icon="download"
            text="Download XYZ"
            onClick={() => {
              downloadText(
                toXyzText(atoms, `${entry.name} — ${entry.formula}`),
                `${sanitizeFileName(entry.id)}.xyz`,
                'chemical/x-xyz',
              );
            }}
          />
        </div>
      </PagePart>
    </>
  );
}
