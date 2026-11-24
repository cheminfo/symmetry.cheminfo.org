/**
 * One square of the workbench: an image or a transform, painted on a canvas,
 * with lines drawn over it in the same pixel coordinates.
 *
 * The canvas is the field's own 256 × 256 pixels, scaled to the pane, and the
 * overlay is an SVG whose `viewBox` is those same pixels: pixel `i` spans `i`
 * to `i + 1`, so the centre of the field is at 128.5. A pointer is reported as
 * the pixel under it, which is what every reader of a click needs.
 */

import type {
  CSSProperties,
  PointerEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { useEffect, useRef } from 'react';

import { FIELD_SIZE } from '../../reciprocal/fourier.ts';

/** A pointer on the field, as the pixel under it. */
export interface FieldPointer {
  /** Column, 0 at the left. */
  column: number;
  /** Row, 0 at the top. */
  row: number;
  /** The event, for capture and buttons. */
  event: PointerEvent<SVGSVGElement>;
}

/** What {@link FieldFigure} needs. */
export interface FieldFigureProps {
  /** RGBA bytes, four per pixel, {@link FIELD_SIZE} squared pixels. */
  readonly pixels: Uint8ClampedArray;
  /** What a screen reader is told the figure shows. */
  readonly label: string;
  /** Whether each pixel stays a square when scaled, as a transform's should. */
  readonly pixelated?: boolean;
  /** Lines drawn over the field, in its pixel coordinates. */
  readonly children?: ReactNode;
  /**
   * How many times the middle of the field is enlarged: 2 shows its central
   * half, 4 its central quarter.
   * @default 1
   */
  readonly zoom?: number;
  /** The cursor over the field. */
  readonly cursor?: 'crosshair' | 'pointer';
  /** A name the end-to-end tests find the figure by. */
  readonly testId: string;
  /** A press on the field. */
  readonly onDown?: (pointer: FieldPointer) => void;
  /** A move over the field, pressed or not. */
  readonly onMove?: (pointer: FieldPointer) => void;
  /** The press let go. */
  readonly onUp?: (pointer: FieldPointer) => void;
  /** The pointer left the field. */
  readonly onLeave?: () => void;
}

/**
 * The figure.
 * @param props - See {@link FieldFigureProps}.
 * @returns The canvas and its overlay.
 */
export function FieldFigure(props: FieldFigureProps): ReactElement {
  const {
    pixels,
    label,
    pixelated,
    children,
    cursor,
    testId,
    zoom = 1,
    onDown,
    onMove,
    onUp,
    onLeave,
  } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (context === null || context === undefined) return;
    const copy = new Uint8ClampedArray(pixels);
    context.putImageData(new ImageData(copy, FIELD_SIZE, FIELD_SIZE), 0, 0);
  }, [pixels]);

  // What is on show: the central square of this side, in field pixels.
  const side = FIELD_SIZE / zoom;
  const first = (FIELD_SIZE - side) / 2;

  function at(event: PointerEvent<SVGSVGElement>): FieldPointer {
    const box = event.currentTarget.getBoundingClientRect();
    const scale = side / Math.max(box.width, 1);
    return {
      column: clamp(Math.floor(first + (event.clientX - box.left) * scale)),
      row: clamp(Math.floor(first + (event.clientY - box.top) * scale)),
      event,
    };
  }

  return (
    <div
      className="field-figure"
      data-testid={testId}
      style={{ '--field-zoom': zoom } as CSSProperties}
    >
      <canvas
        ref={canvasRef}
        className={
          pixelated
            ? 'field-figure__canvas field-figure__canvas--pixelated'
            : 'field-figure__canvas'
        }
        width={FIELD_SIZE}
        height={FIELD_SIZE}
        style={zoom === 1 ? undefined : enlarged(zoom)}
        role="img"
        aria-label={label}
      />
      <svg
        className="field-figure__overlay"
        viewBox={`${first} ${first} ${side} ${side}`}
        style={{ cursor: cursor ?? 'crosshair' }}
        aria-hidden="true"
        onPointerDown={
          onDown === undefined
            ? undefined
            : (event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                onDown(at(event));
              }
        }
        onPointerMove={
          onMove === undefined ? undefined : (event) => onMove(at(event))
        }
        onPointerUp={
          onUp === undefined ? undefined : (event) => onUp(at(event))
        }
        onPointerLeave={onLeave}
      >
        {children}
      </svg>
    </div>
  );
}

/** The canvas scaled about its centre, so the frame shows its middle. */
function enlarged(zoom: number): CSSProperties {
  const share = `${zoom * 100}%`;
  const shift = `${-(zoom - 1) * 50}%`;
  return {
    position: 'absolute',
    width: share,
    height: share,
    left: shift,
    top: shift,
  };
}

function clamp(pixel: number): number {
  return Math.min(Math.max(pixel, 0), FIELD_SIZE - 1);
}
