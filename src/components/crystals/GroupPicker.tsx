/**
 * Which of the 230 space groups the cell is built in, and in which setting.
 *
 * A group is chosen by its number, because that is what the address carries and
 * the only name of a group that is stable; the symbol box is a way in for
 * somebody who knows `Pnma` or `P2(1)/c` and not `62` or `14`. The setting is a
 * second choice because the same group has up to eighteen of them, and the
 * origin, the unique axis and the axes an R group is written on all change the
 * coordinates without changing the group.
 */

import { HTMLSelect, InputGroup } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { SPACE_GROUP_SETTINGS } from '../../data/spaceGroups.ts';
import type { SpaceGroupSetting } from '../../symmetry/spaceGroups.ts';
import {
  resolveSpaceGroup,
  spaceGroupSettings,
} from '../../symmetry/spaceGroups.ts';

import { settingLabel } from './crystalLabels.ts';

import './crystals.css';

/** Props of {@link GroupPicker}. */
export interface GroupPickerProps {
  /** The setting in force. */
  readonly setting: SpaceGroupSetting;
  /** Build the cell in another group. */
  readonly onSelectNumber: (number: number) => void;
  /** Write the same group in another setting. */
  readonly onSelectSetting: (index: number) => void;
}

/**
 * The group and the setting.
 * @param props - See {@link GroupPickerProps}.
 * @returns The symbol box, the list of 230 and the settings of the one chosen.
 */
export function GroupPicker(props: GroupPickerProps): ReactElement {
  const { setting, onSelectNumber, onSelectSetting } = props;
  const [query, setQuery] = useState('');
  const [missed, setMissed] = useState(false);
  const settings = spaceGroupSettings(setting.number);

  return (
    <div className="xtl-panel">
      <InputGroup
        size="small"
        value={query}
        leftIcon="search"
        placeholder="Number or symbol: 225, Pnma, P2(1)/c, R-3c:R"
        aria-label="Find a space group by number or symbol"
        intent={missed ? 'danger' : 'none'}
        onValueChange={(value) => {
          setQuery(value);
          if (value.trim() === '') {
            setMissed(false);
            return;
          }
          const found = resolveSpaceGroup(value);
          setMissed(found === null);
          if (found !== null) {
            onSelectNumber(found.number);
            onSelectSetting(found.variant);
          }
        }}
      />
      {missed && (
        <p className="xtl-note">
          Nothing is spelled “{query}”. The 230 are listed below, and a setting
          can be named with `:1`, `:2`, `:H` or `:R`.
        </p>
      )}

      <HTMLSelect
        fill
        value={setting.number}
        aria-label="Space group"
        onChange={(event) => {
          onSelectNumber(Number(event.currentTarget.value));
        }}
      >
        {NUMBER_OPTIONS.map((option) => (
          <option key={option.number} value={option.number}>
            {option.label}
          </option>
        ))}
      </HTMLSelect>

      {settings.length > 1 && (
        <HTMLSelect
          fill
          value={setting.variant}
          aria-label="Setting"
          onChange={(event) => {
            onSelectSetting(Number(event.currentTarget.value));
          }}
        >
          {settings.map((entry) => (
            <option key={entry.variant} value={entry.variant}>
              {settingLabel(entry)}
            </option>
          ))}
        </HTMLSelect>
      )}
    </div>
  );
}

/** The 230, each named by its number and its standard short symbol. */
const NUMBER_OPTIONS: ReadonlyArray<{ number: number; label: string }> =
  SPACE_GROUP_SETTINGS.filter((setting) => setting.variant === 0).map(
    (setting) => ({
      number: setting.number,
      label: `${setting.number} · ${setting.hmShort}`,
    }),
  );
