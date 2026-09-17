/**
 * The crystal workbench: the asymmetric unit, a space group, and the cell the
 * two of them make.
 *
 * Three panes. The left one is what the student types — the library, the group,
 * the six cell parameters the setting leaves free, and the atoms in fractional
 * coordinates. The middle one draws the cell with its symmetry elements in it.
 * The right one reads the cell back: what each site sits on, the general
 * positions, and every element the group puts in the cell.
 *
 * Every atom on screen was generated here by exact integer arithmetic on the
 * coset list, never by molstar: its expansion neither wraps into the cell nor
 * deduplicates a special position, so halite's sodium would be drawn 48 times
 * on top of itself.
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { PagePart } from 'react-cheminfo/ui';

import {
  AtomTable,
  CellEditor,
  CellReadout,
  CifPanel,
  CrystalView,
  ElementsPanel,
  GroupPicker,
  LABEL_LIMIT,
  PositionsPanel,
  StructurePicker,
  analyseCrystal,
  crystalAtoms,
  crystalDrawings,
  sceneCaption,
  useCrystalDraft,
} from '../components/crystals/index.ts';
import type { ViewerScene } from '../components/viewer/index.ts';
import {
  withCellParameter,
  withSite,
  withSiteAdded,
  withSiteRemoved,
} from '../crystal/draft.ts';
import { largestRepeatThatFits } from '../crystal/supercell.ts';
import { setSupercell, state } from '../state/index.ts';

import '../components/crystals/crystals.css';

/**
 * The page.
 * @returns The cell being built, drawn, and read back.
 */
export function Crystals(): ReactElement {
  useSignals();
  const {
    changeGroup,
    changeSetting,
    draft,
    edit,
    openFile,
    openStructure,
    problem,
    setting,
    structureId,
  } = useCrystalDraft();

  const flags = state.preferences.flags;
  const axes = flags.axes.value;
  const screws = flags.screws.value;
  const mirrors = flags.mirrors.value;
  const glides = flags.glides.value;
  const inversion = flags.inversion.value;
  const improper = flags.improper.value;
  const labels = flags.labels.value;
  const unitCell = flags.unitCell.value;
  const asymmetricUnit = flags.asymmetricUnit.value;
  const asked = state.view.crystals.supercell.value;

  // Expanding 192 operations over twenty-two sites is real work, and handing
  // the viewer a new atom array every render would redraw the whole scene.
  const analysis = useMemo(
    () => analyseCrystal(draft, setting),
    [draft, setting],
  );

  const perCell = asymmetricUnit ? draft.sites.length : analysis.atoms.length;
  const cells = largestRepeatThatFits(perCell, asked);
  const atoms = useMemo(
    () => crystalAtoms(analysis, cells, asymmetricUnit),
    [analysis, cells, asymmetricUnit],
  );
  const elements = useMemo(
    () =>
      crystalDrawings(analysis, {
        axes,
        screws,
        mirrors,
        glides,
        inversion,
        improper,
      }),
    [analysis, axes, screws, mirrors, glides, inversion, improper],
  );
  // A name on every one of fifty rods through one cell is a wall of text, and
  // the list on the right names them all whatever the view is showing.
  const named = labels && elements.length <= LABEL_LIMIT;
  const scene = useMemo<ViewerScene>(
    () => ({
      atoms,
      cell: unitCell ? analysis.lattice.cell : null,
      repeat: [cells, cells, cells],
      elements,
      labels: named,
    }),
    [atoms, analysis, cells, elements, named, unitCell],
  );

  return (
    <>
      <PagePart part="intro">
        <header>
          <h1 style={headingStyle}>Space groups and crystals</h1>
          <p style={leadStyle}>
            Type an asymmetric unit, pick one of the 230 groups, and watch the
            symmetry fill the cell.
          </p>
        </header>
      </PagePart>

      <div className="pane-grid">
        <div className="pane">
          <PagePart part="cell">
            <div className="xtl-panel__title">Structures</div>
            <StructurePicker
              selectedId={structureId}
              onSelect={openStructure}
            />
            <div className="xtl-panel__title">Space group</div>
            <GroupPicker
              setting={setting}
              onSelectNumber={changeGroup}
              onSelectSetting={changeSetting}
            />
            <div className="xtl-panel__title">Cell</div>
            <CellEditor
              cell={draft.cell}
              setting={setting}
              onChange={(key, value) => {
                edit(withCellParameter(draft, setting, key, value));
              }}
            />
            <div className="xtl-panel__title">Asymmetric unit</div>
            <AtomTable
              sites={draft.sites}
              onChange={(index, patch) => {
                edit(withSite(draft, index, patch));
              }}
              onAdd={() => {
                edit(withSiteAdded(draft));
              }}
              onRemove={(index) => {
                edit(withSiteRemoved(draft, index));
              }}
            />
          </PagePart>
        </div>

        <div className="pane">
          <CrystalView
            scene={scene}
            caption={sceneCaption({
              name: draft.name,
              atomsPerCell: analysis.atoms.length,
              cells,
              asked,
              elements: elements.length,
              named,
            })}
            supercell={asked}
            onSupercell={setSupercell}
          />
          <PagePart part="export">
            <CifPanel
              draft={draft}
              setting={setting}
              problem={problem}
              onFile={openFile}
            />
          </PagePart>
        </div>

        <div className="pane pane--wide">
          <CellReadout analysis={analysis} />
          <PagePart part="positions">
            <PositionsPanel analysis={analysis} />
          </PagePart>
          <PagePart part="operations">
            <ElementsPanel analysis={analysis} />
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
