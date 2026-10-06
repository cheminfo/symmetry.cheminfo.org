/**
 * The guided tour: eighteen steps, in three coloured strips.
 *
 * A step is a preloaded example rather than a slide. It opens its object with
 * the layers it names switched on, the student changes any of them, and *Open
 * in the workbench* carries that configuration to the full tool. The address
 * carries the step **id**, so `/tutorial/bravais` survives a step being
 * inserted before it.
 *
 * The prose and the live view share a row, and how it is divided is the
 * student's: one reading the derivation wants the text wide, one watching the
 * operation replay wants the canvas wide, and the share the splitter is left at
 * goes into the address, so a step handed out in a course opens the way it was
 * shared (`SplitRow`). On a narrow screen there is no room for two columns at
 * all and the same step reads as prose, then view.
 */

import { Button, Card } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import {
  PagePart,
  SplitRow,
  TutorialStepStrip,
  useIsHidden,
} from 'react-cheminfo/ui';

import { LayerChips } from '../components/molecules/LayerChips.tsx';
import {
  StepPanel,
  StepStage,
  StepText,
  SymmetryGlossary,
  layersOfMode,
  openStepInWorkbench,
  resolveStepIndex,
  stepHasPanel,
  useStepLayers,
} from '../components/tutorial/index.ts';
import { objectRefMode } from '../data/glossary/types.ts';
import type { TutorialStep } from '../data/tutorial/index.ts';
import {
  TUTORIAL_LEVEL_LABELS,
  TUTORIAL_STEPS,
} from '../data/tutorial/index.ts';
import {
  DEFAULT_TUTORIAL_SPLIT,
  TUTORIAL_STACK_BELOW,
  setTutorialSplit,
  setTutorialStep,
  state,
} from '../state/index.ts';

/**
 * The tour.
 * @returns The step strip, the open step, and its live view.
 */
export function Tutorial(): ReactElement {
  useSignals();
  useStepLayers();
  const isHidden = useIsHidden();
  const index = resolveStepIndex(state.view.tutorial.stepId.value);
  const step = TUTORIAL_STEPS[index] as TutorialStep;
  // The view is what the step is about, so it is never a part a link drops.
  // The prose half is: once its text, its demo button and its panel are all
  // gone there is nothing left to give a share of the row to.
  const hasProse =
    !isHidden('text') || !isHidden('demos') || stepHasPanel(step);

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

        <SplitRow
          ratio={state.view.tutorial.split.value}
          defaultRatio={DEFAULT_TUTORIAL_SPLIT}
          stackBelow={TUTORIAL_STACK_BELOW}
          onRatio={setTutorialSplit}
          start={
            hasProse ? (
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
            ) : null
          }
          end={
            <div className="tutorial__stage">
              <PagePart part="controls">
                <LayerChips keys={layersOfMode(objectRefMode(step.object))} />
              </PagePart>
              <StepStage key={step.id} step={step} />
            </div>
          }
        />
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
