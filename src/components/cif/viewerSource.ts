/**
 * What the viewer is showing, and the three ways something comes to be shown:
 * a library structure the address names, a file somebody opened, and a figure
 * a drawing or a document handed back.
 *
 * The text always ends up in `data.crystal`; `view.viewer.structureId` only
 * says whether that text is a library entry, so the address can name it.
 */

import { batch } from '@preact/signals-react';
import { errorMessage } from 'react-cheminfo/core';

import { openCif } from '../../crystal/openCif.ts';
import { structureById, structureCif } from '../../data/structures/index.ts';
import type { OpenedCrystalFigure } from '../../figure/crystalFigure.ts';
import { figureCamera } from '../../figure/figurePage.ts';
import {
  failLoad,
  selectViewerStructure,
  setActiveTab,
  setDisplayFlag,
  setLoaded,
  setViewerBonds,
  setViewerPacking,
  setViewerSupercell,
  startLoad,
  state,
} from '../../state/index.ts';

/** The file the viewer shows. */
export interface ViewerSource {
  /** What to call it. */
  readonly name: string;
  /** The CIF. */
  readonly text: string;
  /** The library structure it is, or `null` for a file somebody opened. */
  readonly structureId: string | null;
}

/**
 * What the viewer shows: the library structure the address names, else the
 * file last opened. Reads signals.
 * @returns The source, or `null` for an empty viewer.
 */
export function viewerSource(): ViewerSource | null {
  const id = state.view.viewer.structureId.value;
  if (id !== null) {
    const entry = structureById(id);
    // A name the library does not hold opens nothing, never the last file.
    if (entry === undefined) return null;
    return { name: entry.title, text: structureCif(id), structureId: id };
  }
  const text = state.data.crystal.text.value;
  if (text === '') return null;
  return { name: state.data.crystal.name.value, text, structureId: null };
}

/**
 * Show a file somebody opened, if it can be read.
 * @param text - The CIF.
 * @param fileName - What the file is called.
 * @returns `null` once it is shown, or the sentence saying why it is not; what
 * was on screen then stays there.
 */
export function openViewerFile(text: string, fileName: string): string | null {
  const opened = openCif(text, fileName);
  if (typeof opened === 'string') return opened;
  pending?.abort();
  batch(() => {
    setLoaded(state.data.crystal, fileName, opened.draft.name, text);
    selectViewerStructure(null);
    state.view.viewer.cifUrl.value = null;
    figureCamera.value = null;
  });
  return null;
}

/** The fetch of a CIF by address still running, if any. */
let pending: AbortController | null = null;

/**
 * Fetch a CIF by its address and show it: what `?cif=` asks for. Until it
 * arrives `data.crystal` says it is loading, and a fetch or a file that fails
 * leaves its sentence there. A newer request, a dropped file or an example
 * supersedes it.
 * @param url - The address of the CIF.
 * @returns Once it is shown, or has failed.
 */
export async function openViewerUrl(url: string): Promise<void> {
  pending?.abort();
  const controller = new AbortController();
  pending = controller;
  const fileName = cifFileName(url);
  batch(() => {
    selectViewerStructure(null);
    state.view.viewer.cifUrl.value = url;
    figureCamera.value = null;
    startLoad(state.data.crystal, url, fileName);
  });
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(
        `The CIF could not be fetched: ${url} answered ${response.status}.`,
      );
    }
    const text = await response.text();
    if (controller.signal.aborted) return;
    const opened = openCif(text, fileName);
    if (typeof opened === 'string') {
      failLoad(state.data.crystal, opened);
      return;
    }
    setLoaded(state.data.crystal, url, opened.draft.name, text);
  } catch (error) {
    if (!controller.signal.aborted) {
      failLoad(state.data.crystal, errorMessage(error));
    }
  } finally {
    if (pending === controller) pending = null;
  }
}

/**
 * What a CIF fetched by address is called: the last part of its path that is
 * not `cif` itself, so `/v1/entries/7050902/cif` is `7050902.cif`.
 * @param url - The address.
 * @returns The file name.
 */
export function cifFileName(url: string): string {
  const parts = URL.canParse(url) ? new URL(url).pathname.split('/') : [];
  for (let index = parts.length - 1; index >= 0; index--) {
    const part = decodeURIComponent(parts[index] ?? '');
    if (part !== '' && part.toLowerCase() !== 'cif') {
      return /\.cif$/i.test(part) ? part : `${part}.cif`;
    }
  }
  return 'structure.cif';
}

/**
 * Show a library structure.
 * @param id - Its id.
 */
export function openViewerExample(id: string): void {
  pending?.abort();
  batch(() => {
    selectViewerStructure(id);
    state.view.viewer.cifUrl.value = null;
    figureCamera.value = null;
  });
}

/**
 * Show a figure handed back, as it was drawn.
 * @param opened - What the figure carries.
 * @throws {Error} When its CIF cannot be read: nothing on screen changes then.
 */
export function openViewerFigure(opened: OpenedCrystalFigure): void {
  const { figure, view } = opened;
  const read = openCif(figure.cif, figure.name);
  if (typeof read === 'string') throw new Error(read);
  const fromLibrary =
    figure.structureId !== null &&
    structureById(figure.structureId) !== undefined &&
    structureCif(figure.structureId) === figure.cif;
  batch(() => {
    setActiveTab('viewer');
    setLoaded(state.data.crystal, figure.name, figure.name, figure.cif);
    selectViewerStructure(fromLibrary ? figure.structureId : null);
    state.view.viewer.cifUrl.value = null;
    setViewerSupercell(view.supercell);
    setViewerPacking(view.packing);
    setViewerBonds(view.bonds);
    setDisplayFlag('unitCell', view.unitCell);
    figureCamera.value = view.camera;
  });
}
