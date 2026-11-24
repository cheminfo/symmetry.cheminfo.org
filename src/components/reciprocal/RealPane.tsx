/**
 * Real space: the picture, the lattice vectors when it is a crystal, and the
 * region a drag selects for the transform.
 */

import { Button } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { imagePixels } from '../../reciprocal/display.ts';
import { latticeVectors } from '../../reciprocal/lattice.ts';
import type { Region } from '../../reciprocal/region.ts';
import { regionBetween } from '../../reciprocal/region.ts';
import {
  setReciprocalRegion,
  shownLattice,
  sourceImage,
  state,
} from '../../state/index.ts';

import type { FieldPointer } from './FieldFigure.tsx';
import { FieldFigure } from './FieldFigure.tsx';
import { RegionShade, VectorArrow } from './overlay.tsx';
import { sourceName } from './sourceName.ts';

/** A drag in progress: where it started and where the pointer is. */
interface Drag {
  start: FieldPointer;
  region: Region | null;
}

/**
 * The real-space pane.
 * @returns The picture, its overlay and a caption.
 */
export function RealPane(): ReactElement {
  useSignals();
  const image = sourceImage.value;
  const source = state.view.reciprocal.source.value;
  const region = state.view.reciprocal.region.value;
  const lattice = shownLattice();
  const pixels = useMemo(() => imagePixels(image), [image]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const vectors = lattice === null ? null : latticeVectors(lattice);
  const shown = drag === null ? region : drag.region;

  return (
    <section className="reciprocal-pane" aria-label="Real space">
      <header className="reciprocal-pane__head">
        <h2>Real space</h2>
        <Button
          className="no-print"
          size="small"
          variant="minimal"
          icon="zoom-to-fit"
          text="Whole image"
          disabled={region === null}
          onClick={() => {
            setReciprocalRegion(null);
          }}
        />
      </header>
      <FieldFigure
        pixels={pixels}
        label={`${sourceName(source)}, the image transformed`}
        testId="reciprocal-image"
        onDown={(pointer) => {
          setDrag({ start: pointer, region: null });
        }}
        onMove={(pointer) => {
          if (drag === null) return;
          setDrag({ start: drag.start, region: regionTo(pointer, drag.start) });
        }}
        onUp={(pointer) => {
          if (drag === null) return;
          const next = regionTo(pointer, drag.start);
          setDrag(null);
          // A click is not a selection: it leaves the region as it was.
          if (next !== null) setReciprocalRegion(next);
        }}
      >
        {vectors === null ? null : (
          <>
            <VectorArrow to={vectors.a} label="a" which="a" />
            <VectorArrow to={vectors.b} label="b" which="b" />
          </>
        )}
        {shown === null ? null : (
          <RegionShade region={shown} live={drag !== null} />
        )}
      </FieldFigure>
      <p className="reciprocal-pane__caption">
        {region === null
          ? 'Drag over the image to transform only part of it.'
          : `Only the ${region.width} × ${region.height} px left clear is transformed; the rest counts as black.`}
      </p>
    </section>
  );
}

function regionTo(pointer: FieldPointer, start: FieldPointer): Region | null {
  return regionBetween(start.column, start.row, pointer.column, pointer.row);
}
