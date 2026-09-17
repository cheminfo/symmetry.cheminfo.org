/**
 * What a question is looked at while it is answered.
 *
 * Two levels, because the picture is both the question and the aid. Plain, it
 * is the object as the student must read it — the structure, the pattern.
 * *Show diagram* adds what would otherwise have to be held in the head: the
 * symmetry elements over the structure, the element diagram beside the tiling,
 * the coordinate list the cell is generated from.
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import type { Exercise } from '../../data/exercises/types.ts';
import { spaceGroup } from '../../symmetry/spaceGroups.ts';
import {
  PlaneStage,
  PositionsPanel,
  moleculeScene,
} from '../tutorial/index.ts';
import { ViewerPanel } from '../viewer/index.ts';

import { moleculeOf, spaceGroupOf } from './figureSubject.ts';
import { drawnLayerKey, shownLayerKey } from './layerState.ts';

/** What {@link ExerciseFigure} needs. */
export interface ExerciseFigureProps {
  /** The question on screen. */
  readonly exercise: Exercise;
  /** Whether the aid is added to the picture. @default false */
  readonly detail?: boolean;
}

/**
 * The picture of a question, or nothing when it has none.
 * @param props - See {@link ExerciseFigureProps}.
 * @returns The figure.
 */
export function ExerciseFigure(
  props: ExerciseFigureProps,
): ReactElement | null {
  useSignals();
  const { exercise, detail = false } = props;
  const molecule = moleculeOf(exercise);
  if (molecule !== null) {
    return (
      <MoleculeFigure
        moleculeId={molecule}
        detail={detail}
        layers={drawnLayerKey(exercise, shownLayerKey())}
      />
    );
  }
  if (exercise.kind === 'identify-plane-group') {
    return (
      <PlaneStage
        groupId={exercise.pattern.group}
        namespace={exercise.pattern.namespace}
        motifId={exercise.pattern.motif}
        tiles={4}
        diagram={detail}
      />
    );
  }
  const number = spaceGroupOf(exercise);
  if (number !== null && detail) {
    return <PositionsPanel setting={spaceGroup(number)} />;
  }
  return null;
}

function MoleculeFigure(props: {
  readonly moleculeId: string;
  readonly detail: boolean;
  readonly layers: string;
}): ReactElement {
  const { moleculeId, detail, layers } = props;
  const built = useMemo(() => {
    const wanted = new Set(layers.split(' '));
    return moleculeScene(moleculeId, {
      axes: detail || wanted.has('axes'),
      mirrors: detail || wanted.has('mirrors'),
      inversion: detail || wanted.has('inversion'),
      improper: detail || wanted.has('improper'),
      labels: detail,
    });
  }, [moleculeId, detail, layers]);

  return (
    <ViewerPanel
      scene={built.scene}
      height={320}
      caption={moleculeId.replaceAll('-', ' ')}
    />
  );
}
