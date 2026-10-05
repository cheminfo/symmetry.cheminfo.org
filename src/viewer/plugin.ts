/**
 * Lifecycle of one molstar canvas: created now, disposed whenever, every call
 * queued behind initialisation.
 *
 * The constructor is **synchronous** on purpose. React 19 runs an effect, its
 * cleanup and the effect again on every mount in development, so an `await`ed
 * constructor hands the cleanup nothing to dispose and leaks a WebGL context per
 * mount — browsers drop the oldest after about sixteen, and the viewer silently
 * goes blank. Returning the handle immediately means `dispose()` can always be
 * called, even before initialisation has finished.
 *
 * molstar's own UI is never mounted: every control on this site is ours.
 */

import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';
import { MolstarPlugin, setSpin } from 'react-cheminfo/molstar/core';

import { DEFAULT_CAMERA_DURATION, focusPoint, resetCamera } from './camera.ts';
import { subscribeViewerHover } from './hover.ts';
import type { ViewOrientation } from './orientation.ts';
import type { Point3 } from './types.ts';

/** Settings fixed for the life of a viewer. */
export interface ViewerOptions {
  /**
   * Scene background, as `#rrggbb`.
   * @default '#ffffff'
   */
  background?: string;
}

/** One molstar canvas, and the queue everything drawn on it goes through. */
export class ViewerPlugin {
  readonly #plugin: MolstarPlugin;

  /** Resolves once the canvas exists; every call awaits it internally. */
  readonly ready: Promise<void>;

  constructor(container: HTMLElement, options: ViewerOptions = {}) {
    this.#plugin = new MolstarPlugin(container, {
      background: options.background,
      // Replacing a scene commits several times, and molstar's own default
      // glides the camera on each, so the structure appears to drift into
      // place. Reframing is right; animating it between two unrelated
      // structures is not.
      cameraResetDurationMilliseconds: 0,
    });
    this.ready = this.#plugin.ready;
  }

  /** Whether {@link dispose} has been called. */
  get disposed(): boolean {
    return this.#plugin.disposed;
  }

  /**
   * Wait for initialisation, then run `action` on the plugin.
   *
   * @param action - What to do with the molstar context.
   * @returns Nothing once the viewer has been disposed — before the call or
   *   while `action` was still running. An initialisation failure, and any
   *   error `action` throws while the viewer is alive, still reach the caller.
   */
  run(action: (plugin: PluginContext) => void | Promise<void>): Promise<void> {
    return this.#plugin.run(action).then(() => undefined);
  }

  /**
   * Frame everything on screen.
   *
   * @param durationMs - Transition length; 0 jumps.
   * @param orientation - Where to look from, from `sceneOrientation`. Left out,
   *   the camera keeps the direction it is already pointing.
   */
  resetCamera(
    durationMs = DEFAULT_CAMERA_DURATION,
    orientation?: ViewOrientation,
  ): Promise<void> {
    return this.run((plugin) => {
      resetCamera(plugin, durationMs, orientation);
    });
  }

  /**
   * Zoom onto one point of the scene.
   *
   * @param centre - What to frame, Cartesian ångström.
   * @param radius - Radius of the ball to fit, ångström.
   * @param durationMs - Transition length; 0 jumps.
   * @param orientation - Where to look from; the current direction when absent.
   */
  focus(
    centre: Point3,
    radius: number,
    durationMs = DEFAULT_CAMERA_DURATION,
    orientation?: ViewOrientation,
  ): Promise<void> {
    return this.run((plugin) => {
      focusPoint(plugin, centre, radius, durationMs, orientation);
    });
  }

  /**
   * Turn the automatic spin on or off. It moves the camera, never the object:
   * showing that a molecule maps onto itself is a different button.
   *
   * @param spinning - Whether the scene should keep turning.
   * @param speed - molstar's own spin unit.
   */
  setSpin(spinning: boolean, speed = 1): Promise<void> {
    return this.run((plugin) => {
      setSpin(plugin, spinning, speed);
    });
  }

  /**
   * Report what the pointer rests on, by the label its drawing carries.
   *
   * @param listener - Called with the label, or `null` over nothing.
   * @returns A function that stops the reporting; safe to call at any time.
   */
  onHover(listener: (label: string | null) => void): () => void {
    return this.#plugin.subscribe((plugin) =>
      subscribeViewerHover(plugin, listener),
    );
  }

  /** Re-read the container's size. Call from a `ResizeObserver`. */
  handleResize(): void {
    this.#plugin.handleResize();
  }

  /**
   * Tear the canvas down and release its WebGL context. Idempotent, and safe to
   * call before initialisation has finished.
   */
  dispose(): void {
    this.#plugin.dispose();
  }
}
