import type { ReactElement } from 'react';

import type { DisplayFlagKey } from '../../state/index.ts';
import { TILES_RANGE, setTiles, toggleDisplayFlag } from '../../state/index.ts';

import './pattern.css';

/** What {@link PlaneControls} switches. */
export interface PlaneControlsProps {
  /** Whether the group repeats in two directions or along one strip. */
  readonly wallpaper: boolean;
  /** Whether the cell outline is drawn. */
  readonly showCell: boolean;
  /** Whether the region the motif was drawn in is outlined. */
  readonly showDomain: boolean;
  /** How much of the pattern is drawn. */
  readonly tiles: number;
}

/**
 * The layers the pattern is drawn with, and how much of it there is.
 *
 * The two layers are the site's shared display flags, so a link that pins them
 * pins them here in the same words as on the other workbenches.
 * @param props - What is switched on, and how many cells are drawn.
 * @returns The chip bar.
 */
export function PlaneControls(props: PlaneControlsProps): ReactElement {
  const { wallpaper, showCell, showDomain, tiles } = props;
  return (
    <div className="chip-bar">
      <div className="chip-row">
        <span className="chip-row__label">Layers</span>
        <div className="chip-row__chips">
          <FlagChip
            flag="unitCell"
            label={wallpaper ? 'Unit cell' : 'Period'}
            title="Outline the cell the group repeats."
            on={showCell}
          />
          <FlagChip
            flag="fundamentalDomain"
            label="Motif region"
            title="Outline the square the motif itself is drawn in. The group's own asymmetric unit is named in the readout."
            on={showDomain}
          />
        </div>
      </div>
      <div className="chip-row">
        <span className="chip-row__label">
          {wallpaper ? 'Cells' : 'Periods'}
        </span>
        <div className="chip-row__chips">
          <Step label="−" to={tiles - 1} at={tiles} />
          <span className="plane-count">{tiles}</span>
          <Step label="+" to={tiles + 1} at={tiles} />
        </div>
      </div>
    </div>
  );
}

/** One layer, as the chip that switches it. */
function FlagChip(props: {
  readonly flag: DisplayFlagKey;
  readonly label: string;
  readonly title: string;
  readonly on: boolean;
}): ReactElement {
  return (
    <button
      type="button"
      className="chip"
      aria-pressed={props.on}
      title={props.title}
      onClick={() => {
        toggleDisplayFlag(props.flag);
      }}
    >
      {props.label}
    </button>
  );
}

/** One end of the stepper that says how much of the pattern is drawn. */
function Step(props: {
  readonly label: string;
  readonly to: number;
  readonly at: number;
}): ReactElement {
  const outside =
    props.to < TILES_RANGE.minimum || props.to > TILES_RANGE.maximum;
  return (
    <button
      type="button"
      className="chip chip--action"
      disabled={outside}
      aria-label={props.to < props.at ? 'Draw fewer' : 'Draw more'}
      onClick={() => {
        setTiles(props.to);
      }}
    >
      {props.label}
    </button>
  );
}
