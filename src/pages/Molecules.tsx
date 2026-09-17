/**
 * The molecule workbench, which is what `/` opens on.
 *
 * Three panes: the library, the structure with its symmetry drawn on it, and
 * the reading — the group, the six questions that arrive at it, the operations
 * by class, and the character table. A visitor who typed the address came for
 * the tool, so it opens on a molecule with its elements already drawn.
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { PagePart, useIsHidden } from 'react-cheminfo/ui';

import {
  CharacterTable,
  NoCharacterTable,
} from '../components/molecules/CharacterTable.tsx';
import { FlowchartPanel } from '../components/molecules/FlowchartPanel.tsx';
import { GroupSummary } from '../components/molecules/GroupSummary.tsx';
import { MoleculePicker } from '../components/molecules/MoleculePicker.tsx';
import { MoleculeView } from '../components/molecules/MoleculeView.tsx';
import { OperationList } from '../components/molecules/OperationList.tsx';
import { analyseMolecule } from '../components/molecules/assignment.ts';
import { resolveMolecule } from '../components/molecules/library.ts';
import { viewerOperationOf } from '../components/molecules/viewerOperation.ts';
import type { ViewerScene } from '../components/viewer/index.ts';
import { animateOperation, selectMolecule, state } from '../state/index.ts';
import { characterTableOf } from '../symmetry/characterTables.ts';
import type { SymmetryDrawing } from '../viewer/core.ts';

import '../components/molecules/molecules.css';

/**
 * The page.
 * @returns The library, the 3D view and the reading of the structure.
 */
export function Molecules(): ReactElement {
  useSignals();
  const entry = resolveMolecule(state.view.molecules.moleculeId.value);
  const analysis = useMemo(() => analyseMolecule(entry), [entry]);
  // `useIsHidden()` takes no argument and hands back the predicate.
  const isHidden = useIsHidden();
  const pickerHidden = isHidden('picker');

  const flags = state.preferences.flags;
  const axes = flags.axes.value;
  const mirrors = flags.mirrors.value;
  const inversion = flags.inversion.value;
  const improper = flags.improper.value;
  const orbit = flags.orbit.value;
  const labels = flags.labels.value;

  const elements = useMemo(() => {
    const drawn: SymmetryDrawing[] = [];
    if (axes) drawn.push(...analysis.layers.axes);
    if (mirrors) drawn.push(...analysis.layers.mirrors);
    if (inversion) drawn.push(...analysis.layers.inversion);
    if (improper) drawn.push(...analysis.layers.improper);
    if (orbit) drawn.push(...analysis.orbit);
    return drawn;
  }, [analysis, axes, mirrors, inversion, improper, orbit]);

  // A cue rather than a flag, so pressing the same operation twice plays it
  // twice; the operation itself lives in the address, so a link replays it.
  const [presses, setPresses] = useState(0);
  const playing = state.view.molecules.operation.value;
  const chosen =
    playing === null
      ? undefined
      : analysis.detection.operations[analysis.names.indexOf(playing)];
  const play = useMemo(() => {
    if (chosen === undefined) return null;
    const applied = viewerOperationOf(chosen);
    return applied === null ? null : { nonce: presses, operation: applied };
  }, [chosen, presses]);

  const detected = analysis.detection.group;
  const schoenflies = analysis.group?.schoenflies ?? detected;
  const table = characterTableOf(detected);

  const scene = useMemo<ViewerScene>(
    () => ({ atoms: analysis.atoms, elements, labels, play }),
    [analysis, elements, labels, play],
  );

  return (
    <>
      <PagePart part="intro">
        <header>
          <h1 style={headingStyle}>Point groups of molecules</h1>
          <p style={leadStyle}>
            Pick a molecule, answer the six questions, and watch every operation
            of its group act on the structure.
          </p>
        </header>
      </PagePart>

      {/* A link that hides the library must not leave its column standing
          empty: the pane goes with it, and the two that are left share the
          width. */}
      <div className="pane-grid" data-panes={pickerHidden ? 'two' : 'three'}>
        <PagePart part="picker">
          <div className="pane">
            <div className="mol-panel__title">Library</div>
            <MoleculePicker
              selectedId={entry.id}
              onSelect={(id) => {
                selectMolecule(id);
              }}
            />
          </div>
        </PagePart>

        <div className="pane">
          <MoleculeView
            analysis={analysis}
            scene={scene}
            stereogram={flags.stereogram.value}
          />
        </div>

        <div className="pane pane--wide">
          <GroupSummary analysis={analysis} />
          <PagePart part="flowchart">
            <div className="mol-panel__title">How it is assigned</div>
            <FlowchartPanel
              key={entry.id}
              steps={analysis.steps}
              group={analysis.group?.schoenflies ?? analysis.walkGroup}
            />
          </PagePart>
          <PagePart part="operations">
            <div className="mol-panel__title">Operations, by class</div>
            <OperationList
              classes={analysis.classes}
              playing={playing}
              onPlay={(name) => {
                animateOperation(name);
                setPresses((count) => count + 1);
              }}
            />
          </PagePart>
          <PagePart part="characters">
            <div className="mol-panel__title">Character table</div>
            {table === undefined ? (
              <NoCharacterTable group={detected} schoenflies={schoenflies} />
            ) : (
              <CharacterTable table={table} schoenflies={schoenflies} />
            )}
          </PagePart>
        </div>
      </div>
    </>
  );
}

const headingStyle = { margin: 0, fontSize: '1.125rem' } as const;

const leadStyle = {
  margin: '2px 0 10px',
  color: 'var(--text-muted)',
  fontSize: '0.875rem',
} as const;
