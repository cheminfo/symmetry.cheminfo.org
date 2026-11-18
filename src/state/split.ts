/**
 * What the tutorial's row opens at, before anybody drags it.
 *
 * The share itself — its range, its clamping and the `split=` it travels in —
 * is the family's, in `react-cheminfo/core`; all that is written here is which
 * of the two halves the page leads with.
 */

/**
 * What the prose takes beside the live view. A step is read before it is
 * turned, so the two start level — the 1 : 1.1 the two columns stood at before
 * either could be dragged — and a student who would rather watch the molecule
 * than read about it drags the splitter over.
 */
export const DEFAULT_TUTORIAL_SPLIT = 48;

/**
 * The narrowest row that is still split, in pixels. Under it the prose and the
 * view stack: a 3D canvas in half a phone is not a view.
 */
export const TUTORIAL_STACK_BELOW = 900;

/**
 * What the 3D view takes beside the viewer's details. The crystal is what the
 * page is for, and the details are read once, so the view leads.
 */
export const DEFAULT_VIEWER_SPLIT = 68;

/**
 * The narrowest row the viewer still splits, in pixels: the details then go
 * under the view, which keeps the whole width.
 */
export const VIEWER_STACK_BELOW = 800;
