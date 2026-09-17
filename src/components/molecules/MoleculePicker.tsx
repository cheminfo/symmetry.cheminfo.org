/**
 * The library, under the point group each molecule belongs to.
 *
 * Reading the list is itself a lesson: the groups run in the catalogue's order,
 * so scrolling goes from the molecule with no symmetry at all to the ones with
 * a hundred and twenty operations, and the neighbours of an entry are the
 * molecules it is most easily confused with.
 */

import { InputGroup } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useListKeyboardNavigation } from 'react-cheminfo/ui';
import { MF } from 'react-mf';

import type { MoleculeEntry } from '../../data/molecules.ts';

import { librarySections } from './library.ts';

import './molecules.css';

/** Props of {@link MoleculePicker}. */
export interface MoleculePickerProps {
  /** Which molecule is on the workbench. */
  readonly selectedId: string;
  /** Put another one on it. */
  readonly onSelect: (id: string) => void;
}

/** How far PageUp and PageDown move through the list. */
const PAGE_STEP = 8;

/**
 * The searchable library.
 * @param props - See {@link MoleculePickerProps}.
 * @returns The search box and the molecules under their groups.
 */
export function MoleculePicker(props: MoleculePickerProps): ReactElement {
  const { selectedId, onSelect } = props;
  const [query, setQuery] = useState('');
  const sections = librarySections(query);
  const list = useMemo(() => flatten(sections), [sections]);
  const selectedIndex = list.findIndex((entry) => entry.id === selectedId);

  const onKeyDown = useListKeyboardNavigation({
    length: list.length,
    selectedIndex,
    pageStep: PAGE_STEP,
    onSelect: (index) => {
      const entry = list[index];
      if (entry !== undefined) onSelect(entry.id);
    },
  });

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectedId, query]);

  return (
    <div className="mol-panel">
      <InputGroup
        value={query}
        onValueChange={setQuery}
        leftIcon="search"
        placeholder="Name, formula or group"
        aria-label="Search the molecule library"
        size="small"
      />
      {sections.length === 0 ? (
        <p className="mol-note">
          Nothing matches “{query}”. The library holds 56 molecules over 28
          groups.
        </p>
      ) : (
        <div
          className="mol-library"
          ref={listRef}
          tabIndex={0}
          role="listbox"
          aria-label="Molecule library"
          onKeyDown={onKeyDown}
        >
          {sections.map((section) => (
            <div
              className="mol-library__group"
              key={section.group.id}
              role="group"
              aria-label={section.group.schoenflies}
            >
              <div className="mol-library__name" aria-hidden>
                {section.group.schoenflies}
              </div>
              {section.molecules.map((entry) => (
                <button
                  type="button"
                  className="mol-library__item"
                  key={entry.id}
                  role="option"
                  aria-selected={entry.id === selectedId}
                  data-selected={entry.id === selectedId ? 'true' : undefined}
                  onClick={() => {
                    onSelect(entry.id);
                  }}
                >
                  <span>{entry.name}</span>
                  <span className="mol-library__formula">
                    <MF mf={entry.formula} />
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** The molecules of every section, in the order the list shows them. */
function flatten(
  sections: ReadonlyArray<{ readonly molecules: readonly MoleculeEntry[] }>,
): readonly MoleculeEntry[] {
  const list: MoleculeEntry[] = [];
  for (const section of sections) list.push(...section.molecules);
  return list;
}
