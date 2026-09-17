/**
 * Applying an operation to the structure, so a student watches it land back on
 * itself.
 *
 * The structure moves and the symmetry elements do not: an axis that turned with
 * the molecule would prove nothing. Moving it costs one GPU uniform per frame —
 * `Representation.State.transform` is written straight into the renderable — so
 * nothing is rebuilt and nothing is re-uploaded while the animation runs.
 */

import { Mat4 } from 'molstar/lib/mol-math/linear-algebra.js';
import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';

import type { Matrix4 } from './operationMatrix.ts';
import { IDENTITY_MATRIX4, operationAt } from './operationMatrix.ts';
import { structureRepresentation } from './renderStructure.ts';
import type { ViewerOperation } from './types.ts';

/** How an operation is played. */
export interface PlayOptions {
  /**
   * How long one application takes, milliseconds.
   * @default 900
   */
  durationMs?: number;
  /**
   * Called with the fraction played, 0 to 1, on every frame.
   * @default undefined
   */
  onProgress?: (fraction: number) => void;
}

/**
 * Play one application of an operation, and leave the structure where it lands.
 *
 * A second call cancels the first, so a student hammering the button never sees
 * two animations fight.
 *
 * @param plugin - The molstar context.
 * @param operation - What to apply.
 * @param options - See {@link PlayOptions}.
 * @returns Resolves when the operation has been applied in full, or as soon as
 *   a later call has taken over.
 */
export function playOperation(
  plugin: PluginContext,
  operation: ViewerOperation,
  options: PlayOptions = {},
): Promise<void> {
  const { durationMs = 900, onProgress } = options;
  const token = (tokens.get(plugin) ?? 0) + 1;
  tokens.set(plugin, token);
  if (durationMs <= 0) {
    setOperationFraction(plugin, operation, 1);
    onProgress?.(1);
    return Promise.resolve();
  }
  const started = now();
  return new Promise<void>((resolve) => {
    const step = (): void => {
      if (tokens.get(plugin) !== token) {
        resolve();
        return;
      }
      const fraction = Math.min(1, (now() - started) / durationMs);
      setOperationFraction(plugin, operation, fraction);
      onProgress?.(fraction);
      if (fraction < 1) globalThis.requestAnimationFrame(step);
      else resolve();
    };
    globalThis.requestAnimationFrame(step);
  });
}

/**
 * Hold the structure part-way through an operation, for a slider.
 *
 * @param plugin - The molstar context.
 * @param operation - What is being applied.
 * @param fraction - How far through, 0 to 1.
 */
export function setOperationFraction(
  plugin: PluginContext,
  operation: ViewerOperation,
  fraction: number,
): void {
  applyTransform(plugin, operationAt(operation, fraction));
}

/**
 * Put the structure back where it started, and stop any animation in flight.
 *
 * @param plugin - The molstar context.
 */
export function resetOperation(plugin: PluginContext): void {
  tokens.set(plugin, (tokens.get(plugin) ?? 0) + 1);
  applyTransform(plugin, IDENTITY_MATRIX4);
}

function applyTransform(plugin: PluginContext, matrix: Matrix4): void {
  const representation = structureRepresentation(plugin);
  if (representation === undefined) return;
  representation.setState({
    transform: Mat4.fromArray(Mat4.identity(), matrix as number[], 0),
  });
  plugin.canvas3d?.update(representation);
  plugin.canvas3d?.requestDraw();
}

function now(): number {
  return globalThis.performance.now();
}

/** The animation in flight per plugin; a new one invalidates the old. */
const tokens = new WeakMap<PluginContext, number>();
