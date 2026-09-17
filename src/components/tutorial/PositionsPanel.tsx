/**
 * The general positions of a space-group setting.
 *
 * The coset list is what the cell is generated from, so it is printed as the
 * International Tables print it and numbered from 1: a student comparing the
 * two is comparing the same thing.
 */

import type { ReactElement } from 'react';

import type { SpaceGroupSetting } from '../../symmetry/spaceGroups.ts';

/** What {@link PositionsPanel} needs. */
export interface PositionsPanelProps {
  /** The setting whose coset list is printed. */
  readonly setting: SpaceGroupSetting;
}

/**
 * Every general position of one setting, numbered.
 * @param props - See {@link PositionsPanelProps}.
 * @returns The list, with the multiplicity above it.
 */
export function PositionsPanel(props: PositionsPanelProps): ReactElement {
  const { setting } = props;

  return (
    <div className="positions-panel">
      <p className="positions-panel__count">
        {`${setting.hmSetting} · multiplicity ${setting.multiplicity} · centring ${setting.centring}`}
      </p>
      <ol className="positions-panel__list">
        {setting.operations.map((triplet) => (
          <li key={triplet}>
            <code>{triplet}</code>
          </li>
        ))}
      </ol>
    </div>
  );
}
