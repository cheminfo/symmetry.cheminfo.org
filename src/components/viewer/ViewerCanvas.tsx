/**
 * The molstar canvas, and the far side of the lazy boundary.
 *
 * This is the only module in `src/components` that reaches `src/viewer/index.ts`
 * and so the only one that pulls molstar's 2.8 MB chunk in. `ViewerPanel`
 * imports it through `React.lazy`, so a page that shows no 3D never downloads
 * it.
 *
 * Every effect below lists exactly what it reads, so a page that keeps its scene
 * stable redraws only the part that changed: toggling one mirror does not
 * rebuild the structure, and moving the pointer does not redraw anything.
 */

import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { Viewer } from '../../viewer/index.ts';
import { createViewer } from '../../viewer/index.ts';

import type { ViewerScene } from './viewerScene.ts';

/** Props of {@link ViewerCanvas}. */
export interface ViewerCanvasProps {
  /** What to show. */
  scene: ViewerScene;
  /**
   * Scene background, `#rrggbb`.
   * @default '#ffffff'
   */
  background?: string;
  /**
   * Called whenever drawing fails, with one sentence, or `null` once it works
   * again.
   * @default undefined
   */
  onFailure?: (message: string | null) => void;
}

/**
 * Draw the scene, and say what the pointer rests on.
 *
 * @param props - See {@link ViewerCanvasProps}.
 * @returns The canvas and its readout.
 */
export function ViewerCanvas(props: ViewerCanvasProps): ReactElement {
  const { scene, background, onFailure } = props;
  const {
    atoms,
    cell = null,
    repeat,
    representation,
    elements,
    labels,
    spinning = false,
    play = null,
  } = scene;
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // The viewer is not React state: it is an external resource the effects below
  // reach through this handle. Putting it in state would set state inside an
  // effect, and every draw would then cost an extra render.
  const held = useRef<Viewer | null>(null);

  // Kept in a ref as well, so a page passing an inline callback does not redraw
  // the whole scene on every render.
  const failure = useRef(onFailure);
  useEffect(() => {
    failure.current = onFailure;
  }, [onFailure]);

  // A callback ref, so the viewer is created by the element arriving; the
  // effects that draw are declared after this one and so run after it, and
  // every one of them lists `container` so a remount redraws.
  useEffect(() => {
    if (container === null) return;
    const created = createViewer(container, { background });
    held.current = created;
    const observer = new ResizeObserver(() => {
      created.handleResize();
    });
    observer.observe(container);
    return () => {
      held.current = null;
      observer.disconnect();
      created.dispose();
    };
  }, [container, background]);

  useEffect(() => {
    const viewer = held.current;
    if (viewer === null) return;
    return viewer.onHover(setHovered);
  }, [container, background]);

  useEffect(() => {
    const viewer = held.current;
    if (viewer === null) return;
    void report(
      failure,
      (async () => {
        await viewer.showStructure(atoms, { representation });
        await viewer.showCell(cell, repeat);
        await viewer.resetCamera(0);
      })(),
    );
  }, [container, background, atoms, cell, repeat, representation]);

  useEffect(() => {
    const viewer = held.current;
    if (viewer === null) return;
    void report(failure, viewer.showElements(elements ?? [], { labels }));
  }, [container, background, elements, labels]);

  useEffect(() => {
    const viewer = held.current;
    if (viewer === null) return;
    void report(failure, viewer.setSpin(spinning));
  }, [container, background, spinning]);

  // The nonce is the cue that replays the same operation; the operation itself
  // is in the list so that changing it applies the new one.
  const operation = play?.operation ?? null;
  const duration = play?.durationMs;
  const nonce = play?.nonce ?? null;
  useEffect(() => {
    const viewer = held.current;
    if (viewer === null) return;
    if (operation === null || nonce === null) {
      void report(failure, viewer.resetOperation());
      return;
    }
    void report(
      failure,
      viewer.playOperation(operation, { durationMs: duration }),
    );
  }, [container, background, operation, duration, nonce]);

  return (
    <div style={rootStyle}>
      <div ref={setContainer} style={canvasStyle} data-testid="symmetry-3d" />
      {hovered !== null && <div style={readoutStyle}>{hovered}</div>}
    </div>
  );
}

/** Report a failure as one sentence, and clear it once the next draw works. */
async function report(
  listener: { current?: (message: string | null) => void },
  work: Promise<void>,
): Promise<void> {
  try {
    await work;
    listener.current?.(null);
  } catch (error) {
    listener.current?.(
      error instanceof Error ? error.message : 'The scene could not be drawn.',
    );
  }
}

const rootStyle = {
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: 0,
} as const;

const canvasStyle = { position: 'absolute', inset: 0 } as const;

/*
 * The readout sits over the canvas rather than beside it, so naming an axis does
 * not reflow the page while the pointer moves.
 */
const readoutStyle = {
  position: 'absolute',
  right: 8,
  bottom: 8,
  left: 8,
  padding: '3px 8px',
  borderRadius: 6,
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 12,
  opacity: 0.92,
  pointerEvents: 'none',
  textAlign: 'right',
} as const;
