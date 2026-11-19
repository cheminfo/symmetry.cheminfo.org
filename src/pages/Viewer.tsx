/**
 * The viewer: any crystal, from its CIF file.
 *
 * A file dropped anywhere on the page, pasted, or chosen, is read through the
 * same path the crystal workbench reads one, expanded by the site's own
 * operations, and drawn with its molecules whole. The page is what a drawing on
 * draw.cheminfo.org and a document on write.cheminfo.org frame to make a figure
 * of a crystal, and what they frame again to change one.
 */

import { Callout, Spinner } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { DragEvent, ReactElement } from 'react';
import { useState } from 'react';
import type { CrystalViewHandle } from 'react-cheminfo/crystal3d';
import { PagePart, SplitRow } from 'react-cheminfo/ui';

import {
  CifActions,
  CifControls,
  CifDetails,
  CifDrop,
  openViewerFile,
  useCrystalFigure,
  useViewerCrystal,
} from '../components/cif/index.ts';
import { ViewerPanel } from '../components/viewer/index.ts';
import {
  DEFAULT_VIEWER_SPLIT,
  VIEWER_STACK_BELOW,
  setViewerSplit,
  state,
} from '../state/index.ts';

import '../components/cif/cif.css';

/** Tall enough for a cell seen at an angle, short enough to leave the chips. */
const VIEW_HEIGHT = 'max(380px, min(68dvh, 760px))';

/**
 * The page.
 * @returns The crystal and what its file says, or the way to open one.
 */
export function Viewer(): ReactElement {
  useSignals();
  const crystal = useViewerCrystal();
  const [problem, setProblem] = useState<string | null>(null);
  const [handle, setHandle] = useState<CrystalViewHandle | null>(null);
  const shown = crystal.kind === 'crystal' ? crystal : null;
  useCrystalFigure(handle, shown !== null);

  async function takeFiles(files: readonly File[]): Promise<void> {
    const file = files[0];
    if (file === undefined) return;
    setProblem(openViewerFile(await file.text(), file.name));
  }

  function takeText(text: string): void {
    setProblem(openViewerFile(text, 'pasted.cif'));
  }

  // While a crystal is shown the drop zone is gone, so the page takes the drop.
  const pageDrop =
    shown === null
      ? {}
      : {
          onDragOver: (event: DragEvent<HTMLDivElement>) => {
            if (event.dataTransfer.types.includes('Files')) {
              event.preventDefault();
            }
          },
          onDrop: (event: DragEvent<HTMLDivElement>) => {
            if (event.dataTransfer.files.length === 0) return;
            event.preventDefault();
            void takeFiles([...event.dataTransfer.files]);
          },
        };

  const unreadable = crystal.kind === 'unreadable' ? crystal.problem : null;
  const { status, error } = state.data.crystal;
  const fetching = status.value === 'loading';
  const fetchFailed = status.value === 'error' ? error.value : null;
  const shownProblem = problem ?? unreadable ?? fetchFailed;

  return (
    <div className="cif-page" {...pageDrop}>
      <PagePart part="intro">
        <header>
          <h1 style={headingStyle}>Crystal viewer</h1>
          <p style={leadStyle}>
            Drop a CIF file anywhere on the page to see its crystal in 3D.
          </p>
        </header>
      </PagePart>
      {shownProblem !== null && (
        <Callout intent="danger" title="That file could not be read" compact>
          {shownProblem}
        </Callout>
      )}
      {shown === null && fetching ? (
        <Callout icon={<Spinner size={16} />} data-testid="cif-fetching">
          Fetching the CIF…
        </Callout>
      ) : null}
      {shown === null && !fetching ? (
        <CifDrop
          onFiles={(files) => {
            void takeFiles(files);
          }}
          onText={takeText}
        />
      ) : null}
      {shown === null ? null : (
        <SplitRow
          ratio={state.view.viewer.split.value}
          defaultRatio={DEFAULT_VIEWER_SPLIT}
          stackBelow={VIEWER_STACK_BELOW}
          onRatio={setViewerSplit}
          start={
            <div className="cif-page__view">
              <ViewerPanel
                scene={shown.scene}
                height={VIEW_HEIGHT}
                caption={shown.caption}
                onHandle={setHandle}
              />
              <PagePart part="controls">
                <CifControls />
              </PagePart>
            </div>
          }
          end={
            <div className="cif-page__side">
              <CifActions
                source={shown.source}
                onFiles={(files) => {
                  void takeFiles(files);
                }}
              />
              <PagePart part="details">
                <CifDetails crystal={shown} />
              </PagePart>
            </div>
          }
        />
      )}
    </div>
  );
}

const headingStyle = { margin: 0, fontSize: '1.125rem' } as const;

const leadStyle = {
  margin: '2px 0 10px',
  color: 'var(--text-muted)',
  fontSize: '0.875rem',
} as const;
