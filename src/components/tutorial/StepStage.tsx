/**
 * The live view of a step: the object it opens, drawn with the layers it names.
 *
 * It is the step's workbench rather than a picture of one — the layers are the
 * site's own, the 3D view turns under the pointer, and the operation replays on
 * demand. What it deliberately is not is a second copy of the full workbench:
 * *Open in the workbench* carries the same configuration there.
 */

import { Button } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { splitObjectRef } from '../../data/glossary/types.ts';
import type { TutorialStep } from '../../data/tutorial/index.ts';
import { state } from '../../state/index.ts';
import { spaceGroup } from '../../symmetry/spaceGroups.ts';
import { ViewerPanel } from '../viewer/index.ts';

import { PlaneStage } from './PlaneStage.tsx';
import { crystalScene } from './crystalScene.ts';
import { moleculeScene } from './moleculeScene.ts';

/** What {@link StepStage} needs. */
export interface StepStageProps {
  /** The step on screen. */
  readonly step: TutorialStep;
}

/**
 * The object of a step, drawn live.
 * @param props - See {@link StepStageProps}.
 * @returns The view for the workbench the step's object belongs to.
 */
export function StepStage(props: StepStageProps): ReactElement {
  const { step } = props;
  const { kind, id } = splitObjectRef(step.object);
  if (kind === 'molecule') {
    return <MoleculeStage moleculeId={id} animate={step.animate} />;
  }
  if (kind === 'spaceGroup') return <CrystalStage number={Number(id)} />;
  return <PlaneStage groupId={id} namespace={kind} />;
}

function MoleculeStage(props: {
  readonly moleculeId: string;
  readonly animate: string | undefined;
}): ReactElement {
  useSignals();
  const { moleculeId, animate } = props;
  const { flags } = state.preferences;
  const axes = flags.axes.value;
  const mirrors = flags.mirrors.value;
  const inversion = flags.inversion.value;
  const improper = flags.improper.value;
  const labels = flags.labels.value;
  const [nonce, setNonce] = useState(1);

  const built = useMemo(
    () =>
      moleculeScene(moleculeId, {
        axes,
        mirrors,
        inversion,
        improper,
        labels,
        play: animate === undefined ? undefined : { nonce, name: animate },
      }),
    [moleculeId, axes, mirrors, inversion, improper, labels, animate, nonce],
  );

  return (
    <div className="step-stage">
      <ViewerPanel
        scene={built.scene}
        caption={`${built.group}, ${built.operations.length} operations, ${built.scene.elements?.length ?? 0} elements drawn`}
      />
      {animate !== undefined && (
        <Button
          icon="play"
          text={`Apply ${animate} again`}
          onClick={() => {
            setNonce((played) => played + 1);
          }}
        />
      )}
    </div>
  );
}

function CrystalStage(props: { readonly number: number }): ReactElement {
  useSignals();
  const { number } = props;
  const { flags } = state.preferences;
  const unitCell = flags.unitCell.value;
  const axes = flags.axes.value;
  const mirrors = flags.mirrors.value;
  const glides = flags.glides.value;
  const screws = flags.screws.value;
  const inversion = flags.inversion.value;
  const showOrbit = flags.orbit.value;
  const labels = flags.labels.value;
  const setting = spaceGroup(number);

  const built = useMemo(
    () =>
      crystalScene(setting, {
        unitCell,
        axes,
        mirrors,
        glides,
        screws,
        inversion,
        orbit: showOrbit,
        labels,
      }),
    [
      setting,
      unitCell,
      axes,
      mirrors,
      glides,
      screws,
      inversion,
      showOrbit,
      labels,
    ],
  );

  return (
    <div className="step-stage">
      <ViewerPanel
        scene={built.scene}
        caption={`${setting.hmSetting} — one general point becomes ${built.multiplicity}, with ${built.elementCount} elements drawn`}
        emptyMessage="Switch the orbit on to put a point in the cell."
      />
    </div>
  );
}
