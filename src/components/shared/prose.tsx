/**
 * How this site draws the formulas its prose is written with.
 *
 * A molecular formula in a sentence is written `{{CO2}}` and is drawn by
 * `react-mf`, never as a line of digits or typed subscripts. The whole site
 * reads them through the one `GlossaryProvider` of the shell, so a step, a
 * question, a hint, a cheatsheet line and a definition draw a formula alike.
 */

import type { ReactNode } from 'react';
import { MF } from 'react-mf';

/**
 * One molecular formula of the prose.
 * @param mf - What was written between the braces.
 * @returns The formula, with its subscripts and its charge.
 */
export function renderMf(mf: string): ReactNode {
  return <MF mf={mf} />;
}
