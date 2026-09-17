/**
 * The viewer the rest of the site drives: a structure, a cell, a set of symmetry
 * elements, and an operation applied to the first of them.
 *
 * Nothing here parses a space group or expands an orbit. The atoms arrive in
 * their final places, because molstar's own expansion neither wraps into the
 * cell nor deduplicates a special position, and falls back to `P 1` without a
 * word on settings this site ships.
 */

import type { PlayOptions } from './animate.ts';
import {
  playOperation,
  resetOperation,
  setOperationFraction,
} from './animate.ts';
import { mergeDrawings, withoutDrawings } from './drawingSet.ts';
import type { ViewerOptions } from './plugin.ts';
import { ViewerPlugin } from './plugin.ts';
import type { CellStyle } from './renderCell.ts';
import type { ElementLayerStyle } from './renderElements.ts';
import type { StructureStyle } from './renderStructure.ts';
import { drawCell, drawElements, drawStructure } from './sceneParts.ts';
import type {
  CellRepeat,
  SymmetryDrawing,
  UnitCell,
  ViewerAtom,
  ViewerOperation,
} from './types.ts';

/**
 * Create a viewer inside `container` and start initialising it.
 *
 * @param container - An element with `position: relative`; molstar inserts its
 *   own canvas into it.
 * @param options - See {@link ViewerOptions}.
 * @returns A handle that is safe to dispose immediately.
 */
export function createViewer(
  container: HTMLElement,
  options: ViewerOptions = {},
): Viewer {
  return new Viewer(container, options);
}

/**
 * Everything the site draws, on one canvas: the lifecycle, the camera and the
 * hover readout come from {@link ViewerPlugin}, the scene is here.
 */
export class Viewer extends ViewerPlugin {
  #drawings: readonly SymmetryDrawing[] = [];
  #elementStyle: ElementLayerStyle = {};

  /** The symmetry elements drawn right now, in drawing order. */
  get elements(): readonly SymmetryDrawing[] {
    return this.#drawings;
  }

  /**
   * Replace the atoms on screen.
   *
   * @param atoms - The whole scene, expanded and repeated already, in Cartesian
   *   ångström. An empty list clears them.
   * @param style - See {@link StructureStyle}.
   */
  showStructure(
    atoms: readonly ViewerAtom[],
    style?: StructureStyle,
  ): Promise<void> {
    return this.run((plugin) => drawStructure(plugin, atoms, style));
  }

  /** Remove the atoms, leaving the cell and the elements in place. */
  hideStructure(): Promise<void> {
    return this.run((plugin) => drawStructure(plugin, []));
  }

  /**
   * Replace the unit cell box, and the stack of cells around it.
   *
   * @param cell - The six cell parameters, or `null` to draw none.
   * @param repeat - Cells along a, b and c.
   * @param style - See {@link CellStyle}.
   */
  showCell(
    cell: UnitCell | null,
    repeat: CellRepeat = [1, 1, 1],
    style?: CellStyle,
  ): Promise<void> {
    return this.run((plugin) => drawCell(plugin, cell, repeat, style));
  }

  /** Remove the cell. */
  hideCell(): Promise<void> {
    return this.run((plugin) => drawCell(plugin, null));
  }

  /**
   * Replace every drawn symmetry element.
   *
   * @param drawings - The elements; an empty list clears them.
   * @param style - See {@link ElementLayerStyle}; kept for later edits.
   */
  showElements(
    drawings: readonly SymmetryDrawing[],
    style?: ElementLayerStyle,
  ): Promise<void> {
    if (style !== undefined) this.#elementStyle = style;
    this.#drawings = [...drawings];
    return this.#redrawElements();
  }

  /**
   * Draw these elements as well, replacing any already drawn under the same id.
   *
   * @param drawings - What to add.
   */
  addElements(drawings: readonly SymmetryDrawing[]): Promise<void> {
    this.#drawings = mergeDrawings(this.#drawings, drawings);
    return this.#redrawElements();
  }

  /**
   * Stop drawing these elements, leaving the rest alone.
   *
   * @param ids - The ids to remove; an id that is not drawn is ignored.
   */
  removeElements(ids: readonly string[]): Promise<void> {
    this.#drawings = withoutDrawings(this.#drawings, ids);
    return this.#redrawElements();
  }

  /** Remove every symmetry element. */
  hideElements(): Promise<void> {
    this.#drawings = [];
    return this.#redrawElements();
  }

  /**
   * Apply an operation to the structure, once, and leave it where it lands.
   *
   * The elements stay where they are: an axis that turned with the molecule
   * would prove nothing.
   *
   * @param operation - What to apply.
   * @param options - See {@link PlayOptions}.
   */
  playOperation(
    operation: ViewerOperation,
    options?: PlayOptions,
  ): Promise<void> {
    return this.run((plugin) => playOperation(plugin, operation, options));
  }

  /**
   * Hold the structure part-way through an operation, for a slider.
   *
   * @param operation - What is being applied.
   * @param fraction - How far through, 0 to 1.
   */
  setOperationFraction(
    operation: ViewerOperation,
    fraction: number,
  ): Promise<void> {
    return this.run((plugin) => {
      setOperationFraction(plugin, operation, fraction);
    });
  }

  /** Put the structure back where it started. */
  resetOperation(): Promise<void> {
    return this.run((plugin) => {
      resetOperation(plugin);
    });
  }

  #redrawElements(): Promise<void> {
    const drawings = this.#drawings;
    const style = this.#elementStyle;
    return this.run((plugin) => drawElements(plugin, drawings, style));
  }
}
