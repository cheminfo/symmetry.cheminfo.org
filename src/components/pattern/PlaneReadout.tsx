import type { ReactElement } from 'react';
import { PagePart } from 'react-cheminfo/ui';

import { FRIEZE_SYMBOL_NOTE } from '../../data/friezeGroups.ts';
import { ALHAMBRA_NOTE } from '../../data/planeGroups.ts';
import type { CrystalOperation } from '../../symmetry/core/index.ts';
import { formatOperation } from '../../symmetry/core/index.ts';
import type { PlaneElementTable } from '../../symmetry/planeElements.ts';
import {
  formatPlaneElement,
  linesInCell,
  rotationsInCell,
} from '../../symmetry/planeElements.ts';

import { planeGroupFacts } from './planeFacts.ts';
import type { PlaneGroupChoice } from './planeGroupRef.ts';

import './pattern.css';

/** What {@link PlaneReadout} reads back. */
export interface PlaneReadoutProps {
  /** The group on screen. */
  readonly choice: PlaneGroupChoice;
  /** Its coset list, in the order the copies are drawn. */
  readonly operations: ReadonlyArray<CrystalOperation<2>>;
  /** Its elements, from `planeElementTable`. */
  readonly table: PlaneElementTable;
}

/**
 * What the group on screen is: its symbols, its generators, its lattice, the
 * elements the diagram draws, and where the pattern turns up.
 * @param props - The group, its operations and its elements.
 * @returns The readout.
 */
export function PlaneReadout(props: PlaneReadoutProps): ReactElement {
  const { choice, operations, table } = props;
  const wallpaper = choice.kind === 'wallpaper';
  const rotations = rotationsInCell(table);
  const lines = linesInCell(table);
  return (
    <div className="plane-readout">
      <section>
        <h2 className="plane-panel-title">The group</h2>
        <dl className="plane-facts">
          {planeGroupFacts(choice).map((fact) => (
            <Fact key={fact[0]} term={fact[0]} value={fact[1]} />
          ))}
        </dl>
      </section>

      <PagePart part="operations">
        <section>
          <h2 className="plane-panel-title">
            {wallpaper ? 'General positions' : 'Operations of one period'}
          </h2>
          <p className="plane-triplets">
            {operations
              .map((operation) => formatOperation(operation))
              .join(' · ')}
          </p>
        </section>
        <section>
          <h2 className="plane-panel-title">
            Elements {wallpaper ? 'in the cell' : 'on the strip'}
          </h2>
          {rotations.length + lines.length === 0 ? (
            <p className="plane-note">
              Translation only. Every copy is the motif slid along the lattice.
            </p>
          ) : (
            <ul className="plane-element-list">
              {rotations.map((rotation) => (
                <li key={`r${rotation.point.join(',')}`}>
                  {formatPlaneElement(rotation)}
                </li>
              ))}
              {lines.map((line) => (
                <li key={`l${line.normal.join(',')}=${line.offset}`}>
                  {formatPlaneElement(line)}
                </li>
              ))}
            </ul>
          )}
        </section>
      </PagePart>

      <section>
        <h2 className="plane-panel-title">Where you see it</h2>
        <p className="plane-note">{choice.group.example}</p>
        <p className="plane-note">
          {wallpaper ? ALHAMBRA_NOTE : FRIEZE_SYMBOL_NOTE}
        </p>
      </section>
    </div>
  );
}

/** One row of the fact list. */
function Fact(props: {
  readonly term: string;
  readonly value: string;
}): ReactElement {
  return (
    <>
      <dt>{props.term}</dt>
      <dd>{props.value}</dd>
    </>
  );
}
