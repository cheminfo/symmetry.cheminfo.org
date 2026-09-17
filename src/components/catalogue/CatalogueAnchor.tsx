import type { MouseEvent, ReactNode } from 'react';

import { handledHere } from './anchorClick.ts';
import { openTarget, targetHref } from './target.ts';
import type { CatalogueTarget } from './types.ts';

/** What a link inside a catalogue needs. */
export interface CatalogueAnchorProps {
  readonly target: CatalogueTarget;
  readonly className?: string;
  /** What the pointer is told when it rests on the link. @default undefined */
  readonly title?: string;
  readonly children: ReactNode;
}

/**
 * A real link that moves the page without reloading it.
 *
 * The `href` is the address, so a crawler follows it, a middle click opens it
 * in a tab and the status bar says where it goes. A plain left click is handled
 * here instead, which is what keeps the 3D canvas and the group tables from
 * being rebuilt on every step through a catalogue.
 * @param props - See {@link CatalogueAnchorProps}.
 * @returns The link.
 */
export function CatalogueAnchor(props: CatalogueAnchorProps) {
  const { target, className, title, children } = props;
  function handleClick(event: MouseEvent<HTMLAnchorElement>): void {
    if (!handledHere(event)) return;
    event.preventDefault();
    openTarget(target);
  }
  return (
    <a
      href={targetHref(target)}
      className={className}
      title={title}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
