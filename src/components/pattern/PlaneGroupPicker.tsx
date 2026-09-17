import { SegmentedControl } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import { FRIEZE_GROUPS } from '../../data/friezeGroups.ts';
import { WALLPAPER_GROUPS } from '../../data/planeGroups.ts';
import { DEFAULT_PLANE_GROUP, selectPlaneGroup } from '../../state/index.ts';

import type { PlaneGroupChoice } from './planeGroupRef.ts';
import { DEFAULT_FRIEZE_GROUP, planeGroupId } from './planeGroupRef.ts';

import './pattern.css';

/** What {@link PlaneGroupPicker} needs. */
export interface PlaneGroupPickerProps {
  /** The group on screen, from `resolvePlaneGroup`. */
  readonly choice: PlaneGroupChoice;
}

/**
 * The 17 and the 7, as two sets a student switches between.
 *
 * They are two sets rather than one list because `p1`, `p2` and `p1m1` name a
 * different group in each, and a single list would give two groups one name.
 * @param props - Which group is open.
 * @returns The picker.
 */
export function PlaneGroupPicker(props: PlaneGroupPickerProps): ReactElement {
  const { choice } = props;
  return (
    <div className="chip-bar">
      <SegmentedControl
        size="small"
        fill
        value={choice.kind}
        options={[
          { label: 'Wallpaper · 17', value: 'wallpaper' },
          { label: 'Frieze · 7', value: 'frieze' },
        ]}
        onValueChange={(value) => {
          selectPlaneGroup(
            value === 'frieze'
              ? planeGroupId('frieze', DEFAULT_FRIEZE_GROUP)
              : DEFAULT_PLANE_GROUP,
          );
        }}
      />
      <div className="plane-groups">
        {choice.kind === 'wallpaper'
          ? WALLPAPER_GROUPS.map((group) => (
              <GroupChip
                key={group.id}
                id={group.id}
                value={group.id}
                active={choice.group.id === group.id}
                title={`${group.number}. ${group.full} · orbifold ${group.orbifold} · ${group.lattice} lattice · ${count(group.operationsPerCell)} per cell`}
              />
            ))
          : FRIEZE_GROUPS.map((group) => (
              <GroupChip
                key={group.id}
                id={group.id}
                value={planeGroupId('frieze', group.id)}
                active={choice.group.id === group.id}
                title={`${group.number}. ${group.full} · orbifold ${group.orbifold} · ${group.conway} · ${count(group.operationsPerPeriod)} per period`}
              />
            ))}
      </div>
    </div>
  );
}

/** One group of either set. */
function GroupChip(props: {
  readonly id: string;
  readonly value: string;
  readonly active: boolean;
  readonly title: string;
}): ReactElement {
  return (
    <button
      type="button"
      className="chip"
      aria-pressed={props.active}
      title={props.title}
      onClick={() => {
        selectPlaneGroup(props.value);
      }}
    >
      {props.id}
    </button>
  );
}

/** p1 has one operation, not one operations. */
function count(operations: number): string {
  return operations === 1 ? '1 operation' : `${operations} operations`;
}
