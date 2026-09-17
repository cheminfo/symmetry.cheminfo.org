/**
 * The structures the site ships, simplest first.
 *
 * The order is the lesson: it runs from one atom in a cubic cell to
 * twenty-two in a triclinic one, and the neighbours of an entry are the
 * structures it is most usefully compared with — copper, halite and fluorite
 * are the same space group and nothing like one another.
 */

import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import { useListKeyboardNavigation } from 'react-cheminfo/ui';
import { MF } from 'react-mf';

import { STRUCTURES } from '../../data/structures/index.ts';

import './crystals.css';

/** Props of {@link StructurePicker}. */
export interface StructurePickerProps {
  /** Which structure is on the workbench, or `null` for an empty cell. */
  readonly selectedId: string | null;
  /** Put another one on it. */
  readonly onSelect: (id: string) => void;
}

/**
 * The library.
 * @param props - See {@link StructurePickerProps}.
 * @returns One row per structure, with what it is there to show.
 */
export function StructurePicker(props: StructurePickerProps): ReactElement {
  const { selectedId, onSelect } = props;
  const selectedIndex = STRUCTURES.findIndex(
    (entry) => entry.id === selectedId,
  );
  const onKeyDown = useListKeyboardNavigation({
    length: STRUCTURES.length,
    selectedIndex,
    onSelect: (index) => {
      const entry = STRUCTURES[index];
      if (entry !== undefined) onSelect(entry.id);
    },
  });

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  return (
    <div
      className="xtl-library"
      ref={listRef}
      tabIndex={0}
      role="listbox"
      aria-label="Structure library"
      onKeyDown={onKeyDown}
    >
      {STRUCTURES.map((entry) => (
        <button
          type="button"
          className="xtl-library__item"
          key={entry.id}
          role="option"
          aria-selected={entry.id === selectedId}
          data-selected={entry.id === selectedId ? 'true' : undefined}
          title={entry.teaches}
          onClick={() => {
            onSelect(entry.id);
          }}
        >
          <span>{entry.title}</span>
          <span className="xtl-library__formula">
            <MF mf={entry.formula} />
          </span>
        </button>
      ))}
    </div>
  );
}
