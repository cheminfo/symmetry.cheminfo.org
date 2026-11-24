/**
 * The reciprocal-space workbench: a picture, its Fourier transform, and the
 * picture rebuilt from the part of the transform a student keeps.
 *
 * The three sit in one row — real space, reciprocal space, back to real space
 * — divided by two splitters whose shares are `?split=` and `?split2=`. The
 * maths is `src/reciprocal`, the state `src/state/reciprocal.ts`; this file
 * lays the page out and takes the pictures somebody drops or pastes.
 */

import { Callout, Card } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { DragEvent, ReactElement } from 'react';
import { useEffect, useEffectEvent, useState } from 'react';
import { errorMessage } from 'react-cheminfo/core';
import { PagePart, SplitRow, useIsHidden } from 'react-cheminfo/ui';

import {
  ExamplePicker,
  LatticeFields,
  RealPane,
  RebuiltPane,
  ReciprocalNotes,
  SpectrumPane,
} from '../components/reciprocal/index.ts';
import { readPhoto } from '../reciprocal/photo.ts';
import {
  openReciprocalPhoto,
  setReciprocalSplit2,
  setReciprocalSplit,
  shownLattice,
  state,
} from '../state/index.ts';

import '../components/reciprocal/reciprocal.css';

/** What the image takes of the row before anybody drags: a third. */
const DEFAULT_SPLIT = 33;

/** What the transform takes of the rest: half, so the three are equal. */
const DEFAULT_SPLIT2 = 50;

/** Under this width the image goes above the two others. */
const STACK_BELOW = 980;

/** Under this width the transform goes above the rebuilt image. */
const INNER_STACK_BELOW = 560;

/**
 * The page.
 * @returns The picker, the three figures and the notes.
 */
export function Reciprocal(): ReactElement {
  useSignals();
  const isHidden = useIsHidden();
  const lattice = shownLattice();
  const view = state.view.reciprocal;
  const [problem, setProblem] = useState<string | null>(null);

  async function takeFile(file: File): Promise<void> {
    try {
      const image = await readPhoto(file);
      openReciprocalPhoto({ name: file.name, image });
      setProblem(null);
    } catch (error) {
      setProblem(errorMessage(error));
    }
  }

  const onPaste = useEffectEvent((event: ClipboardEvent) => {
    const file = imageFile(event.clipboardData?.files);
    if (file === undefined) return;
    event.preventDefault();
    void takeFile(file);
  });

  useEffect(() => {
    function paste(event: ClipboardEvent): void {
      onPaste(event);
    }
    globalThis.addEventListener('paste', paste);
    return () => {
      globalThis.removeEventListener('paste', paste);
    };
  }, []);

  const showSources =
    !isHidden('examples') || (lattice !== null && !isHidden('lattice'));

  return (
    <div
      className="reciprocal-page"
      onDragOver={(event: DragEvent<HTMLDivElement>) => {
        if (event.dataTransfer.types.includes('Files')) event.preventDefault();
      }}
      onDrop={(event: DragEvent<HTMLDivElement>) => {
        const file = imageFile(event.dataTransfer.files);
        if (file === undefined) return;
        event.preventDefault();
        void takeFile(file);
      }}
    >
      <PagePart part="intro">
        <header className="plane-head">
          <h1>Reciprocal space</h1>
          <p>
            A picture, its Fourier transform, and the picture rebuilt from the
            part of the transform you keep.
          </p>
        </header>
      </PagePart>

      {problem === null ? null : (
        <Callout intent="danger" compact title="That picture could not be read">
          {problem} Try a PNG or a JPEG.
        </Callout>
      )}

      {showSources ? (
        <Card compact className="reciprocal-sources no-print">
          <PagePart part="examples">
            <ExamplePicker
              onFile={(file) => {
                void takeFile(file);
              }}
            />
          </PagePart>
          {lattice === null ? null : (
            <PagePart part="lattice">
              <LatticeFields lattice={lattice} />
            </PagePart>
          )}
        </Card>
      ) : null}

      <SplitRow
        ratio={view.split.value}
        defaultRatio={DEFAULT_SPLIT}
        onRatio={setReciprocalSplit}
        stackBelow={STACK_BELOW}
        start={
          <Card compact className="reciprocal-card">
            <RealPane />
          </Card>
        }
        end={
          <SplitRow
            ratio={view.split2.value}
            defaultRatio={DEFAULT_SPLIT2}
            onRatio={setReciprocalSplit2}
            stackBelow={INNER_STACK_BELOW}
            start={
              <Card compact className="reciprocal-card">
                <SpectrumPane tools={!isHidden('filter')} />
              </Card>
            }
            end={
              isHidden('rebuilt') ? null : (
                <Card compact className="reciprocal-card">
                  <RebuiltPane tools={!isHidden('phases')} />
                </Card>
              )
            }
          />
        }
      />

      <PagePart part="notes">
        <Card compact>
          <ReciprocalNotes />
        </Card>
      </PagePart>
    </div>
  );
}

/** The first picture among some files, if there is one. */
function imageFile(files: FileList | undefined): File | undefined {
  if (files === undefined) return undefined;
  for (const file of files) {
    if (file.type.startsWith('image/')) return file;
  }
  return undefined;
}
