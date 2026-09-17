/**
 * The asymmetric unit, as a table you can type into.
 *
 * Fractional coordinates, because that is what a space group acts on and what
 * every CIF carries: the same three numbers describe the same atom whatever the
 * cell is stretched to. The colour is the element's family colour from the
 * shared periodic table, so it is read rather than chosen — the 3D view takes
 * its colours and its radii from the element too.
 */

import { Button } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { categorySwatch, elementBySymbol } from 'react-cheminfo/core';

import type { CrystalSite } from '../../crystal/cif/index.ts';

import './crystals.css';

/** Props of {@link AtomTable}. */
export interface AtomTableProps {
  /** The asymmetric unit, in the order it is shown. */
  readonly sites: readonly CrystalSite[];
  /** One field of one site changed. */
  readonly onChange: (index: number, patch: Partial<CrystalSite>) => void;
  /** A site added at the end. */
  readonly onAdd: () => void;
  /** A site removed. */
  readonly onRemove: (index: number) => void;
}

/**
 * The table.
 * @param props - See {@link AtomTableProps}.
 * @returns One row per site, plus the button that adds another.
 */
export function AtomTable(props: AtomTableProps): ReactElement {
  const { sites, onChange, onAdd, onRemove } = props;

  return (
    <div className="xtl-panel">
      <table className="xtl-atoms">
        <thead>
          <tr>
            <th aria-label="Colour" />
            <th>Label</th>
            <th>Element</th>
            <th>x</th>
            <th>y</th>
            <th>z</th>
            <th>Occ.</th>
            <th aria-label="Remove" />
          </tr>
        </thead>
        <tbody>
          {sites.map((site, index) => (
            // The row's identity is its place in the asymmetric unit, which is
            // what the file lists and what the readout counts down. The labels
            // are editable and may collide while one is being retyped, so they
            // cannot be it; the number cells key on the label instead, so a
            // removed row never leaves a half-typed value behind in the next.
            <tr key={index}>
              <td>
                <span
                  className="xtl-swatch"
                  style={{ background: swatchOf(site.element) }}
                  title={elementTitle(site.element)}
                />
              </td>
              <td>
                <input
                  value={site.label}
                  aria-label={`Label of site ${index + 1}`}
                  onChange={(event) => {
                    onChange(index, { label: event.target.value });
                  }}
                />
              </td>
              <td>
                <input
                  value={site.element}
                  aria-label={`Element of ${site.label}`}
                  title={elementTitle(site.element)}
                  onChange={(event) => {
                    onChange(index, { element: event.target.value.trim() });
                  }}
                />
              </td>
              <NumberCell
                key={`${site.label}-x`}
                value={site.x}
                label={`x of ${site.label}`}
                onCommit={(x) => {
                  onChange(index, { x });
                }}
              />
              <NumberCell
                key={`${site.label}-y`}
                value={site.y}
                label={`y of ${site.label}`}
                onCommit={(y) => {
                  onChange(index, { y });
                }}
              />
              <NumberCell
                key={`${site.label}-z`}
                value={site.z}
                label={`z of ${site.label}`}
                onCommit={(z) => {
                  onChange(index, { z });
                }}
              />
              <NumberCell
                key={`${site.label}-occupancy`}
                value={site.occupancy}
                label={`Occupancy of ${site.label}`}
                onCommit={(occupancy) => {
                  onChange(index, { occupancy });
                }}
              />
              <td>
                <Button
                  size="small"
                  variant="minimal"
                  icon="cross"
                  disabled={sites.length <= 1}
                  aria-label={`Remove ${site.label}`}
                  onClick={() => {
                    onRemove(index);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <Button
          size="small"
          variant="minimal"
          icon="plus"
          text="Add an atom"
          onClick={onAdd}
        />
      </div>
    </div>
  );
}

/**
 * One number of one site.
 *
 * The field holds the text while it has the focus, so `0.` and `-` survive
 * being typed; the moment it loses the focus the structure is the truth again
 * and the field shows what the structure says.
 */
function NumberCell(props: {
  readonly value: number;
  readonly label: string;
  readonly onCommit: (value: number) => void;
}): ReactElement {
  const { value, label, onCommit } = props;
  const [typed, setTyped] = useState<string | null>(null);

  return (
    <td>
      <input
        className="xtl-atoms__number"
        value={typed ?? format(value)}
        aria-label={label}
        inputMode="decimal"
        onFocus={() => {
          setTyped(format(value));
        }}
        onBlur={() => {
          setTyped(null);
        }}
        onChange={(event) => {
          const text = event.target.value;
          setTyped(text);
          const parsed = Number(text);
          if (text.trim() !== '' && Number.isFinite(parsed)) onCommit(parsed);
        }}
      />
    </td>
  );
}

/**
 * The element's family colour, which is what the 3D view reads it by. It is
 * derived rather than chosen: two sodiums the same colour is the point.
 */
function swatchOf(symbol: string): string {
  const element = elementBySymbol(symbol);
  return element === undefined
    ? 'var(--surface-sunken)'
    : categorySwatch(element.category).background;
}

/** What the element box says on hover: the element, or that there is none. */
function elementTitle(symbol: string): string {
  const element = elementBySymbol(symbol);
  if (element === undefined) return `No element is called “${symbol}”.`;
  return `${element.name} — ${element.category.replaceAll('-', ' ')}`;
}

/** Five decimals, which is what a refined coordinate is published to. */
function format(value: number): string {
  return String(Math.round(value * 100000) / 100000);
}
