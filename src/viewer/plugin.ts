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

import { PluginViewModel } from 'molstar/lib/extensions/plugin/view-model.js';
import type { PluginContext } from 'molstar/lib/mol-plugin/context.js';
// Lowercased on import: it is a factory, not a constructor.
import { DefaultPluginSpec as defaultPluginSpec } from 'molstar/lib/mol-plugin/spec.js';
import { Color } from 'molstar/lib/mol-util/color/color.js';

import {
  DEFAULT_CAMERA_DURATION,
  focusPoint,
  resetCamera,
  setSpin,
} from './camera.ts';
import { subscribeHover } from './hover.ts';
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
  readonly #model: PluginViewModel;
  #disposed = false;

  /** Resolves once the canvas exists; every call awaits it internally. */
  readonly ready: Promise<void>;

  constructor(container: HTMLElement, options: ViewerOptions = {}) {
    // tokens-ok: the canvas clear colour is a scene value, not a page surface.
    const { background = '#ffffff' } = options;
    const spec = defaultPluginSpec();
    this.#model = new PluginViewModel({
      spec: {
        ...spec,
        canvas3d: {
          ...spec.canvas3d,
          renderer: { backgroundColor: Color.fromHexStyle(background) },
          camera: { helper: { axes: { name: 'off', params: {} } } },
          // Replacing a scene commits several times, and molstar's own default
          // glides the camera on each, so the structure appears to drift into
          // place. Reframing is right; animating it between two unrelated
          // structures is not.
          cameraResetDurationMs: 0,
        },
      },
    });
    this.#model.mount(container);
    this.ready = this.#model.initialized;
  }

  /** Whether {@link dispose} has been called. */
  get disposed(): boolean {
    return this.#disposed;
  }

  /**
   * Wait for initialisation, then run `action` on the plugin.
   *
   * @param action - What to do with the molstar context.
   * @returns Nothing once the viewer has been disposed — before the call or
   *   while `action` was still running. An initialisation failure, and any
   *   error `action` throws while the viewer is alive, still reach the caller.
   */
  async run(
    action: (plugin: PluginContext) => void | Promise<void>,
  ): Promise<void> {
    if (this.#disposed) return;
    await this.ready;
    if (this.#disposed) return;
    try {
      await action(this.#model.plugin);
    } catch (error) {
      if (this.#disposed) return;
      throw error;
    }
  }

  /**
   * Frame everything on screen.
   *
   * @param durationMs - Transition length; 0 jumps.
   */
  resetCamera(durationMs = DEFAULT_CAMERA_DURATION): Promise<void> {
    return this.run((plugin) => {
      resetCamera(plugin, durationMs);
    });
  }

  /**
   * Zoom onto one point of the scene.
   *
   * @param centre - What to frame, Cartesian ångström.
   * @param radius - Radius of the ball to fit, ångström.
   * @param durationMs - Transition length; 0 jumps.
   */
  focus(
    centre: Point3,
    radius: number,
    durationMs = DEFAULT_CAMERA_DURATION,
  ): Promise<void> {
    return this.run((plugin) => {
      focusPoint(plugin, centre, radius, durationMs);
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
    let stop: (() => void) | null = null;
    let cancelled = false;
    void this.run((plugin) => {
      if (cancelled) return;
      stop = subscribeHover(plugin, listener);
    });
    return () => {
      cancelled = true;
      stop?.();
      stop = null;
    };
  }

  /** Re-read the container's size. Call from a `ResizeObserver`. */
  handleResize(): void {
    if (this.#disposed) return;
    this.#model.plugin.handleResize();
  }

  /**
   * Tear the canvas down and release its WebGL context. Idempotent, and safe to
   * call before initialisation has finished.
   */
  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    // `mount` creates the canvas synchronously, so the context exists even when
    // initialisation went on to fail; releasing it is what stops the browser
    // dropping an older viewer's. A rejected `ready` must not escape here
    // either — nobody is left to handle it.
    void this.ready
      .catch(() => undefined)
      .then(() => {
        this.#model.plugin.dispose();
      });
  }
}
