/**
 * The middle pane: the cell, its contents and its symmetry elements in 3D.
 *
 * The canvas is behind a lazy boundary inside `ViewerPanel`, so molstar is
 * fetched the first time this pane mounts and never on a page that shows no
 * structure.
 */

import { Button, ButtonGroup } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { PagePart } from 'react-cheminfo/ui';

import { SUPERCELL_RANGE } from '../../state/index.ts';
import { LayerChips } from '../molecules/LayerChips.tsx';
import type { ViewerScene } from '../viewer/index.ts';
import { ViewerPanel } from '../viewer/index.ts';

import { CRYSTAL_LAYERS } from './crystalLabels.ts';

import './crystals.css';

/** Props of {@link CrystalView}. */
export interface CrystalViewProps {
  /** What to draw, already built and referentially stable. */
  readonly scene: ViewerScene;
  /** One line under the canvas saying what is on it. */
  readonly caption: string;
  /** Cells drawn along each axis. */
  readonly supercell: number;
  /** Draw more or fewer of them. */
  readonly onSupercell: (cells: number) => void;
}

/**
 * The canvas, the stack control and the layer chips.
 * @param props - See {@link CrystalViewProps}.
 * @returns The middle pane.
 */
export function CrystalView(props: CrystalViewProps): ReactElement {
  const { scene, caption, supercell, onSupercell } = props;

  return (
    <>
      <ViewerPanel
        scene={scene}
        height={380}
        caption={caption}
        emptyMessage="This cell holds no atoms. Add one in the table."
      />
      <PagePart part="controls">
        <div className="chip-bar">
          <div className="chip-row">
            <span className="chip-row__label">Cells</span>
            <div className="chip-row__chips">
              <ButtonGroup size="small">
                {SUPERCELL_COUNTS.map((count) => (
                  <Button
                    key={count}
                    text={`${count}×${count}×${count}`}
                    active={count === supercell}
                    onClick={() => {
                      onSupercell(count);
                    }}
                  />
                ))}
              </ButtonGroup>
            </div>
          </div>
        </div>
        <LayerChips keys={CRYSTAL_LAYERS} />
      </PagePart>
    </>
  );
}

/** One to four cells along each axis, which is what a shared link may ask for. */
const SUPERCELL_COUNTS: readonly number[] = Array.from(
  { length: SUPERCELL_RANGE.maximum - SUPERCELL_RANGE.minimum + 1 },
  (_, index) => SUPERCELL_RANGE.minimum + index,
);
