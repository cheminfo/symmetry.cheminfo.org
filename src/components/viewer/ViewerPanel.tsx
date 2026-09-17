/**
 * The 3D view: what surrounds the canvas, and what to say when there cannot be
 * one.
 *
 * Two things are settled before molstar is touched. The WebGL probe runs first,
 * because molstar ships no canvas or SVG fallback and a locked-down school
 * machine would otherwise get a blank rectangle with no explanation. And the
 * canvas is a `React.lazy` boundary, so the pages that never show 3D — the plane
 * patterns, the cheatsheet, most of the catalogue — never download it.
 */

import { Callout, Spinner, SpinnerSize } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { Suspense, lazy, useState } from 'react';
// From react-cheminfo's orbital entry point rather than the viewer barrel: the
// probe imports nothing, while the barrel pulls molstar in, which is exactly
// what asking first exists to avoid.
import { probeViewerCapability } from 'react-cheminfo/orbital';

import type { ViewerScene } from './viewerScene.ts';

const ViewerCanvas = lazy(async () => {
  const module = await import('./ViewerCanvas.tsx');
  return { default: module.ViewerCanvas };
});

/** Props of {@link ViewerPanel}. */
export interface ViewerPanelProps {
  /** What to show. */
  scene: ViewerScene;
  /**
   * How tall the canvas is, in pixels.
   * @default 420
   */
  height?: number;
  /**
   * Scene background, `#rrggbb`.
   * @default '#ffffff'
   */
  background?: string;
  /**
   * One line under the canvas — what is on screen, or where it came from.
   * @default undefined
   */
  caption?: string;
  /**
   * What to say instead of a canvas when the scene holds no atoms.
   * @default 'Nothing to show yet.'
   */
  emptyMessage?: string;
}

/**
 * The 3D scene, with its failure and no-WebGL messages.
 *
 * @param props - See {@link ViewerPanelProps}.
 * @returns The viewer, or an explanation of why this machine cannot show one.
 */
export function ViewerPanel(props: ViewerPanelProps): ReactElement {
  const {
    scene,
    height = 420,
    background,
    caption,
    emptyMessage = 'Nothing to show yet.',
  } = props;
  const [capability] = useState(probeViewerCapability);
  const [failure, setFailure] = useState<string | null>(null);

  if (!capability.supported) {
    return (
      <Callout intent="warning" title="No 3D on this machine" icon="desktop">
        {capability.message} The operations, the character tables, the exercises
        and the cheatsheet all work without it.
      </Callout>
    );
  }

  return (
    <div style={rootStyle}>
      <div style={{ ...frameStyle, height }}>
        {scene.atoms.length === 0 ? (
          <div style={noticeStyle}>{emptyMessage}</div>
        ) : (
          <Suspense fallback={<ViewerSkeleton />}>
            <ViewerCanvas
              scene={scene}
              background={background}
              onFailure={setFailure}
            />
          </Suspense>
        )}
      </div>
      {caption !== undefined && <div style={captionStyle}>{caption}</div>}
      {failure !== null && (
        <Callout intent="danger" title="This scene could not be drawn" compact>
          {failure}
        </Callout>
      )}
    </div>
  );
}

function ViewerSkeleton(): ReactElement {
  return (
    <div style={noticeStyle}>
      <Spinner size={SpinnerSize.STANDARD} />
      <span>Loading the 3D viewer…</span>
    </div>
  );
}

const rootStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
} as const;

const frameStyle = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
} as const;

const noticeStyle = {
  display: 'flex',
  height: '100%',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  color: 'var(--text-muted)',
  fontSize: 13,
} as const;

const captionStyle = { color: 'var(--text-muted)', fontSize: 12 } as const;
