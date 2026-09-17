/**
 * The verdict: which group these coordinates are in, and at what tolerance.
 *
 * The tolerance is written next to the answer rather than buried in a setting,
 * because a point group is a property of a structure *and* of how closely you
 * look: ethane at 58° is D₃ at a hundredth of an ångström and D₃d at a tenth.
 */

import { Callout, Tag } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { MF } from 'react-mf';

import { SymbolText } from './SymbolText.tsx';
import type { MoleculeAnalysis } from './assignment.ts';

import './molecules.css';

/** Props of {@link GroupSummary}. */
export interface GroupSummaryProps {
  readonly analysis: MoleculeAnalysis;
}

/**
 * What the molecule is, and what that already tells you about it.
 * @param props - See {@link GroupSummaryProps}.
 * @returns The group, its order, and the facts that follow from it.
 */
export function GroupSummary(props: GroupSummaryProps): ReactElement {
  const { analysis } = props;
  const { detection, entry, group, walkGroup } = analysis;
  const symbol = group?.schoenflies ?? detection.group;

  return (
    <div className="mol-panel">
      <div className="mol-verdict">
        <SymbolText symbol={symbol} className="mol-verdict__symbol" />
        <span className="mol-note">{orderText(detection.order)}</span>
      </div>
      <div className="mol-note">
        <MF mf={entry.formula} /> — {entry.why}
      </div>
      <div className="mol-facts">
        {group !== undefined && (
          <>
            {/* Facts, not statuses: a chiral molecule is not a success and a
                polar one is not a warning, so none of these carries an intent. */}
            <Tag minimal>{group.chiral ? 'Chiral' : 'Achiral'}</Tag>
            <Tag minimal>{group.polar ? 'Polar' : 'No dipole'}</Tag>
            {group.centrosymmetric && <Tag minimal>Has a centre</Tag>}
            {group.hermannMauguin !== null && (
              <Tag minimal>{group.hermannMauguin}</Tag>
            )}
          </>
        )}
        <Tag minimal>{`Read at ${detection.tolerance} Å`}</Tag>
      </div>
      {!detection.closed && (
        <Callout intent="warning" compact title="Only nearly symmetric">
          At {detection.tolerance} Å some of these operations do not quite map
          the structure onto itself. Read the group as a guess, and look again
          at a tighter tolerance.
        </Callout>
      )}
      {walkGroup !== detection.group && (
        <Callout intent="warning" compact title="The two routes disagree">
          The questions below arrive at {walkGroup}, while the closed set of
          operations is {detection.group}.
        </Callout>
      )}
      <div className="mol-flow__hint">{entry.geometrySource}</div>
    </div>
  );
}

/** How many operations the group has, in words a student can count against. */
function orderText(order: number): string {
  if (!Number.isFinite(order)) return 'infinitely many operations';
  return order === 1 ? '1 operation' : `${order} operations`;
}
