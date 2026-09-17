/**
 * The panel a step opens beside its view.
 *
 * Four of them, each the thing the step is about: the questions that name a
 * group, its character table, its multiplication table, and the coordinate list
 * a cell is generated from. All four are the workbench's own panels, so a step
 * shows a student exactly what the tool will.
 */

import { Callout } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import { splitObjectRef } from '../../data/glossary/types.ts';
import { moleculeById } from '../../data/molecules.ts';
import { pointGroupById } from '../../data/pointGroups.ts';
import type { TutorialPanel, TutorialStep } from '../../data/tutorial/index.ts';
import { characterTableOf } from '../../symmetry/characterTables.ts';
import { spaceGroup } from '../../symmetry/spaceGroups.ts';
import { moleculePointGroup } from '../../symmetry/validate.ts';
import {
  CharacterTable,
  FlowchartPanel,
  NoCharacterTable,
  moleculeFlow,
} from '../molecules/index.ts';

import { GroupProductTable } from './GroupProductTable.tsx';
import { PositionsPanel } from './PositionsPanel.tsx';

/** What {@link StepPanel} needs. */
export interface StepPanelProps {
  /** The step on screen; its `panel` and its `object` pick what is drawn. */
  readonly step: TutorialStep;
}

/**
 * The step's panel, or nothing when the step asks for none.
 * @param props - See {@link StepPanelProps}.
 * @returns The panel.
 */
export function StepPanel(props: StepPanelProps): ReactElement | null {
  const { step } = props;
  if (step.panel === undefined) return null;
  const { kind, id } = splitObjectRef(step.object);
  if (kind === 'spaceGroup') {
    return step.panel === 'positions' ? (
      <PositionsPanel setting={spaceGroup(Number(id))} />
    ) : null;
  }
  if (kind !== 'molecule') return null;
  return <MoleculePanel panel={step.panel} moleculeId={id} />;
}

function MoleculePanel(props: {
  readonly panel: TutorialPanel;
  readonly moleculeId: string;
}): ReactElement | null {
  const { panel, moleculeId } = props;
  if (panel === 'flowchart') {
    const entry = moleculeById(moleculeId);
    if (entry === undefined) {
      return <Callout intent="warning">{`No molecule ${moleculeId}.`}</Callout>;
    }
    const flow = moleculeFlow(entry);
    // Keyed by the molecule, so opening another step starts the walk again
    // rather than carrying six revealed answers onto a new structure.
    return (
      <FlowchartPanel key={moleculeId} steps={flow.steps} group={flow.group} />
    );
  }
  const group = moleculePointGroup(moleculeId);
  if (panel === 'multiplication') return <GroupProductTable group={group} />;
  if (panel !== 'characterTable') return null;
  const table = characterTableOf(group);
  // The symbol, not the id: `Dinfh` is written `D∞h` everywhere else on the
  // site, and one group must not be spelled two ways.
  const schoenflies = pointGroupById(group).schoenflies;
  return table === undefined ? (
    <NoCharacterTable group={group} schoenflies={schoenflies} />
  ) : (
    <CharacterTable table={table} schoenflies={schoenflies} />
  );
}
