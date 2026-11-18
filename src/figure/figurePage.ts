/**
 * Where the host protocol, which lives as long as the shell (`tool.ts`), meets
 * the viewer page, which mounts only while it is open: the page says how its
 * figure is taken, and a camera a figure carried waits here for the page to
 * draw its crystal.
 */

import { signal } from '@preact/signals-react';
import type { FigureStates } from 'react-cheminfo/core';
import type { Molecule3DCamera } from 'react-cheminfo/molecule3d';

/** How the page on screen gives its figure. */
export interface FigurePage {
  /** The figure, as an SVG document holding the picture of the view. */
  readonly svg: () => Promise<string | undefined>;
  /** What the picture taken last carries, or `undefined` while there is none. */
  readonly states: () => FigureStates | undefined;
}

let page: FigurePage | null = null;

/**
 * The camera of the figure a host handed back last, for the page to put back
 * when it draws that figure's crystal.
 */
export const figureCamera = signal<Molecule3DCamera | null>(null);

/**
 * Say how the page on screen gives its figure.
 * @param next - The page.
 * @returns Forget it, once the page is gone.
 */
export function registerFigurePage(next: FigurePage): () => void {
  page = next;
  return () => {
    if (page === next) page = null;
  };
}

/**
 * The figure of the page on screen.
 * @returns The SVG, or `undefined` when no crystal is on screen.
 */
export function pageFigureSvg(): Promise<string | undefined> {
  return page?.svg() ?? Promise.resolve(undefined);
}

/**
 * What a figure of the page on screen carries.
 * @returns The state, or `undefined` when there is nothing to carry.
 */
export function pageFigureStates(): FigureStates | undefined {
  return page?.states();
}
