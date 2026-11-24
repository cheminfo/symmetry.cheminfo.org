/**
 * Reciprocal space: the transform of what real space holds, what is kept of
 * it, and what the point under the pointer stands for.
 *
 * What a press does depends on the mask. With everything kept, or with spots
 * picked, a click picks the spot under it — snapped to the brightest point
 * nearby — together with its Friedel mate. With a disk, a press anywhere sets
 * the disk's edge there, and a drag moves it.
 */

import { SegmentedControl, Slider } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { NumberInput } from 'react-cheminfo/ui';

import type { SpectrumView, Zoom } from '../../reciprocal/display.ts';
import {
  CONTRAST_RANGE,
  SPECTRUM_VIEWS,
  ZOOMS,
  amplitudePixels,
  phasePixels,
} from '../../reciprocal/display.ts';
import type { MaskKind, Spot } from '../../reciprocal/filter.ts';
import { MASK_KINDS, snapToPeak } from '../../reciprocal/filter.ts';
import { FIELD_CENTRE } from '../../reciprocal/fourier.ts';
import { latticeVectors, reciprocalVectors } from '../../reciprocal/lattice.ts';
import {
  MASK_RADIUS_RANGE,
  pickSpot,
  setContrast,
  setMaskKind,
  setMaskRadius,
  setSpectrumView,
  setZoom,
  shownLattice,
  spectrum,
  state,
} from '../../state/index.ts';

import type { FieldPointer } from './FieldFigure.tsx';
import { FieldFigure } from './FieldFigure.tsx';
import { SpotReadout } from './SpotReadout.tsx';
import { MaskOutline, VectorArrow } from './overlay.tsx';

const MASK_OPTIONS: Array<{ value: MaskKind; label: string }> = [
  { value: 'all', label: 'Keep all' },
  { value: 'low', label: 'Low-pass' },
  { value: 'high', label: 'High-pass' },
  { value: 'spots', label: 'Pick spots' },
];

const ZOOM_OPTIONS: Array<{ value: Zoom; label: string }> = [
  { value: '1', label: '1×' },
  { value: '2', label: '2×' },
  { value: '4', label: '4×' },
];

const VIEW_OPTIONS: Array<{ value: SpectrumView; label: string }> = [
  { value: 'amplitude', label: 'Amplitude' },
  { value: 'phase', label: 'Phase' },
];

/**
 * The reciprocal-space pane.
 * @param props - What the pane shows of its tools.
 * @param props.tools - Whether the mask, view and contrast tools are drawn.
 * @returns The transform, its overlay, its tools and a readout.
 */
export function SpectrumPane(props: { readonly tools: boolean }): ReactElement {
  useSignals();
  const transform = spectrum.value;
  const view = state.view.reciprocal;
  const show = view.show.value;
  const contrast = view.contrast.value;
  const zoom = view.zoom.value;
  const kind = view.mask.value;
  const radius = view.radius.value;
  const spots = view.spots.value;
  const lattice = shownLattice();
  const [hover, setHover] = useState<Spot | null>(null);
  const [liveRadius, setLiveRadius] = useState<number | null>(null);
  const pixels = useMemo(
    () =>
      show === 'phase'
        ? phasePixels(transform, contrast)
        : amplitudePixels(transform, contrast),
    [transform, show, contrast],
  );
  const vectors = lattice === null ? null : latticeVectors(lattice);
  const reciprocal = vectors === null ? null : reciprocalVectors(vectors);
  const disk = kind === 'low' || kind === 'high';

  function offset(pointer: FieldPointer): Spot {
    return { u: pointer.column - FIELD_CENTRE, v: pointer.row - FIELD_CENTRE };
  }

  function edge(pointer: FieldPointer): number {
    const { u, v } = offset(pointer);
    const { min, max } = MASK_RADIUS_RANGE;
    return Math.min(Math.max(Math.round(Math.hypot(u, v)), min), max);
  }

  return (
    <section className="reciprocal-pane" aria-label="Reciprocal space">
      <header className="reciprocal-pane__head">
        <h2>Reciprocal space</h2>
      </header>
      {props.tools ? (
        <div className="reciprocal-tools no-print">
          <SegmentedControl
            size="small"
            aria-label="What is kept of the transform"
            options={MASK_OPTIONS}
            value={kind}
            onValueChange={(value) => {
              const next = MASK_KINDS.find((candidate) => candidate === value);
              if (next !== undefined) setMaskKind(next);
            }}
          />
          {disk ? (
            <label className="reciprocal-tools__field">
              Radius
              <NumberInput
                size="small"
                buttons={false}
                integer
                min={MASK_RADIUS_RANGE.min}
                max={MASK_RADIUS_RANGE.max}
                value={radius}
                onChange={setMaskRadius}
                ariaLabel="Radius of the disk, in pixels"
                style={{ width: '4.5rem' }}
                rightElement={
                  <span className="reciprocal-tools__unit">px</span>
                }
              />
            </label>
          ) : null}
          <SegmentedControl
            size="small"
            aria-label="What the transform shows"
            options={VIEW_OPTIONS}
            value={show}
            onValueChange={(value) => {
              const next = SPECTRUM_VIEWS.find(
                (candidate) => candidate === value,
              );
              if (next !== undefined) setSpectrumView(next);
            }}
          />
          <SegmentedControl
            size="small"
            aria-label="How much the middle of the transform is enlarged"
            options={ZOOM_OPTIONS}
            value={zoom}
            onValueChange={(value) => {
              const next = ZOOMS.find((candidate) => candidate === value);
              if (next !== undefined) setZoom(next);
            }}
          />
          <label className="reciprocal-tools__field reciprocal-tools__slider">
            Contrast
            <Slider
              min={CONTRAST_RANGE.min}
              max={CONTRAST_RANGE.max}
              stepSize={1}
              value={contrast}
              labelRenderer={false}
              onChange={setContrast}
              aria-label="Decades of amplitude shown"
            />
          </label>
        </div>
      ) : null}
      <FieldFigure
        pixels={pixels}
        label={`The ${show} of the Fourier transform`}
        pixelated
        cursor={disk ? 'crosshair' : 'pointer'}
        testId="reciprocal-transform"
        zoom={Number(zoom)}
        onDown={(pointer) => {
          if (disk) setLiveRadius(edge(pointer));
        }}
        onMove={(pointer) => {
          setHover(offset(pointer));
          if (disk && liveRadius !== null) setLiveRadius(edge(pointer));
        }}
        onUp={(pointer) => {
          if (disk) {
            if (liveRadius !== null) setMaskRadius(edge(pointer));
            setLiveRadius(null);
            return;
          }
          pickSpot(snapToPeak(transform, offset(pointer)));
        }}
        onLeave={() => {
          setHover(null);
        }}
      >
        {reciprocal === null ? null : (
          <>
            <VectorArrow
              to={scaled(reciprocal.a)}
              label="a*"
              which="a"
              zoom={Number(zoom)}
            />
            <VectorArrow
              to={scaled(reciprocal.b)}
              label="b*"
              which="b"
              zoom={Number(zoom)}
            />
          </>
        )}
        <MaskOutline mask={{ kind, radius: liveRadius ?? radius, spots }} />
      </FieldFigure>
      <SpotReadout spot={hover} vectors={vectors} kind={kind} />
    </section>
  );
}

/** A reciprocal vector in pixels of the transform. */
function scaled(vector: { x: number; y: number }): { x: number; y: number } {
  return { x: vector.x * FIELD_CENTRE * 2, y: vector.y * FIELD_CENTRE * 2 };
}
