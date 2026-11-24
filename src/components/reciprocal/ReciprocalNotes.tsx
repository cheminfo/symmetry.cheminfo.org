/**
 * What to look at in the picture on screen, and — for a crystal — its cell
 * beside its reciprocal cell, so the numbers on the arrows can be checked.
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { formatDecimal } from 'react-cheminfo/core';

import { exampleById } from '../../reciprocal/examples.ts';
import { FIELD_SIZE } from '../../reciprocal/fourier.ts';
import type { LatticeSettings } from '../../reciprocal/lattice.ts';
import { latticeVectors, reciprocalVectors } from '../../reciprocal/lattice.ts';
import type { ReciprocalSource } from '../../state/index.ts';
import { shownLattice, state } from '../../state/index.ts';

/**
 * The notes card.
 * @returns The observation, and the two cells for a crystal.
 */
export function ReciprocalNotes(): ReactElement {
  useSignals();
  const source = state.view.reciprocal.source.value;
  const lattice = shownLattice();
  return (
    <div className="reciprocal-notes" data-testid="reciprocal-notes">
      <p className="reciprocal-notes__lead">{noteOf(source)}</p>
      {lattice === null ? null : <CellTable lattice={lattice} />}
    </div>
  );
}

function noteOf(source: ReciprocalSource): string {
  if (source.kind === 'photo') {
    return 'Your picture, cut to its central square and faded at its edges, so the seam between its copies puts no cross through the transform.';
  }
  if (source.kind === 'lattice') {
    return 'Your crystal. Change a, b or γ and watch a*, b* and γ* answer: a* stays perpendicular to b, and b* to a.';
  }
  return exampleById(source.id)?.note ?? '';
}

function CellTable(props: { readonly lattice: LatticeSettings }): ReactElement {
  const { lattice } = props;
  const reciprocal = reciprocalVectors(latticeVectors(lattice));
  const aStar = Math.hypot(reciprocal.a.x, reciprocal.a.y);
  const bStar = Math.hypot(reciprocal.b.x, reciprocal.b.y);
  return (
    <table className="reciprocal-cell">
      <thead>
        <tr>
          <th scope="col">Real space</th>
          <th scope="col">Reciprocal space</th>
          <th scope="col">On the transform</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>a = {formatDecimal(lattice.a, 1)} px</td>
          <td>a* = 1 / (a sin γ) = {formatDecimal(aStar, 4)} px⁻¹</td>
          <td>{formatDecimal(aStar * FIELD_SIZE, 1)} px</td>
        </tr>
        <tr>
          <td>b = {formatDecimal(lattice.b, 1)} px</td>
          <td>b* = 1 / (b sin γ) = {formatDecimal(bStar, 4)} px⁻¹</td>
          <td>{formatDecimal(bStar * FIELD_SIZE, 1)} px</td>
        </tr>
        <tr>
          <td>γ = {formatDecimal(lattice.gamma, 1)}°</td>
          <td>γ* = 180° − γ = {formatDecimal(180 - lattice.gamma, 1)}°</td>
          <td />
        </tr>
      </tbody>
    </table>
  );
}
