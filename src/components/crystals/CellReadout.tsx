/**
 * What the cell turns out to be: the group's own facts, what one cell holds,
 * and what each line of the asymmetric unit sits on.
 *
 * The site readout is a **multiplicity and a site symmetry**, never a Wyckoff
 * letter. The letter is a convention that cannot be derived from the operation
 * list; the multiplicity is the orbit and the site symmetry is the stabiliser,
 * both exact, and between them they say everything `4b` says without a table
 * nobody can check.
 */

import type { ReactElement } from 'react';
import { MF } from 'react-mf';

import type { SiteReport } from '../../crystal/expand.ts';
import type { SpaceGroupSetting } from '../../symmetry/spaceGroups.ts';

import { elementTally } from './crystalLabels.ts';
import type { CrystalAnalysis } from './crystalScene.ts';

import './crystals.css';

/** Props of {@link CellReadout}. */
export interface CellReadoutProps {
  readonly analysis: CrystalAnalysis;
}

/**
 * The reading of the cell.
 * @param props - See {@link CellReadoutProps}.
 * @returns The group's facts, the cell contents and the site table.
 */
export function CellReadout(props: CellReadoutProps): ReactElement {
  const { analysis } = props;
  const { atoms, composition, elements, lattice, setting, sites } = analysis;

  return (
    <div className="xtl-panel">
      <div className="xtl-panel__title">This cell</div>
      <div className="xtl-facts">
        <Fact label="Group">{`${setting.number} · ${setting.hmSetting}`}</Fact>
        <Fact label="System">{setting.crystalSystem}</Fact>
        <Fact label="Class">{setting.crystalClass}</Fact>
        <Fact label="Operations">{String(setting.multiplicity)}</Fact>
        <Fact label="Volume">{`${lattice.volume.toFixed(2)} Å³`}</Fact>
        <Fact label="Atoms">{String(atoms.length)}</Fact>
      </div>
      <p className="xtl-note">
        {describeSetting(setting)} One cell holds{' '}
        <Composition composition={composition} />.
      </p>
      <div className="xtl-panel__title">Elements in the cell</div>
      <p className="xtl-note">{tally(elements)}</p>
      <div className="xtl-panel__title">Sites</div>
      <div className="xtl-rows">
        {sites.map((site) => (
          <SiteRow key={site.label} site={site} />
        ))}
      </div>
    </div>
  );
}

function SiteRow(props: { readonly site: SiteReport }): ReactElement {
  const { site } = props;
  return (
    <div className="xtl-row">
      <span className="xtl-row__index">{site.element}</span>
      <span>{site.label}</span>
      <span className="xtl-mono">
        {site.position.map((value) => round(value)).join(', ')}
      </span>
      <span className="xtl-row__detail">
        multiplicity {site.multiplicity}, site symmetry {site.siteSymmetry}
        {site.general ? ' (general)' : ''}
      </span>
    </div>
  );
}

function Fact(props: {
  readonly label: string;
  readonly children: string;
}): ReactElement {
  return (
    <span className="xtl-fact">
      <span className="xtl-fact__label">{props.label}</span>
      <span className="xtl-fact__value">{props.children}</span>
    </span>
  );
}

/** The cell's contents as a formula, so `react-mf` sets the subscripts. */
function Composition(props: {
  readonly composition: ReadonlyMap<string, number>;
}): ReactElement {
  const parts: string[] = [];
  for (const [element, count] of props.composition) {
    parts.push(count === 1 ? element : `${element}${round(count)}`);
  }
  return <MF mf={parts.join('')} />;
}

/** The element counts as one sentence, or that there are none to count. */
function tally(elements: CrystalAnalysis['elements']): string {
  const counted = elementTally(elements).map(
    ([kind, count]) => `${count} ${kindLabel(kind, count)}`,
  );
  return counted.length === 0
    ? 'None but the identity.'
    : `${counted.join(', ')}.`;
}

/** The three facts about a group a student is asked for by name. */
function describeSetting(setting: SpaceGroupSetting): string {
  const traits: string[] = [
    setting.centrosymmetric ? 'Centrosymmetric' : 'Not centrosymmetric',
  ];
  if (setting.sohncke) traits.push('Sohncke, so it can hold one enantiomer');
  traits.push(setting.symmorphic ? 'symmorphic' : 'non-symmorphic');
  return `${traits.join(', ')}.`;
}

/** English is not regular here: an axis has axes, so both forms are written. */
function kindLabel(kind: string, count: number): string {
  const forms = KIND_LABELS[kind];
  if (forms === undefined) return kind;
  return count === 1 ? forms[0] : forms[1];
}

const KIND_LABELS: Readonly<Record<string, readonly [string, string]>> = {
  rotation: ['rotation axis', 'rotation axes'],
  screw: ['screw axis', 'screw axes'],
  rotoinversion: ['rotoinversion axis', 'rotoinversion axes'],
  mirror: ['mirror plane', 'mirror planes'],
  glide: ['glide plane', 'glide planes'],
  inversion: ['inversion centre', 'inversion centres'],
};

function round(value: number): number {
  return Math.round(value * 100000) / 100000;
}
