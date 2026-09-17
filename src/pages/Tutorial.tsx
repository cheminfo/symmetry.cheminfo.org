/**
 * The guided tour: eighteen steps, in three coloured strips.
 *
 * A step is a preloaded example rather than a slide. It opens its object with
 * the layers it names switched on, the student changes any of them, and *Open
 * in the workbench* carries that configuration to the full tool. The address
 * carries the step **id**, so `/tutorial/bravais` survives a step being
 * inserted before it.
 */

import { Button, Card } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { PagePart, TutorialStepStrip } from 'react-cheminfo/ui';

import { LayerChips } from '../components/molecules/LayerChips.tsx';
import {
  StepPanel,
  StepStage,
  StepText,
  SymmetryGlossary,
  layersOfMode,
  openStepInWorkbench,
  resolveStepIndex,
  useStepLayers,
} from '../components/tutorial/index.ts';
import { objectRefMode } from '../data/glossary/types.ts';
import type { TutorialStep } from '../data/tutorial/index.ts';
import {
  TUTORIAL_LEVEL_LABELS,
  TUTORIAL_STEPS,
} from '../data/tutorial/index.ts';
import { setTutorialStep, state } from '../state/index.ts';

/**
 * The tour.
 * @returns The step strip, the open step, and its live view.
 */
export function Tutorial(): ReactElement {
  useSignals();
  useStepLayers();
  const index = resolveStepIndex(state.view.tutorial.stepId.value);
  const step = TUTORIAL_STEPS[index] as TutorialStep;

  return (
    <SymmetryGlossary>
      <section className="tutorial">
        <PagePart part="steps">
          <Card compact className="tutorial__steps no-print">
            <TutorialStepStrip
              steps={TUTORIAL_STEPS}
              activeIndex={index}
              levelLabels={TUTORIAL_LEVEL_LABELS}
              onSelect={(position) => {
                setTutorialStep(TUTORIAL_STEPS[position]?.id ?? null);
              }}
            />
          </Card>
        </PagePart>

        <div className="tutorial__body">
          <div className="tutorial__prose">
            <PagePart part="text">
              <StepText
                step={step}
                position={index + 1}
                total={TUTORIAL_STEPS.length}
              />
            </PagePart>
            <PagePart part="demos">
              <Button
                icon="share"
                intent="primary"
                text={`Open ${workbenchName(step)} with this`}
                onClick={() => {
                  openStepInWorkbench(step);
                }}
              />
            </PagePart>
            <StepPanel step={step} />
          </div>

          <div className="tutorial__stage">
            <PagePart part="controls">
              <LayerChips keys={layersOfMode(objectRefMode(step.object))} />
            </PagePart>
            <StepStage key={step.id} step={step} />
          </div>
        </div>
      </section>
    </SymmetryGlossary>
  );
}

/** What the workbench a step's object belongs to is called on the page bar. */
function workbenchName(step: TutorialStep): string {
  const mode = objectRefMode(step.object);
  if (mode === 'crystal') return 'the crystal workbench';
  if (mode === 'plane') return 'the pattern workbench';
  return 'the molecule workbench';
}
