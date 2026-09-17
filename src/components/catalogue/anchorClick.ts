/**
 * Which clicks a catalogue link handles itself.
 *
 * Its own file so `CatalogueAnchor.tsx` exports a component and nothing else,
 * which is what keeps fast refresh working on it — and so the rule can be
 * tested without a browser, since getting it wrong breaks middle click and
 * cmd-click, which nobody notices until somebody tries to open a group in a
 * second tab.
 */

/** The parts of a click this decision reads. */
export interface ClickIntent {
  /** Whether something upstream has already handled it. */
  readonly defaultPrevented: boolean;
  /** 0 is the left button; 1 is the middle one, which opens a tab. */
  readonly button: number;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
}

/**
 * Whether the page should move itself rather than let the browser navigate.
 *
 * Only a plain left click. Anything else is the browser's own navigation — a
 * new tab, a new window, a download — and taking it over would break it.
 * @param click - The click, or as much of it as this reads.
 * @returns True when the link handles it and calls `preventDefault`.
 */
export function handledHere(click: ClickIntent): boolean {
  return (
    !click.defaultPrevented &&
    click.button === 0 &&
    !click.metaKey &&
    !click.ctrlKey &&
    !click.shiftKey &&
    !click.altKey
  );
}
