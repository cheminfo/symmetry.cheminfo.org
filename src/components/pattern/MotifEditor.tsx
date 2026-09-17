import { Button } from '@blueprintjs/core';
import type { PointerEvent, ReactElement } from 'react';

import { selectMotif } from '../../state/index.ts';
import { MOTIFS } from '../plane/index.ts';

import type { DrawnPoint } from './drawnMotif.ts';
import {
  MAX_DRAWN_POINTS,
  MIN_DRAWN_POINTS,
  decodeDrawnMotif,
  encodeDrawnMotif,
  isDrawnMotifId,
} from './drawnMotif.ts';

import './pattern.css';

/** What {@link MotifEditor} needs. */
export interface MotifEditorProps {
  /** What `?motif=` carries: a shipped id, a drawing, or `null`. */
  readonly motifId: string | null;
}

/** Side of the pad, in its own units. */
const PAD = 100;

/** Where the pad's guide lines run, in fractions of the cell. */
const GUIDES = [0.25, 0.5, 0.75];

/**
 * The shape the group repeats: one of four asymmetric ones, or one the student
 * draws corner by corner.
 *
 * A drawn polygon goes into the address, so a pattern somebody made is a link
 * they can hand out. Every shipped motif is asymmetric on purpose: a motif with
 * a mirror of its own gives the drawing a larger group than the one it was
 * tiled with, and p1 then looks like pm.
 * @param props - The motif on screen.
 * @returns The picker and the pad.
 */
export function MotifEditor(props: MotifEditorProps): ReactElement {
  const { motifId } = props;
  const drawing = isDrawnMotifId(motifId);
  const points = decodeDrawnMotif(motifId) ?? [];
  const full = points.length >= MAX_DRAWN_POINTS;

  function place(event: PointerEvent<SVGSVGElement>): void {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width === 0 || box.height === 0 || full) return;
    selectMotif(
      encodeDrawnMotif([
        ...points,
        [
          (event.clientX - box.left) / box.width,
          1 - (event.clientY - box.top) / box.height,
        ],
      ]),
    );
  }

  return (
    <div className="chip-bar">
      <div className="chip-row">
        <span className="chip-row__label">Motif</span>
        <div className="chip-row__chips">
          {MOTIFS.map((motif) => (
            <button
              key={motif.id}
              type="button"
              className="chip"
              aria-pressed={!drawing && (motifId ?? MOTIFS[0]?.id) === motif.id}
              title={motif.description}
              onClick={() => {
                selectMotif(motif.id);
              }}
            >
              {motif.name}
            </button>
          ))}
          <button
            type="button"
            className="chip"
            aria-pressed={drawing}
            title="Draw a shape of your own, corner by corner."
            onClick={() => {
              selectMotif(encodeDrawnMotif([]));
            }}
          >
            Draw
          </button>
        </div>
      </div>
      {drawing ? (
        <>
          <svg
            className="motif-pad"
            viewBox={`0 0 ${PAD} ${PAD}`}
            role="img"
            aria-label="Drawing pad: click to place a corner"
            onPointerDown={place}
          >
            {GUIDES.map((guide) => (
              <g key={guide} className="motif-pad__grid">
                <line x1={guide * PAD} y1={0} x2={guide * PAD} y2={PAD} />
                <line x1={0} y1={guide * PAD} x2={PAD} y2={guide * PAD} />
              </g>
            ))}
            {points.length >= MIN_DRAWN_POINTS ? (
              <polygon className="motif-pad__shape" points={screen(points)} />
            ) : (
              <polyline className="motif-pad__lead" points={screen(points)} />
            )}
            {points.map((point) => (
              <circle
                key={`${point[0]},${point[1]}`}
                className="motif-pad__vertex"
                cx={point[0] * PAD}
                cy={(1 - point[1]) * PAD}
                r={2.5}
              />
            ))}
          </svg>
          <div className="chip-row__chips">
            <Button
              size="small"
              icon="undo"
              text="Undo"
              disabled={points.length === 0}
              onClick={() => {
                selectMotif(encodeDrawnMotif(points.slice(0, -1)));
              }}
            />
            <Button
              size="small"
              icon="eraser"
              text="Clear"
              disabled={points.length === 0}
              onClick={() => {
                selectMotif(encodeDrawnMotif([]));
              }}
            />
          </div>
          <p className="plane-note">{advice(points.length, full)}</p>
        </>
      ) : null}
    </div>
  );
}

/** What to do next, in one line. */
function advice(count: number, full: boolean): string {
  if (count < MIN_DRAWN_POINTS) {
    return `Click the pad to place a corner. ${MIN_DRAWN_POINTS} corners make a shape.`;
  }
  if (full) return `${MAX_DRAWN_POINTS} corners is all a link can carry.`;
  return 'Keep the shape lopsided: a motif with a mirror of its own hides the group.';
}

/** The pad's own coordinates, which run downwards where the cell runs up. */
function screen(points: readonly DrawnPoint[]): string {
  return points
    .map((point) => `${point[0] * PAD},${(1 - point[1]) * PAD}`)
    .join(' ');
}
