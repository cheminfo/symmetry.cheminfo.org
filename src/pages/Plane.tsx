/**
 * The plane workbench: a motif, a group, and the pattern the two make.
 *
 * Two dimensions, so the whole page is SVG — nothing here touches molstar. The
 * tiling and the element diagram come from `src/components/plane`, the strip a
 * frieze is drawn on from `src/components/pattern`, and the group theory from
 * `src/symmetry`. This file wires them to the address.
 */

import { Card } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { PointerEvent, ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { pluralize } from 'react-cheminfo/core';
import { FigureDownload, PagePart } from 'react-cheminfo/ui';

import {
  FriezeFigure,
  MotifEditor,
  PlaneControls,
  PlaneGroupPicker,
  PlaneReadout,
  copyCaption,
  copyLabels,
  friezeElementShifts,
  motifFor,
  patternMotifScale,
  planeGroupCell,
  planeGroupOperations,
  resolvePlaneGroup,
} from '../components/pattern/index.ts';
import { ElementDiagram, PatternSvg } from '../components/plane/index.ts';
import { state } from '../state/index.ts';
import { planeElementTable } from '../symmetry/planeElements.ts';
import { cellShifts } from '../symmetry/planeGroups.ts';

import '../components/pattern/pattern.css';

/** Length of **a** in the picture's own units; the viewBox scales it to the pane. */
const CELL_SIZE = 100;

/** The most cells an element diagram stays legible over. */
const DIAGRAM_CELLS = 3;

/** The box the figure download saves. */
const FIGURE_ID = 'plane-figure';

/**
 * The plane workbench.
 * @returns The picker, the pattern, the element diagram and the readout.
 */
export function Plane(): ReactElement {
  useSignals();
  const groupId = state.view.plane.groupId.value;
  const motifId = state.view.plane.motifId.value;
  const tiles = state.view.plane.tiles.value;
  const showCell = state.preferences.flags.unitCell.value;
  const showDomain = state.preferences.flags.fundamentalDomain.value;
  const [copy, setCopy] = useState<string | null>(null);

  const choice = useMemo(() => resolvePlaneGroup(groupId), [groupId]);
  const operations = useMemo(() => planeGroupOperations(choice), [choice]);
  const labels = useMemo(() => copyLabels(operations), [operations]);
  const cell = useMemo(() => planeGroupCell(choice, CELL_SIZE), [choice]);
  const motif = useMemo(() => motifFor(motifId), [motifId]);
  const wallpaper = choice.kind === 'wallpaper';
  const diagramCells = Math.min(tiles, DIAGRAM_CELLS);
  const table = useMemo(
    () =>
      planeElementTable(
        operations,
        wallpaper
          ? cellShifts(2 * diagramCells)
          : friezeElementShifts(diagramCells),
      ),
    [diagramCells, operations, wallpaper],
  );
  const name = `${wallpaper ? 'Wallpaper' : 'Frieze'} group ${choice.group.id}`;
  const scale = patternMotifScale(operations.length, motif);

  /**
   * Which copy is under the pointer. The `<use>` carries the index of the
   * operation that drew it, so nothing has to be searched for.
   */
  function readCopy(event: PointerEvent<HTMLDivElement>): void {
    const target = event.target;
    if (!(target instanceof SVGElement)) return;
    const shift = target.dataset.shift;
    const label = labels[Number(target.dataset.operation)];
    setCopy(
      shift === undefined || label === undefined
        ? null
        : copyCaption(label, cellOf(shift)),
    );
  }

  return (
    <>
      <PagePart part="intro">
        <header className="plane-head">
          <h1>Plane patterns</h1>
          <p>
            Pick a group, draw a motif, and watch the operations fill the page.
          </p>
        </header>
      </PagePart>

      <div className="pane-grid">
        <div className="pane">
          <PagePart part="motif">
            <Card compact>
              <PlaneGroupPicker choice={choice} />
            </Card>
            <Card compact>
              <MotifEditor motifId={motifId} />
            </Card>
          </PagePart>
        </div>

        <div className="pane">
          <PagePart part="controls">
            <Card compact>
              <PlaneControls
                wallpaper={wallpaper}
                showCell={showCell}
                showDomain={showDomain}
                tiles={tiles}
              />
            </Card>
          </PagePart>

          <Card compact>
            <div
              className="plane-figure"
              id={FIGURE_ID}
              onPointerMove={readCopy}
              onPointerLeave={() => {
                setCopy(null);
              }}
            >
              {wallpaper ? (
                <PatternSvg
                  operations={operations}
                  cell={cell}
                  motif={motif}
                  tiles={tiles}
                  motifScale={scale}
                  showCell={showCell}
                  showDomain={showDomain}
                  title={`${name}, tiled with ${motif.name.toLowerCase()}`}
                />
              ) : (
                <FriezeFigure
                  operations={operations}
                  cell={cell}
                  periods={tiles}
                  motif={motif}
                  motifScale={scale}
                  showCell={showCell}
                  showDomain={showDomain}
                  title={`${name}, repeated along its strip`}
                />
              )}
            </div>
            <p className="plane-caption">
              {copy === null ? (
                `${operations.length} ${pluralize(operations.length, 'copy', 'copies')} per ${wallpaper ? 'cell' : 'period'}. Point at one to read the element that made it.`
              ) : (
                <b>{copy}</b>
              )}
            </p>
            <PagePart part="export">
              <FigureDownload
                targetId={FIGURE_ID}
                fileName={`${choice.group.id}-pattern`}
                defaultFormat="svg"
                label="Save this pattern"
              />
            </PagePart>
          </Card>

          <Card compact>
            <h2 className="plane-panel-title">
              Symmetry elements, over {diagramCells}{' '}
              {wallpaper ? `× ${diagramCells} cells` : 'periods'}
            </h2>
            {wallpaper ? (
              <ElementDiagram
                operations={operations}
                cell={cell}
                cells={diagramCells}
                title={`${name}, symmetry elements`}
              />
            ) : (
              <FriezeFigure
                operations={operations}
                cell={cell}
                periods={diagramCells}
                elements={table}
                title={`${name}, symmetry elements`}
              />
            )}
            <p className="plane-note">
              A lens is a half turn, a triangle a third, a square a quarter, a
              hexagon a sixth. A heavy line is a mirror and a dashed one a
              glide.
            </p>
          </Card>
        </div>

        <div className="pane pane--wide">
          <Card compact>
            <PlaneReadout
              choice={choice}
              operations={operations}
              table={table}
            />
          </Card>
        </div>
      </div>
    </>
  );
}

/** `"1,0"` from a `data-shift`, as the pair of whole cells it names. */
function cellOf(shift: string): [number, number] {
  const parts = shift.split(',');
  return [Number(parts[0] ?? 0), Number(parts[1] ?? 0)];
}
